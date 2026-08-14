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
import { SESSION_KEY } from '../config';
import { BASE_URL } from '../config';
import AppHeader from '../components/AppHeader';
import { styles } from './AdminProfileScreen.styles';

type Session = {
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
  const [session, setSession] = useState<Session | null>(null);

  // State untuk fitur Reset Demo
  const [showResetModal, setShowResetModal] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [resettingEventId, setResettingEventId] = useState<number | null>(null);

  // Muat data sesi setiap kali tab Profil aktif
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SESSION_KEY).then(str => {
        if (str) setSession(JSON.parse(str));
      });
    }, []),
  );

  const handleLogout = () => {
    Alert.alert('Konfirmasi Logout', 'Apakah kamu yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(SESSION_KEY);
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  // ── Reset Demo: Buka modal dan muat daftar event ──
  const handleOpenResetModal = async () => {
    setShowResetModal(true);
    setLoadingEvents(true);
    try {
      const res = await fetch(`${BASE_URL}/events`);
      const data = await res.json();
      setEvents(data.map((e: any) => ({ id: e.id, name: e.name, date: e.date })));
    } catch {
      Alert.alert('Error', 'Gagal memuat daftar event. Pastikan server aktif.');
    } finally {
      setLoadingEvents(false);
    }
  };

  // ── Reset Demo: Eksekusi reset untuk event yang dipilih ──
  const handleResetEvent = (event: EventItem) => {
    Alert.alert(
      'Reset Tiket?',
      `Semua tiket pada "${event.name}" akan direset menjadi BELUM DIGUNAKAN.\n\nHistori pemindaian juga akan dihapus.\n\nLanjutkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResettingEventId(event.id);
            try {
              // 1. Reset di server
              const res = await fetch(`${BASE_URL}/events/${event.id}/reset_tickets`, {
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

              Alert.alert(
                'Reset Berhasil!',
                `${data.tickets_reset} tiket direset dan ${data.scan_logs_deleted} log pemindaian dihapus untuk "${event.name}".`,
              );
              setShowResetModal(false);
            } catch {
              Alert.alert('Error', 'Gagal mereset tiket. Pastikan server aktif.');
            } finally {
              setResettingEventId(null);
            }
          },
        },
      ],
    );
  };

  const avatarLetter = session?.username
    ? session.username.charAt(0).toUpperCase()
    : 'A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Profil Admin" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.content}>
          {/* Kartu avatar dengan tema dark (dark navy) untuk membedakan dari profil penonton */}
          <View style={styles.avatarCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <Text style={styles.username}>{session?.username || '—'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>PENYELENGGARA</Text>
            </View>
          </View>

          {/*
            Panduan 3 Lapis Verifikasi — ringkasan untuk penyelenggara.
            Ini mencerminkan arsitektur keamanan sistem secara keseluruhan:
            - Lapis 1 (ECDSA): membuktikan tiket berasal dari server resmi
            - Lapis 2 (Gate-Bound TOTP): membuktikan QR segar dan dibuat di lokasi gerbang yang tepat
            - Lapis 3 (Anti-Double Spending): mencegah tiket digunakan lebih dari sekali
          */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Panduan Scanner</Text>

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

          {/* Informasi teknis singkat — berguna untuk laporan TA */}
          <View style={styles.appInfoCard}>
            <Text style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Versi  </Text>
              <Text style={styles.appInfoValue}>MVP 1.0 — Tugas Akhir</Text>
            </Text>
            <Text style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Kurva  </Text>
              <Text style={styles.appInfoValue}>ECDSA NIST P-256</Text>
            </Text>
            <Text style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>KDF    </Text>
              {/* Key Derivation Function: HMAC-SHA256 digunakan untuk ticket_secret → gate_secret */}
              <Text style={styles.appInfoValue}>HMAC-SHA256</Text>
            </Text>
          </View>

          {/* ── Tombol Reset Demo — Untuk Sidang/Demo TA ── */}
          <TouchableOpacity
            style={resetStyles.resetButton}
            onPress={handleOpenResetModal}
          >
            <Image
              source={require('../assets/flaticon/time-past.png')}
              style={{ width: 18, height: 18, tintColor: '#ffffff', marginRight: 8 }}
            />
            <Text style={resetStyles.resetButtonText}>Reset Status Tiket (Demo)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modal Pilih Event untuk Reset ── */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={resetStyles.overlay}>
          <View style={resetStyles.sheet}>
            <Text style={resetStyles.sheetTitle}>Pilih Event untuk Reset</Text>
            <Text style={resetStyles.sheetSubtitle}>
              Semua tiket pada event yang dipilih akan direset menjadi "Belum Digunakan".
            </Text>

            {loadingEvents ? (
              <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 24 }} />
            ) : events.length === 0 ? (
              <Text style={resetStyles.emptyText}>Belum ada event.</Text>
            ) : (
              events.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={resetStyles.eventCard}
                  onPress={() => handleResetEvent(event)}
                  disabled={resettingEventId === event.id}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={resetStyles.eventName}>{event.name}</Text>
                    <Text style={resetStyles.eventDate}>{event.date}</Text>
                  </View>
                  {resettingEventId === event.id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Image
                      source={require('../assets/flaticon/time-past.png')}
                      style={{ width: 20, height: 20, tintColor: '#dc2626' }}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={resetStyles.closeButton}
              onPress={() => setShowResetModal(false)}
            >
              <Text style={resetStyles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles khusus untuk fitur Reset Demo
const resetStyles = StyleSheet.create({
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
    marginVertical: 24,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  eventDate: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#6c757d',
    fontSize: 15,
    fontWeight: '600',
  },
});
