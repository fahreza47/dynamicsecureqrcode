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
import CustomDialog, { DialogType } from '../components/CustomDialog';
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

// Data fallback saat server offline
const FALLBACK_EVENTS: EventData[] = [
  {
    id: 1,
    name: 'Konser Musik Dynamic',
    date: '2026-08-30',
    time: '19:00 WIB',
    location: 'Stadion Utama Gelora Bung Karno',
    quota_regular: 100,
    remaining_regular: 100,
    quota_silver: 50,
    remaining_silver: 50,
    quota_gold: 30,
    remaining_gold: 30,
    quota_vip: 20,
    remaining_vip: 20,
  },
  {
    id: 2,
    name: 'Festival Jazz Nusantara',
    date: '2026-09-05',
    time: '16:00 WIB',
    location: 'Grand Ballroom Hotel Indonesia',
    quota_regular: 80,
    remaining_regular: 80,
    quota_silver: 40,
    remaining_silver: 40,
    quota_gold: 25,
    remaining_gold: 25,
    quota_vip: 15,
    remaining_vip: 15,
  },
];

// Konfigurasi visual per tipe tiket — tampil di popup pemilihan
const TICKET_TYPES = [
  {
    id: 'regular' as const,
    label: 'Regular',
    icon: require('../assets/flaticon/tickets.png'),
    color: '#2563eb', // Royal Blue
    bg: '#eff6ff',
    border: '#bfdbfe',
    quotaBg: '#dbeafe',
    quotaBorder: '#bfdbfe',
    quotaColor: '#1d4ed8',
    description: 'Akses area umum (Gerbang A, B, C)',
  },
  {
    id: 'silver' as const,
    label: 'Silver',
    icon: require('../assets/flaticon/medal.png'),
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    quotaBg: '#f1f5f9',
    quotaBorder: '#e2e8f0',
    quotaColor: '#475569',
    description: 'Akses area Silver (Gerbang A, B, C)',
  },
  {
    id: 'gold' as const,
    label: 'Gold',
    icon: require('../assets/flaticon/crown.png'),
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    quotaBg: '#fef3c7',
    quotaBorder: '#fde68a',
    quotaColor: '#b45309',
    description: 'Akses area Gold (Gerbang A, B, C)',
  },
  {
    id: 'vip' as const,
    label: 'VIP',
    icon: require('../assets/flaticon/diamond.png'),
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    quotaBg: '#fee2e2',
    quotaBorder: '#fecaca',
    quotaColor: '#b91c1c',
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

  // State untuk CustomDialog (menggantikan Alert.alert jadul)
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type?: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmStyle?: 'default' | 'danger';
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showSnackbar = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const typeSheetAnim = useRef(new Animated.Value(0)).current;

  // Helper thumbnail visual untuk kartu event (Music / Sing / Ticket)
  const getEventTheme = (index: number) => {
    const themes = [
      {
        icon: require('../assets/flaticon/music-event.png'),
        bg: '#818cf8', // Soft Indigo / Violet
      },
      {
        icon: require('../assets/flaticon/sing-event.png'),
        bg: '#fb7185', // Soft Rose Pink
      },
      {
        icon: require('../assets/flaticon/ticket-event.png'),
        bg: '#fb923c', // Soft Amber Orange
      },
    ];
    return themes[index % themes.length];
  };

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
  // di UserProfileScreen langsung terbaca tanpa perlu logout/login ulang
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SESSION_KEY).then(raw => {
        if (raw) setSession(JSON.parse(raw));
      });
      fetchEvents();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (typeModalVisible) {
          closeTypeModal();
          return true;
        }

        setDialogConfig({
          visible: true,
          type: 'warning',
          title: 'Keluar Aplikasi',
          message: 'Apakah kamu yakin ingin keluar dari aplikasi?',
          cancelText: 'Batal',
          confirmText: 'Keluar',
          confirmStyle: 'danger',
          onCancel: () => setDialogConfig(prev => ({ ...prev, visible: false })),
          onConfirm: () => {
            setDialogConfig(prev => ({ ...prev, visible: false }));
            BackHandler.exitApp();
          },
        });
        return true;
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
      setDialogConfig({
        visible: true,
        type: 'info',
        title: 'Profil Belum Lengkap',
        message: 'Sebelum membeli tiket, harap mengisi asal daerah di halaman Profil terlebih dahulu.',
        cancelText: 'Nanti',
        confirmText: 'Ke Profil',
        onCancel: () => setDialogConfig(prev => ({ ...prev, visible: false })),
        onConfirm: () => {
          setDialogConfig(prev => ({ ...prev, visible: false }));
          navigation.navigate('UserProfile');
        },
      });
      return;
    }

    // Profil sudah diisi — tampilkan popup pilih tipe tiket
    openTypeModal(event);
  };

  /**
   * Langkah 2: Pengguna memilih tipe tiket (Regular/Silver/Gold/VIP).
   * POST /buy_ticket → simpan ticketSecret, signature, ticketType ke AsyncStorage.
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
          ticket_type: ticketType.id,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        const ticketsKey = getTicketsKey(session.userId);
        const existingStr = await AsyncStorage.getItem(ticketsKey);
        const existingTickets: TicketData[] = existingStr ? JSON.parse(existingStr) : [];

        const newTicket: TicketData = {
          ticketId: data.ticket_id,
          ticketSecret: data.ticket_secret,
          signature: data.signature,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          ticketType: data.ticket_type,
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

  const renderItem = ({ item, index }: { item: EventData; index: number }) => {
    const themeItem = getEventTheme(index);

    const quotas = [
      { dotColor: '#3b82f6', label: 'Reg', rem: item.remaining_regular ?? item.quota_regular ?? 0 },
      { dotColor: '#94a3b8', label: 'Sil', rem: item.remaining_silver  ?? item.quota_silver  ?? 0 },
      { dotColor: '#eab308', label: 'Gld', rem: item.remaining_gold    ?? item.quota_gold    ?? 0 },
      { dotColor: '#ef4444', label: 'VIP', rem: item.remaining_vip     ?? item.quota_vip     ?? 0 },
    ];

    return (
      <View style={styles.eventCard}>
        {/* Thumbnail Kiri Berwarna */}
        <View style={[styles.eventThumbnail, { backgroundColor: themeItem.bg }]}>
          <Image source={themeItem.icon} style={styles.eventThumbnailIcon} />
        </View>

        {/* Kolom Tengah: Info & Metadata Event */}
        <View style={styles.eventInfoCol}>
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>LIVE</Text>
          </View>
          <Text style={styles.eventName} numberOfLines={1}>
            {item.name}
          </Text>

          {item.location && (
            <View style={styles.metaRow}>
              <Image source={require('../assets/flaticon/land-location.png')} style={styles.metaIcon} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Image source={require('../assets/flaticon/calendar.png')} style={styles.metaIcon} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>

          {item.time && (
            <View style={styles.metaRow}>
              <Image source={require('../assets/flaticon/clock-three.png')} style={styles.metaIcon} />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
          )}
        </View>

        {/* Kolom Kanan: 2x2 Grid Kuota & Tombol Beli */}
        <View style={styles.eventActionCol}>
          <View style={styles.quotaGrid}>
            {quotas.map(({ dotColor, label, rem }) => (
              <View key={label} style={styles.quotaItem}>
                <View style={[styles.quotaDot, { backgroundColor: dotColor }]} />
                <Text style={[styles.quotaText, rem === 0 && styles.quotaTextSoldOut]}>
                  {label}: {rem === 0 ? '0' : rem}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.buyButton, (loadingTicket || !session?.userId) && styles.buyButtonDisabled]}
            onPress={() => handleEventPress(item)}
            disabled={loadingTicket || !session?.userId}
            activeOpacity={0.85}
          >
            <Text style={styles.buyButtonText}>
              {loadingTicket ? '...' : 'Beli Tiket'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Thumbnail untuk event yang sedang dipilih di Bottom Sheet
  const selectedEventIndex = selectedEvent
    ? events.findIndex(e => e.id === selectedEvent.id)
    : 0;
  const sheetEventTheme = getEventTheme(selectedEventIndex >= 0 ? selectedEventIndex : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bersih dengan Handwave Badge (Matching AdminDashboard) */}
      <View style={styles.header}>
        <View style={styles.welcomeRow}>
          <Text style={styles.title}>Halo, {session?.username || 'Penonton'}</Text>
          <View style={styles.waveBadge}>
            <Text style={styles.waveText}>👋</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Dynamic Secure QR Ticketing</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>DAFTAR EVENT AKTIF</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
      />

      {/* 🎟 Modern Bottom Sheet Pilih Tipe Tiket 🎟 */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeTypeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: typeSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [800, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Drag Handle Bar di Atas */}
            <View style={styles.dragHandleBar} />

            {/* Header Modal: Thumbnail + Nama Event + Tombol Close (✕) */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalThumbnail, { backgroundColor: sheetEventTheme.bg }]}>
                  <Image source={sheetEventTheme.icon} style={styles.modalThumbnailIcon} />
                </View>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.modalSheetTitle} numberOfLines={1}>
                    {selectedEvent?.name || 'Pilih Tipe Tiket'}
                  </Text>
                  <Text style={styles.modalSheetSub}>
                    {selectedEvent
                      ? `${selectedEvent.date}${selectedEvent.location ? ` • ${selectedEvent.location}` : ''}`
                      : 'Pilih tipe tiket akses'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeTypeModal}
                activeOpacity={0.75}
              >
                <Image
                  source={require('../assets/flaticon/x-no-bg.png')}
                  style={styles.modalCloseIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Catatan Penjelasan Akses Gerbang */}
            <Text style={styles.modalExplainerNote}>
              💡 Tipe tiket menentukan gerbang mana yang dapat kamu akses saat masuk venue acara.
            </Text>

            {/* Daftar Pilihan Tipe Tiket */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {TICKET_TYPES.map(type => {
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
                      {
                        borderColor: isSoldOut ? '#e2e8f0' : type.border,
                        backgroundColor: isSoldOut ? '#fafafa' : type.bg,
                      },
                      isSoldOut && styles.typeOptionSoldOut,
                    ]}
                    onPress={() => !isSoldOut && handleBuyTicket(type)}
                    disabled={isSoldOut}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.typeIconBadge,
                        {
                          backgroundColor: '#ffffff',
                          borderWidth: 1,
                          borderColor: isSoldOut ? '#e2e8f0' : type.border,
                        },
                      ]}
                    >
                      <Image
                        source={type.icon}
                        style={[
                          styles.typeIcon,
                          { tintColor: isSoldOut ? '#94a3b8' : type.color },
                        ]}
                      />
                    </View>

                    <View style={styles.typeInfo}>
                      <View style={styles.typeLabelRow}>
                        <Text
                          style={[
                            styles.typeLabel,
                            { color: isSoldOut ? '#94a3b8' : type.color },
                          ]}
                        >
                          {type.label}
                        </Text>
                        {isSoldOut ? (
                          <View style={styles.soldOutBadge}>
                            <Text style={styles.soldOutText}>HABIS</Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.typeQuotaPill,
                              {
                                backgroundColor: type.quotaBg,
                                borderColor: type.quotaBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeQuotaText,
                                { color: type.quotaColor },
                              ]}
                            >
                              Tersisa: {remaining ?? '—'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.typeDesc,
                          isSoldOut && { color: '#cbd5e1' },
                        ]}
                      >
                        {type.description}
                      </Text>
                    </View>

                    {!isSoldOut && (
                      <Text style={[styles.typeArrow, { color: type.color }]}>›</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Custom Dialog untuk Konfirmasi & Peringatan */}
      <CustomDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        confirmStyle={dialogConfig.confirmStyle}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
      />

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
