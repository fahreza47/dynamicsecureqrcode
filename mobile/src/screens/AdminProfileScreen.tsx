import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, AUTH_TOKEN_KEY, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import AppHeader from '../components/AppHeader';
import CustomDialog, { DialogType } from '../components/CustomDialog';
import { styles } from './AdminProfileScreen.styles';

type UserSession = {
  userId: number;
  username: string;
  role: string;
};

type EventItem = {
  id: number;
  name: string;
  date: string;
};

export default function AdminProfileScreen({ navigation }: any) {
  const [session, setSession] = useState<UserSession | null>(null);

  // State untuk fitur Reset Demo
  const [showResetModal, setShowResetModal] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [resettingEventId, setResettingEventId] = useState<number | null>(null);

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

  // Muat data sesi setiap kali tab Profil aktif
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SESSION_KEY).then(str => {
        if (str) setSession(JSON.parse(str));
      });
    }, []),
  );

  const handleLogout = () => {
    setDialogConfig({
      visible: true,
      type: 'confirm',
      title: 'Konfirmasi Logout',
      message: 'Apakah kamu yakin ingin keluar dari akun admin?',
      cancelText: 'Batal',
      confirmText: 'Logout',
      confirmStyle: 'danger',
      onCancel: () => setDialogConfig(prev => ({ ...prev, visible: false })),
      onConfirm: async () => {
        setDialogConfig(prev => ({ ...prev, visible: false }));
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(SESSION_KEY);
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Auth' }] });
      },
    });
  };

  // ── Reset Demo: Buka modal dan muat daftar event ──
  const handleOpenResetModal = async () => {
    setShowResetModal(true);
    setLoadingEvents(true);
    try {
      const res = await authFetch(`${BASE_URL}/events`);
      const data = await res.json();
      setEvents(data.map((e: any) => ({ id: e.id, name: e.name, date: e.date })));
    } catch {
      setDialogConfig({
        visible: true,
        type: 'error',
        title: 'Gagal Memuat Event',
        message: 'Tidak dapat memuat daftar event. Pastikan koneksi server aktif.',
        confirmText: 'Mengerti',
        onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  // ── Reset Demo: Eksekusi reset untuk event yang dipilih ──
  const handleResetEvent = (event: EventItem) => {
    setDialogConfig({
      visible: true,
      type: 'warning',
      title: 'Reset Tiket Event?',
      message: `Semua tiket pada "${event.name}" akan direset menjadi BELUM DIGUNAKAN dan histori pemindaian akan dihapus.\n\nLanjutkan?`,
      cancelText: 'Batal',
      confirmText: 'Reset Semua',
      confirmStyle: 'danger',
      onCancel: () => setDialogConfig(prev => ({ ...prev, visible: false })),
      onConfirm: async () => {
        setDialogConfig(prev => ({ ...prev, visible: false }));
        setResettingEventId(event.id);
        try {
          // 1. Reset di server
          const res = await authFetch(`${BASE_URL}/events/${event.id}/reset_tickets`, {
            method: 'POST',
          });
          const data = await res.json();

          // 2. Reset di lokal: hapus semua key used_ticket_* yang terkait event ini
          const offlineDbStr = await AsyncStorage.getItem('admin_offline_ticket_db');
          if (offlineDbStr) {
            const offlineDb = JSON.parse(offlineDbStr);
            const keysToRemove: string[] = [];
            Object.entries(offlineDb).forEach(([ticketId, ticketData]: [string, any]) => {
              if (Number(ticketData.eventId) === event.id) {
                keysToRemove.push(`used_ticket_${ticketId}`);
              }
            });
            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }
          }

          setShowResetModal(false);
          setDialogConfig({
            visible: true,
            type: 'success',
            title: 'Reset Berhasil!',
            message: `${data.tickets_reset} tiket direset dan ${data.scan_logs_deleted} log pemindaian dihapus untuk "${event.name}".`,
            confirmText: 'Selesai',
            onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
          });
        } catch {
          setDialogConfig({
            visible: true,
            type: 'error',
            title: 'Gagal Mereset Tiket',
            message: 'Terjadi kesalahan saat mereset tiket. Pastikan server aktif.',
            confirmText: 'Mengerti',
            onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
          });
        } finally {
          setResettingEventId(null);
        }
      },
    });
  };

  const avatarLetter = session?.username
    ? session.username.charAt(0).toUpperCase()
    : 'A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Profil Admin" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Kartu Profil Hero (Soft Pastel Blue) */}
          <View style={styles.avatarCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <Text style={styles.username}>{session?.username || '—'}</Text>
            <View style={styles.roleBadge}>
              <Image
                source={require('../assets/flaticon/badge.png')}
                style={styles.roleIcon}
              />
              <Text style={styles.roleText}>PENYELENGGARA</Text>
            </View>
          </View>

          {/* Panduan 3 Lapis Verifikasi Scanner */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Image
                  source={require('../assets/flaticon/save.png')}
                  style={styles.sectionIcon}
                />
              </View>
              <Text style={styles.infoTitle}>PANDUAN SCANNER</Text>
            </View>

            {/* LAPIS 1: Verifikasi keaslian tiket via ECDSA P-256 */}
            <View style={styles.layerRow}>
              <View style={styles.layerIcon}>
                <Text style={styles.layerIconText}>1</Text>
              </View>
              <View style={styles.layerText}>
                <Text style={styles.layerTitle}>Authenticity (ECDSA)</Text>
                <Text style={styles.layerDesc}>
                  Memverifikasi tiket diterbitkan oleh sistem resmi
                </Text>
              </View>
            </View>

            {/* LAPIS 2: Verifikasi proximity & freshness via Gate-Bound TOTP */}
            <View style={styles.layerRow}>
              <View style={styles.layerIcon}>
                <Text style={styles.layerIconText}>2</Text>
              </View>
              <View style={styles.layerText}>
                <Text style={styles.layerTitle}>Proximity (TOTP)</Text>
                <Text style={styles.layerDesc}>
                  Membuktikan QR dirender real-time, bukan screenshot
                </Text>
              </View>
            </View>

            {/* LAPIS 3: Anti-double spending via AsyncStorage lookup */}
            <View style={[styles.layerRow, styles.layerRowLast]}>
              <View style={styles.layerIcon}>
                <Text style={styles.layerIconText}>3</Text>
              </View>
              <View style={styles.layerText}>
                <Text style={styles.layerTitle}>Anti-Double Spending</Text>
                <Text style={styles.layerDesc}>
                  Mencegah tiket yang sama digunakan lebih dari sekali
                </Text>
              </View>
            </View>
          </View>

          {/* Informasi Aplikasi */}
          <View style={styles.appInfoCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBadge}>
                <Image
                  source={require('../assets/flaticon/setting.png')}
                  style={styles.sectionIcon}
                />
              </View>
              <Text style={styles.infoTitle}>INFORMASI APLIKASI</Text>
            </View>

            <View style={styles.appInfoRowContainer}>
              <Text style={styles.appInfoLabel}>Versi</Text>
              <Text style={styles.appInfoColon}>:</Text>
              <Text style={styles.appInfoValue}>MVP 1.0 — Tugas Akhir</Text>
            </View>

            <View style={styles.appInfoRowContainer}>
              <Text style={styles.appInfoLabel}>Kurva</Text>
              <Text style={styles.appInfoColon}>:</Text>
              <Text style={styles.appInfoValue}>ECDSA NIST P-256</Text>
            </View>

            <View style={styles.appInfoRowContainer}>
              <Text style={styles.appInfoLabel}>KDF</Text>
              <Text style={styles.appInfoColon}>:</Text>
              <Text style={styles.appInfoValue}>HMAC-SHA256</Text>
            </View>
          </View>

          {/* ── Tombol Bawah (Reset & Logout) ── */}
          <View style={styles.buttonRow}>
            {/* Tombol Reset */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleOpenResetModal}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/flaticon/reload.png')}
                style={{ width: 16, height: 16, tintColor: '#ffffff', marginRight: 4 }}
              />
              <Text style={styles.resetButtonText}>Reset Tiket</Text>
            </TouchableOpacity>

            {/* Tombol Logout */}
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/flaticon/user-logout.png')}
                style={{ width: 16, height: 16, tintColor: '#ffffff', marginRight: 4 }}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Modal Reset Demo ── */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={resetStyles.overlay}>
          <View style={resetStyles.sheet}>
            {/* Drag Handle */}
            <View style={resetStyles.dragHandleBar} />

            {/* Header: Thumbnail + Title + Close (✕) */}
            <View style={resetStyles.headerRow}>
              <View style={resetStyles.headerLeft}>
                <View style={resetStyles.headerThumbnail}>
                  <Image
                    source={require('../assets/flaticon/reload.png')}
                    style={resetStyles.headerThumbnailIcon}
                  />
                </View>
                <View style={resetStyles.headerTitleCol}>
                  <Text style={resetStyles.sheetTitle}>Reset Tiket Demo</Text>
                  <Text style={resetStyles.sheetSubtitle}>
                    Pilih event untuk reset status tiket
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={resetStyles.closeBtn}
                onPress={() => setShowResetModal(false)}
                activeOpacity={0.75}
              >
                <Image
                  source={require('../assets/flaticon/x-no-bg.png')}
                  style={resetStyles.closeIcon}
                />
              </TouchableOpacity>
            </View>

            {loadingEvents ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 28 }} />
            ) : events.length === 0 ? (
              <Text style={resetStyles.emptyText}>Belum ada event terdaftar.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                <View style={resetStyles.eventGrid}>
                  {events.map((event, index) => {
                    const eventThemes = [
                      { icon: require('../assets/flaticon/music-event.png'), bg: '#818cf8' },
                      { icon: require('../assets/flaticon/sing-event.png'), bg: '#fb7185' },
                      { icon: require('../assets/flaticon/ticket-event.png'), bg: '#fb923c' },
                    ];
                    const theme = eventThemes[index % eventThemes.length];

                    return (
                      <View key={event.id} style={resetStyles.eventCard}>
                        <View style={[resetStyles.cardThumbnail, { backgroundColor: theme.bg }]}>
                          <Image source={theme.icon} style={resetStyles.cardThumbnailIcon} />
                        </View>
                        <View style={resetStyles.cardInfo}>
                          <Text style={resetStyles.eventName} numberOfLines={1}>
                            {event.name}
                          </Text>
                          <View style={resetStyles.cardDateRow}>
                            <Image
                              source={require('../assets/flaticon/calendar.png')}
                              style={resetStyles.cardDateIcon}
                            />
                            <Text style={resetStyles.eventDate}>{event.date}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            resetStyles.cardResetBtn,
                            resettingEventId === event.id && resetStyles.cardResetBtnDisabled,
                          ]}
                          onPress={() => handleResetEvent(event)}
                          disabled={resettingEventId === event.id}
                          activeOpacity={0.8}
                        >
                          {resettingEventId === event.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <Image
                                source={require('../assets/flaticon/reload.png')}
                                style={resetStyles.cardResetIcon}
                              />
                              <Text style={resetStyles.cardResetText}>Reset</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Dialog untuk Konfirmasi Logout & Reset Demo */}
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
    </SafeAreaView>
  );
}

// Styles khusus untuk fitur Reset Demo
const resetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  dragHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  headerThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerThumbnailIcon: {
    width: 20,
    height: 20,
    tintColor: '#dc2626',
  },
  headerTitleCol: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  closeIcon: {
    width: 11,
    height: 11,
    tintColor: '#64748b',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    marginVertical: 24,
  },
  eventGrid: {
    gap: 8,
    paddingBottom: 4,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardThumbnailIcon: {
    width: 20,
    height: 20,
    tintColor: '#ffffff',
  },
  cardInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDateIcon: {
    width: 11,
    height: 11,
    tintColor: '#64748b',
    marginRight: 4,
  },
  eventDate: {
    fontSize: 11,
    color: '#64748b',
  },
  cardResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cardResetBtnDisabled: {
    backgroundColor: '#94a3b8',
    elevation: 0,
  },
  cardResetIcon: {
    width: 12,
    height: 12,
    tintColor: '#ffffff',
  },
  cardResetText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
