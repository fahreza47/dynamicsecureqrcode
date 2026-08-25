import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
  BackHandler,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL, SESSION_KEY, getTicketsKey } from '../config';
import { authFetch } from '../utils/authFetch';
import type { EventData, TicketData, UserTabScreenNavigationProp, UserSession } from '../types';
import Snackbar from '../components/Snackbar';
import { styles } from './UserDashboard.styles';

/**
 * UserDashboard.tsx — Layar Utama Penonton (SISI PENONTON)
 *
 * Alur pembelian tiket:
 * 1. Pilih event dari daftar
 * 2. Cek profil — jika origin (asal daerah) belum diisi, arahkan ke profil dulu
 * 3. Popup pilih tipe tiket (Regular / Silver / Gold / VIP)
 * 4. Konfirmasi beli → POST /buy_ticket → simpan ke AsyncStorage
 *
 * Data yang disimpan lokal:
 * - ticketSecret + signature: untuk generate QR offline (kriptografis)
 * - ticketType: untuk filter gate BLE di MyTicketScreen
 */

// Data event fallback untuk mode offline
const FALLBACK_EVENTS: EventData[] = [
  {
    id: 1,
    name: 'Konser Noah',
    date: '2026-05-15',
    location: 'GBK Jakarta',
    quota_regular: 100, quota_silver: 50, quota_gold: 30, quota_vip: 20,
    remaining_regular: 100, remaining_silver: 50, remaining_gold: 30, remaining_vip: 20,
  },
  {
    id: 2,
    name: 'Sheila on 7 Live',
    date: '2026-06-20',
    location: 'Istora Senayan',
    quota_regular: 150, quota_silver: 60, quota_gold: 40, quota_vip: 25,
    remaining_regular: 150, remaining_silver: 60, remaining_gold: 40, remaining_vip: 25,
  },
];

// Konfigurasi visual per tipe tiket — tampil di popup pemilihan
const TICKET_TYPES = [
  {
    id: 'regular' as const,
    label: 'Regular',
    emoji: '🔵',
    color: '#007BFF', // Azure Blue
    bg: '#eff6ff',
    border: '#bfdbfe',
    description: 'Akses area umum (Gerbang A, B, C)',
  },
  {
    id: 'silver' as const,
    label: 'Silver',
    emoji: '⚪',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    description: 'Akses area Silver (Gerbang A, B, C)',
  },
  {
    id: 'gold' as const,
    label: 'Gold',
    emoji: '🟡',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Akses area Gold (Gerbang A, B, C)',
  },
  {
    id: 'vip' as const,
    label: 'VIP',
    emoji: '🔴',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    description: 'Akses area VIP eksklusif (Gerbang A, B, C)',
  },
];

type Props = { navigation: UserTabScreenNavigationProp };

