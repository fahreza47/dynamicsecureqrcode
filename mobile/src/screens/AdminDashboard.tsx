import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  BackHandler,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import type { StatsResponse } from '../types';
import Snackbar from '../components/Snackbar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { styles } from './AdminDashboard.styles';

// Nilai default stats saat data belum/tidak berhasil dimuat
const DEFAULT_STATS: StatsResponse = {
  total_sold: 0,
  total_used: 0,
  total_active: 0,
  total_events: 0,
  events: [],
};

export default function AdminDashboard({ navigation }: any) {
  const [username, setUsername] = useState('Admin');          // Nama penyelenggara dari sesi
  const [stats, setStats] = useState<StatsResponse>(DEFAULT_STATS); // Statistik tiket dari backend
  const [statsLoading, setStatsLoading] = useState(true);    // Status loading statistik

  // State untuk modal detail event
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // State untuk modal buat event baru
  const [createVisible, setCreateVisible] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventTime, setNewEventTime] = useState<Date | null>(null);
  const [newEventLocation, setNewEventLocation] = useState('');
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Snackbar State
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('success');
  
  const showSnackbar = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // Animasi Modal Detail
  const detailSheetAnim = useRef(new Animated.Value(0)).current;

  const openDetailModal = (event: any) => {
    setSelectedEvent(event);
    setDetailVisible(true);
    Animated.spring(detailSheetAnim, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const closeDetailModal = () => {
    Animated.timing(detailSheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDetailVisible(false));
  };

  // Animasi Modal Buat Event — dulunya pakai animationType="fade" bawaan <Modal>,
  // sekarang di-drive manual (fade + scale-in halus) supaya konsisten dengan
  // modal detail dan tidak lagi bergantung pada <Modal> native.
  const createSheetAnim = useRef(new Animated.Value(0)).current;

  const openCreateModal = () => {
    setCreateVisible(true);
    createSheetAnim.setValue(0);

    Animated.timing(createSheetAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeCreateModal = () => {
    Animated.timing(createSheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCreateVisible(false);
      setFormError(null);
    });
  };

  // Jalankan saat layar pertama dibuka atau ketika layar difokuskan kembali
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then(session => {
      if (session) setUsername(JSON.parse(session).username || 'Admin');
    });
    fetchStats();

    // Dengarkan event focus agar data selalu terbaru ketika admin berpindah tab
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStats();
    });
    return unsubscribe;
  }, [navigation]);

  /** Ambil statistik tiket dari endpoint GET /stats */
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await authFetch(`${BASE_URL}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Gagal mengambil data statistik:', error);
      // Backend offline — tampilkan data default
    } finally {
      setStatsLoading(false);
    }
  };

  // Dashboard adalah landing screen (root tab) admin setelah login dengan auto-login aktif.
  // Tombol back Android di sini seharusnya menawarkan keluar aplikasi, BUKAN
  // mundur ke halaman Login (yang jadi default React Navigation jika tak ditangani).
  // useFocusEffect memastikan handler ini hanya aktif selagi AdminDashboard fokus —
  // saat admin pindah ke screen lain (mis. Scanner), back tetap mundur normal.
  //
  // [PENTING] detailVisible/createVisible dicek dulu: dulu <Modal> RN otomatis
  // menangani back button sendiri (via onRequestClose) untuk menutup overlay.
  // Sekarang overlay tidak lagi pakai <Modal>, jadi back button harus ditangani
  // di sini juga — kalau tidak, back saat overlay terbuka akan langsung memicu
  // dialog "Keluar Aplikasi" alih-alih menutup overlay.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (detailVisible) {
          closeDetailModal();
          return true;
        }
        if (createVisible) {
          closeCreateModal();
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
    }, [detailVisible, createVisible]),
  );

  /** Validasi form buat event di sisi client sebelum hit server */
  const validateCreateEventForm = (): string | null => {
    const name = newEventName.trim();
    const location = newEventLocation.trim();

    if (name.length < 8)
      return 'Nama acara minimal 8 karakter.';
    
    if (!newEventDate)
      return 'Tanggal acara wajib diisi.';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(newEventDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      return 'Tanggal tidak valid. Pilih tanggal yang belum lewat.';
    }

    if (location.length < 8)
      return 'Lokasi venue wajib diisi, minimal 8 karakter.';
    
    if (!newEventTime)
      return 'Waktu mulai wajib diisi.';
    
    return null;
  };

  /** Memanggil API backend POST /events untuk membuat event baru */
  const handleCreateEvent = async () => {
    setFormError(null);
    const error = validateCreateEventForm();
    if (error) {
      setFormError(error);
      return;
    }

    // Format date ke YYYY-MM-DD
    const yyyy = newEventDate!.getFullYear();
    const mm = String(newEventDate!.getMonth() + 1).padStart(2, '0');
    const dd = String(newEventDate!.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Format time ke HH:MM (24-hour format)
    const hours = String(newEventTime!.getHours()).padStart(2, '0');
    const minutes = String(newEventTime!.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    try {
      setCreateLoading(true);
      const res = await authFetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEventName.trim(),
          date: dateStr,
          location: newEventLocation.trim(),
          time: timeStr,
        }),
      });

      if (res.ok) {
        showSnackbar('Event baru berhasil didaftarkan! 🎉', 'success');
        setNewEventName('');
        setNewEventDate(null);
        setNewEventLocation('');
        setNewEventTime(null);
        closeCreateModal();
        fetchStats();
      } else {
        const errData = await res.json();
        // Tampilkan pesan validasi dari server (Pydantic)
        const detail = errData.detail;
        if (Array.isArray(detail)) {
          setFormError(detail.map((e: any) => e.msg).join('. '));
        } else {
          setFormError(detail || 'Gagal mendaftarkan event baru.');
        }
      }
    } catch (error) {
      console.error(error);
      setFormError('Tidak dapat menghubungi server backend.');
    } finally {
      setCreateLoading(false);
    }
  };

  /** Buka QR scanner khusus untuk event tertentu */
  const handleOpenScanner = (event: any) => {
    setDetailVisible(false);
    detailSheetAnim.setValue(0); // Reset agar modal berikutnya animasi slide-in lagi, bukan muncul instan
    navigation.navigate('Scanner', {
      eventId: event.id,
      eventName: event.name,
      eventLocation: event.location,
    });
  };

  /** Buka halaman riwayat pemindaian untuk event tertentu */
  const handleOpenScanHistory = (event: any) => {
    setDetailVisible(false);
    detailSheetAnim.setValue(0); // Reset agar modal berikutnya animasi slide-in lagi, bukan muncul instan
    navigation.navigate('ScanHistoryScreen', {
      eventId: event.id,
      eventName: event.name,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.title}>Halo, {username}</Text>
            <Text style={styles.subtitle}>Dynamic Secure QR Ticketing</Text>
          </View>
          {/* Tombol "+" untuk membuat event baru */}
          <TouchableOpacity style={styles.addEventBtn} onPress={openCreateModal}>
            <Text style={styles.addEventBtnText}>+ Buat Event</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          {/* Ringkasan Statistik Global (Terjual / Aktif / Digunakan) */}
          <Text style={styles.sectionHeader}>RINGKASAN TIKET GLOBAL</Text>
          <View style={styles.statsRow}>
            {/* Total tiket yang sudah dibeli */}
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#007BFF' }]}>
                {statsLoading ? '…' : stats.total_sold}
              </Text>
              <Text style={styles.statLabel}>Terjual</Text>
            </View>
            {/* Tiket aktif = terjual - sudah digunakan */}
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#16a34a' }]}>
                {statsLoading ? '…' : stats.total_active}
              </Text>
              <Text style={styles.statLabel}>Aktif</Text>
            </View>
            {/* Tiket yang sudah digunakan masuk */}
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>
                {statsLoading ? '…' : stats.total_used}
              </Text>
              <Text style={styles.statLabel}>Digunakan</Text>
            </View>
          </View>

          {/* Info bar jumlah event + tombol refresh manual */}
          <View style={styles.infoBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../assets/flaticon/calendar.png')} style={{ width: 14, height: 14, tintColor: '#6c757d', marginRight: 6 }} />
              <Text style={styles.infoBarText}>
                Total Event Aktif: {stats.total_events}
              </Text>
            </View>
            <TouchableOpacity onPress={fetchStats} disabled={statsLoading}>
              <Text style={styles.refreshText}>{statsLoading ? 'Loading...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {/* Daftar Event Rinci */}
          <Text style={styles.sectionHeader}>DAFTAR EVENT AKTIF</Text>
          {statsLoading && stats.events?.length === 0 ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
          ) : stats.events && stats.events.length > 0 ? (
            stats.events.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => openDetailModal(event)}
              >
                <View style={styles.eventCardHeader}>
                  <Text style={styles.eventName}>{event.name}</Text>
                </View>
                
                <View style={styles.eventInfoRow}>
                  <Image source={require('../assets/flaticon/calendar.png')} style={styles.eventInfoIcon} />
                  <Text style={styles.eventDate}>{event.date}</Text>
                </View>
                
                {event.time && (
                  <View style={styles.eventInfoRow}>
                    <Image source={require('../assets/flaticon/clock-three.png')} style={styles.eventInfoIcon} />
                    <Text style={styles.eventTime}>{event.time}</Text>
                  </View>
                )}

                {event.location && (
                  <View style={styles.eventInfoRow}>
                    <Image source={require('../assets/flaticon/land-location.png')} style={styles.eventInfoIcon} />
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  </View>
                )}
                
                <View style={styles.eventStatsDivider} />
                <View style={styles.eventStatsRow}>
                  <Text style={styles.eventStatText}>
                    Terjual: <Text style={styles.eventStatVal}>{event.total_sold}</Text>
                  </Text>
                  <Text style={styles.eventStatText}>
                    Aktif: <Text style={[styles.eventStatVal, { color: '#16a34a' }]}>{event.total_active}</Text>
                  </Text>
                  <Text style={styles.eventStatText}>
                    Dipindai: <Text style={[styles.eventStatVal, { color: '#dc2626' }]}>{event.total_used}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Belum ada event terdaftar. Ketuk "Buat Event" di atas untuk menambahkan.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* =====================================================================
          1. MODAL DETAIL EVENT
          ===================================================================== */}
      <Modal
        visible={detailVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { 
            transform: [{ 
              translateY: detailSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] }) 
            }] 
          }]}>
            {selectedEvent && (
              <>
                <Text style={styles.modalHeaderTitle}>Detail Event</Text>
                <Text style={styles.modalEventName}>{selectedEvent.name}</Text>
                <View style={styles.modalDetailsContainer}>
                  <View style={styles.modalDetailRow}>
                    <Image source={require('../assets/flaticon/calendar.png')} style={styles.modalDetailIcon} />
                    <Text style={styles.modalEventDate}>{selectedEvent.date}</Text>
                  </View>
                  {selectedEvent.location && (
                    <View style={styles.modalDetailRow}>
                      <Image source={require('../assets/flaticon/land-location.png')} style={styles.modalDetailIcon} />
                      <Text style={styles.modalEventLocation}>{selectedEvent.location}</Text>
                    </View>
                  )}
                  {selectedEvent.time && (
                    <View style={styles.modalDetailRow}>
                      <Image source={require('../assets/flaticon/clock-three.png')} style={styles.modalDetailIcon} />
                      <Text style={styles.modalEventTime}>{selectedEvent.time}</Text>
                    </View>
                  )}
                </View>

                {/* Statistik tiket */}
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatVal}>{selectedEvent.total_sold}</Text>
                    <Text style={styles.modalStatLbl}>Terjual</Text>
                  </View>
                  <View style={styles.modalStatBox}>
                    <Text style={[styles.modalStatVal, { color: '#16a34a' }]}>{selectedEvent.total_active}</Text>
                    <Text style={styles.modalStatLbl}>Aktif</Text>
                  </View>
                  <View style={styles.modalStatBox}>
                    <Text style={[styles.modalStatVal, { color: '#dc2626' }]}>{selectedEvent.total_used}</Text>
                    <Text style={styles.modalStatLbl}>Dipindai</Text>
                  </View>
                </View>

                {/* Breakdown penjualan per tipe tiket */}
                <View style={styles.modalDescContainer}>
                  <Text style={styles.modalDescHeader}>Penjualan per Tipe Tiket</Text>
                  <View style={styles.ticketTypeRow}>
                    <Text style={[styles.ticketTypeDot, { color: '#3b82f6' }]}>🔵</Text>
                    <Text style={styles.ticketTypeLabel}>Regular</Text>
                    <Text style={styles.ticketTypeCount}>
                      {selectedEvent.sold_regular ?? 0} / {selectedEvent.quota_regular ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.ticketTypeRow}>
                    <Text style={[styles.ticketTypeDot, { color: '#94a3b8' }]}>⚪</Text>
                    <Text style={styles.ticketTypeLabel}>Silver</Text>
                    <Text style={styles.ticketTypeCount}>
                      {selectedEvent.sold_silver ?? 0} / {selectedEvent.quota_silver ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.ticketTypeRow}>
                    <Text style={[styles.ticketTypeDot, { color: '#f59e0b' }]}>🟡</Text>
                    <Text style={styles.ticketTypeLabel}>Gold</Text>
                    <Text style={styles.ticketTypeCount}>
                      {selectedEvent.sold_gold ?? 0} / {selectedEvent.quota_gold ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.ticketTypeRow}>
                    <Text style={[styles.ticketTypeDot, { color: '#ef4444' }]}>🔴</Text>
                    <Text style={styles.ticketTypeLabel}>VIP</Text>
                    <Text style={styles.ticketTypeCount}>
                      {selectedEvent.sold_vip ?? 0} / {selectedEvent.quota_vip ?? '—'}
                    </Text>
                  </View>
                </View>

                {/* Tombol aksi */}
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => handleOpenScanner(selectedEvent)}
                >
                  <Text style={styles.modalActionBtnText}>Mulai Pindai E-Tiket</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalHistoryBtn}
                  onPress={() => handleOpenScanHistory(selectedEvent)}
                >
                  <Text style={styles.modalHistoryBtnText}>Riwayat Pemindaian</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={closeDetailModal}
                >
                  <Text style={styles.modalCloseBtnText}>Tutup</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* =====================================================================
          2. MODAL BUAT EVENT BARU
          ===================================================================== */}
      <Modal
        visible={createVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Buat Event Baru</Text>

            {/* Pesan error validasi inline */}
            {formError && (
              <View style={styles.formErrorBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 16, height: 16, tintColor: '#d97706', marginRight: 6 }} />
                  <Text style={[styles.formErrorText, { flex: 1 }]}>{formError}</Text>
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>NAMA ACARA *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Minimal 8 karakter (mis. Konser Blackpink)"
                placeholderTextColor="#94a3b8"
                value={newEventName}
                onChangeText={t => { setNewEventName(t); setFormError(null); }}
                maxLength={100}
              />
              <Text style={styles.formHint}>Minimal 8 karakter</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TANGGAL ACARA *</Text>
              <TouchableOpacity
                style={styles.formInputPicker}
                onPress={() => setDatePickerVisibility(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/flaticon/calendar.png')} style={styles.inputPickerIcon} />
                  <Text style={[styles.formInputPickerText, !newEventDate && { color: '#94a3b8' }]}>
                    {newEventDate ? newEventDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal Acara'}
                  </Text>
                </View>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                  setNewEventDate(date);
                  setDatePickerVisibility(false);
                  setFormError(null);
                }}
                onCancel={() => setDatePickerVisibility(false)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>LOKASI VENUE *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Minimal 8 karakter (mis. GBK Jakarta)"
                placeholderTextColor="#94a3b8"
                value={newEventLocation}
                onChangeText={t => { setNewEventLocation(t); setFormError(null); }}
                maxLength={100}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>WAKTU MULAI *</Text>
              <TouchableOpacity
                style={styles.formInputPicker}
                onPress={() => setTimePickerVisibility(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/flaticon/clock-three.png')} style={styles.inputPickerIcon} />
                  <Text style={[styles.formInputPickerText, !newEventTime && { color: '#94a3b8' }]}>
                    {newEventTime ? newEventTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pilih Waktu Acara'}
                  </Text>
                </View>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={(time) => {
                  setNewEventTime(time);
                  setTimePickerVisibility(false);
                  setFormError(null);
                }}
                onCancel={() => setTimePickerVisibility(false)}
                is24Hour={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalActionBtn, createLoading && { backgroundColor: '#94a3b8' }]}
              onPress={handleCreateEvent}
              disabled={createLoading}
            >
              <Text style={styles.modalActionBtnText}>
                {createLoading ? 'Memproses...' : 'Simpan Event'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={closeCreateModal}
              disabled={createLoading}
            >
              <Text style={styles.modalCloseBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
}


