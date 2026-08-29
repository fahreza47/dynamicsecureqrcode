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
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, AUTH_TOKEN_KEY, getTicketsKey, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import Snackbar from '../components/Snackbar';
import AppHeader from '../components/AppHeader';
import CustomDialog, { DialogType } from '../components/CustomDialog';
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
  const [activeTicketCount, setActiveTicketCount] = useState(0);
  const [usedTicketCount, setUsedTicketCount] = useState(0);
  const [originInput, setOriginInput] = useState('');
  const [savingOrigin, setSavingOrigin] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk custom Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('success');

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

  const showSnackbar = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const loadData = async () => {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      const s: Session = JSON.parse(sessionStr);
      setSession(s);
      setOriginInput(s.origin || '');

      const ticketsKey = getTicketsKey(s.userId);
      const ticketsStr = await AsyncStorage.getItem(ticketsKey);
      let list: any[] = ticketsStr ? JSON.parse(ticketsStr) : [];

      // Cek update terbaru dari server jika online
      try {
        const res = await authFetch(`${BASE_URL}/my_tickets?user_id=${s.userId}`);
        if (res.ok) {
          const serverTickets: any[] = await res.json();
          if (Array.isArray(serverTickets)) {
            list = serverTickets;
          }
        }
      } catch {
        // Fallback ke data lokal jika offline
      }

      setTicketCount(list.length);
      setActiveTicketCount(list.filter(t => !t.is_used && !t.isUsed).length);
      setUsedTicketCount(list.filter(t => t.is_used || t.isUsed).length);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    setDialogConfig({
      visible: true,
      type: 'confirm',
      title: 'Konfirmasi Logout',
      message: 'Apakah kamu yakin ingin keluar dari akun ini?',
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
    : 'U';

  const hasOrigin = Boolean(session?.origin);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Profil Saya" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Kartu Profil Hero (Soft Pastel Blue) */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={styles.username}>{session?.username || '—'}</Text>
          <View style={styles.roleBadge}>
            <Image
              source={require('../assets/flaticon/user.png')}
              style={styles.roleIcon}
            />
            <Text style={styles.roleText}>PENONTON</Text>
          </View>
        </View>

        {/* 3 Grid Statistik Tiket Pengguna (Total / Aktif / Digunakan) */}
        <View style={styles.statsRow}>
          {/* Total Tiket */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
              <Image
                source={require('../assets/flaticon/tickets.png')}
                style={[styles.statIcon, { tintColor: '#3b82f6' }]}
              />
            </View>
            <Text style={[styles.statValue, { color: '#1d4ed8' }]}>{ticketCount}</Text>
            <Text style={styles.statLabel}>Total Tiket</Text>
          </View>

          {/* Tiket Aktif */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#f0fdf4' }]}>
              <Image
                source={require('../assets/flaticon/users.png')}
                style={[styles.statIcon, { tintColor: '#22c55e' }]}
              />
            </View>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{activeTicketCount}</Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>

          {/* Tiket Digunakan */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#fef2f2' }]}>
              <Image
                source={require('../assets/flaticon/check.png')}
                style={[styles.statIcon, { tintColor: '#ef4444' }]}
              />
            </View>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{usedTicketCount}</Text>
            <Text style={styles.statLabel}>Digunakan</Text>
          </View>
        </View>

        {/* ─── Kartu Data Diri ─────────────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconBadge}>
                <Image
                  source={require('../assets/flaticon/user.png')}
                  style={styles.sectionIcon}
                />
              </View>
              <Text style={styles.infoTitle}>DATA DIRI</Text>
            </View>

            {!editingOrigin && (
              <TouchableOpacity
                onPress={() => setEditingOrigin(true)}
                style={styles.editBtn}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../assets/flaticon/edit.png')}
                  style={styles.editBtnIcon}
                />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Catatan Data Minimization */}
          <View style={styles.dataNoteBox}>
            <Text style={styles.dataNoteText}>
              Data asal daerah digunakan untuk analisis tingkat antusiasme acara
              oleh penyelenggara. Data ini <Text style={{ fontWeight: 'bold' }}>tidak masuk ke dalam payload QR tiket</Text> (data minimization).
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Asal Daerah</Text>
            {!editingOrigin && (
              <Text style={[styles.infoValue, !hasOrigin && styles.infoValueEmpty]}>
                {hasOrigin ? session!.origin : 'Belum diisi'}
              </Text>
            )}
          </View>

          {editingOrigin && (
            <View style={styles.originEditSection}>
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
                  activeOpacity={0.8}
                >
                  {savingOrigin ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Simpan</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setOriginInput(session?.origin || '');
                    setEditingOrigin(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Peringatan jika profil belum diisi */}
          {!hasOrigin && !editingOrigin && (
            <View style={styles.warningBox}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Image
                  source={require('../assets/flaticon/triangle-warning.png')}
                  style={{ width: 14, height: 14, tintColor: '#d97706', marginRight: 6, marginTop: 1 }}
                />
                <Text style={[styles.warningText, { flex: 1 }]}>
                  Profil belum lengkap! Lengkapi data asal daerah sebelum membeli tiket.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrigin(true)}>
                <Text style={styles.warningLink}>Lengkapi Sekarang ›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Info Aplikasi (Selaras dengan Admin Profile) ───── */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconBadge}>
                <Image
                  source={require('../assets/flaticon/setting.png')}
                  style={styles.sectionIcon}
                />
              </View>
              <Text style={styles.infoTitle}>TENTANG APLIKASI</Text>
            </View>
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

          <View style={styles.appInfoRowContainer}>
            <Text style={styles.appInfoLabel}>Interval</Text>
            <Text style={styles.appInfoColon}>:</Text>
            <Text style={styles.appInfoValue}>30 Detik (Gate-Bound TOTP)</Text>
          </View>
        </View>

        {/* Tombol Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Image
            source={require('../assets/flaticon/user-logout.png')}
            style={{ width: 16, height: 16, tintColor: '#ffffff', marginRight: 4 }}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Dialog untuk Konfirmasi Logout */}
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



