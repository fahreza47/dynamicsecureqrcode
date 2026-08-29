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
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import type { StatsResponse } from '../types';
import Snackbar from '../components/Snackbar';
import CustomDialog, { DialogType } from '../components/CustomDialog';
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
  const [refreshing, setRefreshing] = useState(false);        // Status pull-to-refresh
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null); // Event yang diklik untuk lihat detail
  const [detailVisible, setDetailVisible] = useState(false);  // Kontrol modal detail
  const [createVisible, setCreateVisible] = useState(false);  // Kontrol modal buat event baru
  const [createLoading, setCreateLoading] = useState(false);  // Loading saat submit form buat event

  // State untuk CustomDialog
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

  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventTime, setNewEventTime] = useState<Date | null>(null);
  const [newEventLocation, setNewEventLocation] = useState('');
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading}
            onRefresh={fetchStats}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header Bersih dengan Handwave Pill & Button + Buat Event */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeRow}>
              <Text style={styles.title}>Halo, {username}</Text>
              <View style={styles.waveBadge}>
                <Text style={styles.waveText}>👋</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Dynamic Secure QR Ticketing</Text>
          </View>
          
          <TouchableOpacity style={styles.addEventBtn} onPress={openCreateModal} activeOpacity={0.85}>
            <View style={styles.addEventIconCircle}>
              <Text style={styles.addEventPlusText}>+</Text>
            </View>
            <Text style={styles.addEventBtnText}>Buat Event</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          {/* Ringkasan Statistik Global (Terjual / Aktif / Digunakan) */}
          <Text style={styles.sectionHeader}>RINGKASAN TIKET GLOBAL</Text>
          <View style={styles.statsRow}>
            {/* Total tiket yang sudah dibeli */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
                <Image
                  source={require('../assets/flaticon/tickets.png')}
                  style={[styles.statIcon, { tintColor: '#3b82f6' }]}
                />
              </View>
              <Text style={[styles.statValue, { color: '#1d4ed8' }]}>
                {statsLoading ? '…' : stats.total_sold}
              </Text>
              <Text style={styles.statLabel}>Terjual</Text>
            </View>

            {/* Tiket aktif */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: '#f0fdf4' }]}>
                <Image
                  source={require('../assets/flaticon/users.png')}
                  style={[styles.statIcon, { tintColor: '#22c55e' }]}
                />
              </View>
              <Text style={[styles.statValue, { color: '#16a34a' }]}>
                {statsLoading ? '…' : stats.total_active}
              </Text>
              <Text style={styles.statLabel}>Aktif</Text>
            </View>

            {/* Tiket yang sudah digunakan */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: '#fef2f2' }]}>
                <Image
                  source={require('../assets/flaticon/check.png')}
                  style={[styles.statIcon, { tintColor: '#ef4444' }]}
                />
              </View>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>
                {statsLoading ? '…' : stats.total_used}
              </Text>
              <Text style={styles.statLabel}>Digunakan</Text>
            </View>
          </View>

          {/* Info bar jumlah event + tombol refresh */}
          <View style={styles.infoBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../assets/flaticon/calendar.png')}
                style={{ width: 16, height: 16, tintColor: '#3b82f6', marginRight: 8 }}
              />
              <Text style={styles.infoBarText}>
                Total Event Aktif: {stats.total_events}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={fetchStats}
              disabled={statsLoading}
              activeOpacity={0.7}
            >
              <Image
                source={require('../assets/flaticon/reload.png')}
                style={{ width: 12, height: 12, tintColor: '#2563eb' }}
              />
              <Text style={styles.refreshText}>{statsLoading ? '...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {/* Daftar Event Rinci */}
          <Text style={styles.sectionHeader}>DAFTAR EVENT AKTIF</Text>
          {statsLoading && stats.events?.length === 0 ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
          ) : stats.events && stats.events.length > 0 ? (
            stats.events.map((event, index) => {
              const theme = getEventTheme(index);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => openDetailModal(event)}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventCardTop}>
                    {/* Thumbnail Kotak Berwarna */}
                    <View style={[styles.eventThumbnail, { backgroundColor: theme.bg }]}>
                      <Image source={theme.icon} style={styles.eventThumbnailIcon} />
                    </View>

                    {/* Info Metadata Event */}
                    <View style={styles.eventMetaContainer}>
                      <Text style={styles.eventName}>{event.name}</Text>
                      <View style={styles.eventMetaRow}>
                        <Image source={require('../assets/flaticon/calendar.png')} style={styles.eventMetaIcon} />
                        <Text style={styles.eventMetaText}>{event.date}</Text>
                      </View>
                      {event.time && (
                        <View style={styles.eventMetaRow}>
                          <Image source={require('../assets/flaticon/clock-three.png')} style={styles.eventMetaIcon} />
                          <Text style={styles.eventMetaText}>{event.time}</Text>
                        </View>
                      )}
                      {event.location && (
                        <View style={styles.eventMetaRow}>
                          <Image source={require('../assets/flaticon/land-location.png')} style={styles.eventMetaIcon} />
                          <Text style={styles.eventMetaText}>{event.location}</Text>
                        </View>
                      )}
                    </View>

                    {/* Chevron Arrow */}
                    <Text style={styles.eventArrow}>›</Text>
                  </View>

                  {/* Garis Pembatas Halus */}
                  <View style={styles.eventDivider} />

                  {/* 3 Kolom Statistik Tiket di Bawah */}
                  <View style={styles.eventStatsGrid}>
                    <View style={styles.eventStatCol}>
                      <Text style={styles.eventStatColLabel}>Terjual</Text>
                      <Text style={[styles.eventStatColVal, { color: '#1d4ed8' }]}>{event.total_sold}</Text>
                    </View>
                    <View style={styles.eventStatColDivider} />
                    <View style={styles.eventStatCol}>
                      <Text style={styles.eventStatColLabel}>Aktif</Text>
                      <Text style={[styles.eventStatColVal, { color: '#16a34a' }]}>{event.total_active}</Text>
                    </View>
                    <View style={styles.eventStatColDivider} />
                    <View style={styles.eventStatCol}>
                      <Text style={styles.eventStatColLabel}>Dipindai</Text>
                      <Text style={[styles.eventStatColVal, { color: '#dc2626' }]}>{event.total_used}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
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
            {selectedEvent && (() => {
              const detailIndex = (stats.events || []).findIndex(e => e.id === selectedEvent.id);
              const detailTheme = getEventTheme(detailIndex >= 0 ? detailIndex : 0);

              const tiers = [
                {
                  id: 'regular',
                  label: 'Regular',
                  icon: require('../assets/flaticon/tickets.png'),
                  color: '#2563eb',
                  bg: '#eff6ff',
                  border: '#bfdbfe',
                  sold: selectedEvent.sold_regular ?? 0,
                  quota: selectedEvent.quota_regular ?? '—',
                },
                {
                  id: 'silver',
                  label: 'Silver',
                  icon: require('../assets/flaticon/medal.png'),
                  color: '#64748b',
                  bg: '#f8fafc',
                  border: '#e2e8f0',
                  sold: selectedEvent.sold_silver ?? 0,
                  quota: selectedEvent.quota_silver ?? '—',
                },
                {
                  id: 'gold',
                  label: 'Gold',
                  icon: require('../assets/flaticon/crown.png'),
                  color: '#d97706',
                  bg: '#fffbeb',
                  border: '#fde68a',
                  sold: selectedEvent.sold_gold ?? 0,
                  quota: selectedEvent.quota_gold ?? '—',
                },
                {
                  id: 'vip',
                  label: 'VIP',
                  icon: require('../assets/flaticon/diamond.png'),
                  color: '#dc2626',
                  bg: '#fef2f2',
                  border: '#fecaca',
                  sold: selectedEvent.sold_vip ?? 0,
                  quota: selectedEvent.quota_vip ?? '—',
                },
              ];

              return (
                <>
                  {/* Drag Handle */}
                  <View style={styles.dragHandleBar} />

                  {/* Header: Thumbnail + Nama Event + Tombol Close (✕) */}
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={[styles.modalThumbnail, { backgroundColor: detailTheme.bg }]}>
                        <Image source={detailTheme.icon} style={styles.modalThumbnailIcon} />
                      </View>
                      <View style={styles.modalTitleCol}>
                        <Text style={styles.modalSheetTitle} numberOfLines={1}>
                          {selectedEvent.name}
                        </Text>
                        <Text style={styles.modalSheetSub}>
                          {selectedEvent.date}{selectedEvent.location ? ` • ${selectedEvent.location}` : ''}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={closeDetailModal}
                      activeOpacity={0.75}
                    >
                      <Image
                        source={require('../assets/flaticon/x-no-bg.png')}
                        style={styles.modalCloseIcon}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Breakdown Penjualan per Tipe Tiket (Grid 2x2) */}
                  <View style={styles.detailTierContainer}>
                    <Text style={styles.detailTierHeader}>KUOTA & PENJUALAN TIKET</Text>
                    <View style={styles.detailTierGrid}>
                      {tiers.map(tier => (
                        <View
                          key={tier.id}
                          style={[
                            styles.detailTierCard,
                            { backgroundColor: tier.bg, borderColor: tier.border },
                          ]}
                        >
                          <View style={[styles.detailTierIconBadge, { borderColor: tier.border }]}>
                            <Image
                              source={tier.icon}
                              style={[styles.detailTierIcon, { tintColor: tier.color }]}
                            />
                          </View>
                          <View style={styles.detailTierInfo}>
                            <Text style={[styles.detailTierLabel, { color: tier.color }]}>
                              {tier.label}
                            </Text>
                            <Text style={styles.detailTierCount}>
                              {tier.sold} / {tier.quota} tiket
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Tombol Aksi */}
                  <TouchableOpacity
                    style={styles.modalActionBtn}
                    onPress={() => handleOpenScanner(selectedEvent)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={require('../assets/flaticon/qr-code.png')}
                      style={styles.modalActionBtnIcon}
                    />
                    <Text style={styles.modalActionBtnText}>Mulai Pindai E-Tiket</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalHistoryBtn}
                    onPress={() => handleOpenScanHistory(selectedEvent)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={require('../assets/flaticon/history.png')}
                      style={styles.modalHistoryBtnIcon}
                    />
                    <Text style={styles.modalHistoryBtnText}>Riwayat Pemindaian</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
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
            {/* Drag Handle */}
            <View style={styles.dragHandleBar} />

            {/* Header: Judul + Tombol Close (✕) */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalThumbnail, { backgroundColor: '#eff6ff' }]}>
                  <Image
                    source={require('../assets/flaticon/event.png')}
                    style={[styles.modalThumbnailIcon, { tintColor: '#2563eb' }]}
                  />
                </View>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.modalSheetTitle}>Buat Event Baru</Text>
                  <Text style={styles.modalSheetSub}>Isi data acara untuk membuka tiket</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeCreateModal}
                disabled={createLoading}
                activeOpacity={0.75}
              >
                <Image
                  source={require('../assets/flaticon/x-no-bg.png')}
                  style={styles.modalCloseIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Pesan error validasi inline */}
            {formError && (
              <View style={styles.formErrorBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 16, height: 16, tintColor: '#dc2626', marginRight: 6 }} />
                  <Text style={[styles.formErrorText, { flex: 1 }]}>{formError}</Text>
                </View>
              </View>
            )}

            {/* Form Input: Nama Acara */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>NAMA ACARA *</Text>
              <View style={styles.formInputWithIcon}>
                <Image
                  source={require('../assets/flaticon/title.png')}
                  style={styles.formInputIcon}
                />
                <TextInput
                  style={styles.formInputText}
                  placeholder="Minimal 8 karakter (mis. Konser Musik)"
                  placeholderTextColor="#94a3b8"
                  value={newEventName}
                  onChangeText={t => { setNewEventName(t); setFormError(null); }}
                  maxLength={100}
                />
              </View>
              <Text style={styles.formHint}>Minimal 8 karakter</Text>
            </View>

            {/* Form Input: Tanggal Acara */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TANGGAL ACARA *</Text>
              <TouchableOpacity
                style={styles.formInputWithIcon}
                onPress={() => setDatePickerVisibility(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../assets/flaticon/calendar.png')}
                  style={styles.formInputIcon}
                />
                <Text style={[styles.formInputText, !newEventDate && { color: '#94a3b8' }]}>
                  {newEventDate ? newEventDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal Acara'}
                </Text>
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

            {/* Form Input: Lokasi Venue */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>LOKASI VENUE *</Text>
              <View style={styles.formInputWithIcon}>
                <Image
                  source={require('../assets/flaticon/land-location.png')}
                  style={styles.formInputIcon}
                />
                <TextInput
                  style={styles.formInputText}
                  placeholder="Minimal 8 karakter (mis. GBK Senayan)"
                  placeholderTextColor="#94a3b8"
                  value={newEventLocation}
                  onChangeText={t => { setNewEventLocation(t); setFormError(null); }}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Form Input: Waktu Mulai */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>WAKTU MULAI *</Text>
              <TouchableOpacity
                style={styles.formInputWithIcon}
                onPress={() => setTimePickerVisibility(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../assets/flaticon/clock-three.png')}
                  style={styles.formInputIcon}
                />
                <Text style={[styles.formInputText, !newEventTime && { color: '#94a3b8' }]}>
                  {newEventTime ? newEventTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pilih Waktu Acara'}
                </Text>
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
              style={[styles.modalActionBtn, { marginTop: 6 }, createLoading && { backgroundColor: '#94a3b8' }]}
              onPress={handleCreateEvent}
              disabled={createLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionBtnText}>
                {createLoading ? 'Memproses...' : 'Simpan Event'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Dialog untuk Konfirmasi Keluar */}
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

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
}