export default function UserDashboard({ navigation }: Props) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [events, setEvents] = useState<EventData[]>(FALLBACK_EVENTS);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk modal pilih tipe tiket
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // State untuk custom Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const typeSheetAnim = useRef(new Animated.Value(0)).current;

  const openTypeModal = (event: EventData) => {
    setSelectedEvent(event);
    setTypeModalVisible(true);
    Animated.spring(typeSheetAnim, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const closeTypeModal = () => {
    Animated.timing(typeSheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setTypeModalVisible(false));
  };

  // Reload session setiap kali tab aktif — penting agar origin yang baru disimpan
  // di UserProfileScreen langsung terbaca tanpa perlu logout/login ulang (fix bug #6)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SESSION_KEY).then(raw => {
        if (raw) setSession(JSON.parse(raw));
      });
      fetchEvents();
    }, []),
  );

  // Dashboard adalah landing screen (root tab) setelah login dengan auto-login aktif.
  // Tombol back Android di sini seharusnya menawarkan keluar aplikasi, BUKAN
  // mundur ke halaman Login (yang jadi default React Navigation jika tak ditangani).
  // useFocusEffect memastikan handler ini hanya aktif selagi UserDashboard fokus —
  // saat user pindah ke screen lain (mis. MyTicketScreen), back tetap mundur normal.
  //
  // [PENTING] typeModalVisible dicek dulu: dulu <Modal> RN otomatis menangani
  // back button sendiri (via onRequestClose) untuk menutup popup pilih tiket.
  // Sekarang popup itu tidak lagi pakai <Modal>, jadi back button harus
  // ditangani di sini juga — kalau tidak, back saat popup terbuka akan
  // langsung memicu dialog "Keluar Aplikasi" alih-alih menutup popup.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (typeModalVisible) {
          closeTypeModal();
          return true;
        }

        Alert.alert(
          'Keluar Aplikasi',
          'Apakah kamu yakin ingin keluar dari aplikasi?',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Keluar', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
        );
        return true; // Cegah perilaku default (pop ke Login)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [typeModalVisible]),
  );

  const fetchEvents = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/events`);
      if (res.ok) {
        const data: EventData[] = await res.json();
        if (data.length > 0) setEvents(data);
      }
    } catch {
      // Backend offline — fallback data tetap tampil
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  /**
   * Langkah 1: Pengguna menekan tombol "Beli Tiket" pada sebuah event.
   * Cek apakah profil (origin) sudah diisi — jika belum, minta pengguna mengisi dulu.
   */
  const handleEventPress = (event: EventData) => {
    if (!session?.userId) {
      showSnackbar('Sesi tidak ditemukan. Silakan login ulang.', 'error');
      return;
    }

    // Cek apakah profil sudah diisi (data minimization requirement)
    if (!session.origin) {
      Alert.alert(
        'Profil Belum Lengkap',
        'Sebelum membeli tiket, harap mengisi asal daerah di halaman Profil terlebih dahulu.',
        [
          { text: 'Nanti', style: 'cancel' },
          {
            text: 'Ke Profil',
            onPress: () => navigation.navigate('UserProfile'),
          },
        ],
      );
      return;
    }

    // Profil sudah diisi — tampilkan popup pilih tipe tiket
    openTypeModal(event);
  };

  /**
   * Langkah 2: Pengguna memilih tipe tiket (Regular/Silver/Gold/VIP).
   * POST /buy_ticket → simpan ticketSecret, signature, ticketType ke AsyncStorage.
   *
   * [KRITIS] Proses kriptografis:
   * 1. ticket_secret = HMAC(master_secret, ticket_id) — di-generate backend
   * 2. signature = ECDSA_sign(private_key, ticket_id:event_id) — tanda tangan keaslian
   * 3. Keduanya disimpan lokal untuk generate QR offline (Gate-Bound TOTP)
   */
  const handleBuyTicket = async (ticketType: typeof TICKET_TYPES[0]) => {
    if (!session?.userId || !selectedEvent) return;

    closeTypeModal();

    try {
      setLoadingTicket(true);
      const response = await authFetch(`${BASE_URL}/buy_ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.userId,
          event_id: selectedEvent.id,
          ticket_type: ticketType.id, // Tipe tiket yang dipilih — disimpan server untuk alokasi gate
        }),
      });
      const data = await response.json();

      if (response.ok) {
        const ticketsKey = getTicketsKey(session.userId);
        const existingStr = await AsyncStorage.getItem(ticketsKey);
        const existingTickets: TicketData[] = existingStr ? JSON.parse(existingStr) : [];

        const newTicket: TicketData = {
          ticketId: data.ticket_id,
          ticketSecret: data.ticket_secret,   // [KRITIS] Untuk derive gate_secret via HMAC
          signature: data.signature,           // [KRITIS] Tanda tangan ECDSA
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          ticketType: data.ticket_type,        // "regular"/"silver"/"gold"/"vip" — untuk filter gate BLE
          purchasedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(ticketsKey, JSON.stringify([...existingTickets, newTicket]));

        showSnackbar(`Berhasil membeli tiket ${ticketType.label}! Cek di menu Tiket Saya.`, 'success');
      } else {
        showSnackbar(data.detail || 'Tidak dapat membeli tiket.', 'error');
      }
    } catch {
      showSnackbar('Tidak dapat menghubungi server.', 'error');
    } finally {
      setLoadingTicket(false);
      setSelectedEvent(null);
    }
  };

  const renderItem = ({ item }: { item: EventData }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventBadge}>
        <Text style={styles.eventBadgeText}>LIVE</Text>
      </View>
      <Text style={styles.eventName}>{item.name}</Text>
      {item.location && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Image source={require('../assets/flaticon/land-location.png')} style={{ width: 12, height: 12, tintColor: '#64748b', marginRight: 4 }} />
          <Text style={[styles.eventVenue, { marginTop: 0 }]}>{item.location}</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Image source={require('../assets/flaticon/calendar.png')} style={{ width: 12, height: 12, tintColor: '#64748b', marginRight: 4 }} />
        <Text style={[styles.eventDate, { marginTop: 0 }]}>{item.date}</Text>
      </View>
      {item.time && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Image source={require('../assets/flaticon/clock-three.png')} style={{ width: 12, height: 12, tintColor: '#64748b', marginRight: 4 }} />
          <Text style={[styles.eventTime, { marginTop: 0 }]}>{item.time}</Text>
        </View>
      )}

      {/* Sisa kuota tiket per tipe */}
      {(item.quota_regular || item.quota_vip) && (
        <View style={styles.quotaRow}>
          {[
            { emoji: '🔵', label: 'Reg', rem: item.remaining_regular ?? item.quota_regular },
            { emoji: '⚪', label: 'Sil', rem: item.remaining_silver  ?? item.quota_silver  },
            { emoji: '🟡', label: 'Gld', rem: item.remaining_gold    ?? item.quota_gold    },
            { emoji: '🔴', label: 'VIP', rem: item.remaining_vip     ?? item.quota_vip     },
          ].map(({ emoji, label, rem }) => (
            <View key={label} style={[styles.quotaBadge, rem === 0 && styles.quotaBadgeSoldOut]}>
              <Text style={[styles.quotaText, rem === 0 && styles.quotaTextSoldOut]}>
                {emoji} {label}: {rem === 0 ? 'HABIS' : rem}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.buyButton, (loadingTicket || !session?.userId) && styles.buyButtonDisabled]}
        onPress={() => handleEventPress(item)}
        disabled={loadingTicket || !session?.userId}>
        <Text style={styles.buyButtonText}>
          {loadingTicket ? 'Memproses...' : 'Beli Tiket'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Halo, {session?.username || ''}</Text>
          <Text style={styles.headerSub}>Dynamic Secure QR Ticketing</Text>
        </View>
        {!session?.userId && <ActivityIndicator color="#007BFF" />}
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007BFF"
            colors={['#007BFF']}
          />
        }
      />

      {/* 🎟 Modal Pilih Tipe Tiket 🎟 */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeTypeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { 
            transform: [{ 
              translateY: typeSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] }) 
            }] 
          }]}>
            <Text style={styles.modalTitle}>Pilih Tipe Tiket</Text>
            {selectedEvent && (
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 12 }}>
                <Image source={require('../assets/flaticon/event.png')} style={{ width: 14, height: 14, tintColor: '#4f46e5', marginRight: 6 }} />
                <Text style={[styles.modalEventName, { marginBottom: 0 }]}>{selectedEvent.name}</Text>
              </View>
            )}
            <Text style={styles.modalSubtitle}>
              Tipe tiket menentukan gerbang mana yang dapat kamu akses saat masuk venue.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {TICKET_TYPES.map(type => {
                // Ambil sisa kuota dari event yang dipilih
                const remainingMap: Record<string, number | undefined> = {
                  regular: selectedEvent?.remaining_regular,
                  silver:  selectedEvent?.remaining_silver,
                  gold:    selectedEvent?.remaining_gold,
                  vip:     selectedEvent?.remaining_vip,
                };
                const remaining = remainingMap[type.id];
                const isSoldOut = remaining !== undefined && remaining <= 0;

                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      { borderColor: type.border, backgroundColor: type.bg },
                      isSoldOut && styles.typeOptionSoldOut,
                    ]}
                    onPress={() => !isSoldOut && handleBuyTicket(type)}
                    disabled={isSoldOut}
                  >
                    <Text style={[styles.typeEmoji, isSoldOut && { opacity: 0.4 }]}>{type.emoji}</Text>
                    <View style={styles.typeInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.typeLabel, { color: isSoldOut ? '#94a3b8' : type.color }]}>
                          {type.label}
                        </Text>
                        {isSoldOut && (
                          <View style={styles.soldOutBadge}>
                            <Text style={styles.soldOutText}>HABIS</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.typeDesc, isSoldOut && { color: '#cbd5e1' }]}>
                        {type.description}
                      </Text>
                      {selectedEvent && (
                        <Text style={[styles.typeQuota, isSoldOut && { color: '#ef4444' }]}>
                          {isSoldOut
                            ? 'Tiket habis terjual'
                            : `Tersisa: ${remaining ?? '—'} tiket`
                          }
                        </Text>
                      )}
                    </View>
                    {!isSoldOut && <Text style={[styles.typeArrow, { color: type.color }]}>›</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeTypeModal}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Snackbar Notifikasi */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
}
