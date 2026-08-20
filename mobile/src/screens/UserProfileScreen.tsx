/**
 * UserProfileScreen.tsx — Layar Profil Penonton
 *
 * Menampilkan informasi akun pengguna dan memungkinkan pengisian data diri
 * (asal daerah) yang digunakan untuk analisis demografis penyelenggara.
 *
 * CATATAN DATA MINIMIZATION: Data asal daerah penonton disimpan di server
 * untuk keperluan analisis antusiasme event (bukan identifikasi personal),
 * dan TIDAK diikutsertakan ke dalam kode QR tiket.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, AUTH_TOKEN_KEY, getTicketsKey, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import Snackbar from '../components/Snackbar';
import AppHeader from '../components/AppHeader';
import { styles } from './UserProfileScreen.styles';

type Session = {
  userId: number;
  username: string;
  role: string;
  origin?: string;
};

export default function UserProfileScreen({ navigation }: any) {
  const [session, setSession] = useState<Session | null>(null);
  const [ticketCount, setTicketCount] = useState(0);
  const [originInput, setOriginInput] = useState('');
  const [savingOrigin, setSavingOrigin] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState(false);

  // State untuk custom Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionStr) {
          const s: Session = JSON.parse(sessionStr);
          setSession(s);
          setOriginInput(s.origin || '');
          const ticketsStr = await AsyncStorage.getItem(getTicketsKey(s.userId));
          setTicketCount(ticketsStr ? JSON.parse(ticketsStr).length : 0);
        }
      };
      loadData();
    }, []),
  );

  const handleLogout = () => {
    Alert.alert('Konfirmasi Logout', 'Apakah kamu yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          await AsyncStorage.removeItem(SESSION_KEY);
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  /** Simpan asal daerah ke backend dan update sesi lokal */
  const handleSaveOrigin = async () => {
    if (!session?.userId) return;
    if (!originInput.trim()) {
      showSnackbar('Asal daerah tidak boleh kosong.', 'error');
      return;
    }
    try {
      setSavingOrigin(true);
      const res = await authFetch(`${BASE_URL}/users/${session.userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: originInput.trim() }),
      });

      if (res.ok) {
        // Update sesi lokal di AsyncStorage agar tidak perlu login ulang
        const updatedSession = { ...session, origin: originInput.trim() };
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        setSession(updatedSession);
        setEditingOrigin(false);
        showSnackbar('Data profil berhasil disimpan.', 'success');
      } else {
        showSnackbar('Tidak dapat menyimpan data profil.', 'error');
      }
    } catch {
      showSnackbar('Tidak dapat menghubungi server.', 'error');
    } finally {
      setSavingOrigin(false);
    }
  };

  const avatarLetter = session?.username
    ? session.username.charAt(0).toUpperCase()
    : '?';

  const hasOrigin = Boolean(session?.origin);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Profil Saya" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Kartu avatar */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={styles.username}>{session?.username || '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>PENONTON</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ticketCount}</Text>
            <Text style={styles.statLabel}>Tiket Saya</Text>
          </View>
          <View style={styles.statCard}>
            <Image source={require('../assets/flaticon/qr-code.png')} style={{ width: 22, height: 22, tintColor: '#212529', alignSelf: 'center', marginBottom: 2 }} />
            <Text style={styles.statLabel}>QR Dinamis</Text>
          </View>
          <View style={styles.statCard}>
            <Image source={require('../assets/flaticon/checked.png')} style={{ width: 22, height: 22, tintColor: '#212529', alignSelf: 'center', marginBottom: 2 }} />
            <Text style={styles.statLabel}>Offline Ready</Text>
          </View>
        </View>

        {/* ─── Kartu Data Diri ─────────────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoTitle}>Data Diri</Text>
            {!editingOrigin && (
              <TouchableOpacity onPress={() => setEditingOrigin(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={require('../assets/flaticon/edit.png')} style={{ width: 14, height: 14, tintColor: '#007BFF', marginRight: 4 }} />
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Penjelasan tujuan data ini */}
          <View style={styles.dataNoteBox}>
            <Text style={styles.dataNoteText}>
              Data asal daerah digunakan untuk analisis tingkat antusiasme acara
              oleh penyelenggara. Data ini <Text style={{ fontWeight: 'bold' }}>tidak masuk ke dalam payload QR tiket</Text> (data minimization).
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Asal Daerah</Text>
            {editingOrigin ? (
              <View style={styles.originEditRow}>
                <TextInput
                  style={styles.originInput}
                  value={originInput}
                  onChangeText={setOriginInput}
                  placeholder="mis. Jakarta, Bandung, Surabaya"
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
                <View style={styles.originBtnRow}>
                  <TouchableOpacity
                    style={[styles.saveBtn, savingOrigin && styles.saveBtnDisabled]}
                    onPress={handleSaveOrigin}
                    disabled={savingOrigin}
                  >
                    {savingOrigin ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.saveBtnText}>Simpan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setOriginInput(session?.origin || '');
                      setEditingOrigin(false);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.infoValue, !hasOrigin && styles.infoValueEmpty]}>
                {hasOrigin ? session!.origin : 'Belum diisi'}
              </Text>
            )}
          </View>

          {/* Peringatan jika profil belum diisi */}
          {!hasOrigin && !editingOrigin && (
            <View style={styles.warningBox}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 16, height: 16, tintColor: '#d97706', marginRight: 6, marginTop: 2 }} />
                <Text style={[styles.warningText, { flex: 1 }]}>
                  Profil belum lengkap! Pengguna diharapkan mengisi data asal daerah sebelum membeli tiket.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrigin(true)}>
                <Text style={styles.warningLink}>Lengkapi Sekarang</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Info Aplikasi ────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Tentang Aplikasi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi</Text>
            <Text style={styles.infoValue}>MVP 1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Keamanan</Text>
            <Text style={styles.infoValue}>ECDSA + TOTP + Anti-Replay</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>QR Interval</Text>
            <Text style={styles.infoValue}>30 detik</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Mode Offline</Text>
            <Text style={styles.infoValue}>Didukung</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Image
            source={require('../assets/flaticon/user-logout.png')}
            style={{ width: 18, height: 18, tintColor: '#ffffff', marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

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



