/**
 * ScanHistoryScreen.tsx — Histori Pemindaian Tiket per Event (SISI ADMIN)
 *
 * Menampilkan log pemindaian tiket yang berhasil untuk satu event tertentu.
 * Data diambil dari backend (GET /scan_history?event_id=...) dan ditampilkan
 * dalam format timeline yang mudah dibaca.
 *
 * CATATAN PRIVASI: Sesuai prinsip data minimization TA,
 * histori ini TIDAK menampilkan nama atau identitas pribadi penonton.
 * Hanya menampilkan: ID tiket (anonim), tipe tiket, gate, dan waktu masuk.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { BASE_URL } from '../config';
import type { ScanLogEntry } from '../types';
import AppHeader from '../components/AppHeader';
import { styles } from './ScanHistoryScreen.styles';

// Konfigurasi warna dan emoji per tipe tiket — konsisten dengan bleGate.ts
const TICKET_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  regular: { label: 'Regular', color: '#007BFF', bg: '#eff6ff', emoji: '🔵' }, // Azure Blue
  silver:  { label: 'Silver',  color: '#64748b', bg: '#f8f9fa', emoji: '⚪' },
  gold:    { label: 'Gold',    color: '#d97706', bg: '#fffbeb', emoji: '🟡' },
  vip:     { label: 'VIP',     color: '#dc2626', bg: '#fef2f2', emoji: '🔴' },
};

type Props = { route: any; navigation: any };

export default function ScanHistoryScreen({ route, navigation }: Props) {
  const { eventId, eventName } = route.params || {};

  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update judul header dengan nama event
    navigation.setOptions({ title: `Riwayat: ${eventName || 'Event'}` });
    fetchHistory();
  }, [eventId]);

  const fetchHistory = async () => {
    try {
      setError(null);
      const res = await fetch(`${BASE_URL}/scan_history?event_id=${eventId}`);
      if (res.ok) {
        const data: ScanLogEntry[] = await res.json();
        setLogs(data);
      } else {
        setError('Gagal memuat riwayat pemindaian.');
      }
    } catch {
      setError('Tidak dapat menghubungi server. Periksa koneksi internet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatTime = (isoStr: string) => {
    if (!isoStr) return '—';
    const date = new Date(isoStr);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /** Format gate_id menjadi tampilan yang lebih ramah — misal: "regular_a" → "Regular A" */
  const formatGateId = (gateId: string) => {
    return gateId.replace('_', ' ').toUpperCase();
  };

  const renderItem = ({ item, index }: { item: ScanLogEntry; index: number }) => {
    const typeConfig = TICKET_TYPE_CONFIG[item.ticket_type] || TICKET_TYPE_CONFIG.regular;

    return (
      <View style={styles.logItem}>
        {/* Kolom timeline */}
        <View style={styles.timelineCol}>
          <View style={[styles.timelineDot, { backgroundColor: typeConfig.color }]} />
          {index < logs.length - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Kartu log */}
        <View style={styles.logCard}>
          {/* Header: tipe tiket + waktu */}
          <View style={styles.logCardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg, borderColor: typeConfig.color }]}>
              <Text style={styles.typeEmoji}>{typeConfig.emoji}</Text>
              <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
            </View>
            <Text style={styles.logTime}>{formatTime(item.scanned_at)}</Text>
          </View>

          {/* Detail */}
          <View style={styles.logDetails}>
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailKey}>ID Tiket</Text>
              <Text style={styles.logDetailValue}>#{item.ticket_id}</Text>
            </View>
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailKey}>Gerbang</Text>
              <Text style={[styles.logDetailValue, { color: typeConfig.color, fontWeight: 'bold' }]}>
                {formatGateId(item.gate_id)}
              </Text>
            </View>
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailKey}>Log ID</Text>
              <Text style={styles.logDetailValue}>#{item.log_id}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⏳</Text>
      <Text style={styles.emptyTitle}>Belum Ada Pemindaian</Text>
      <Text style={styles.emptySubtitle}>
        Riwayat pemindaian tiket yang berhasil akan muncul di sini setelah scanner digunakan.
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 48, height: 48, tintColor: '#d97706', marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Gagal Memuat Data</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
        <Text style={styles.retryButtonText}>Coba Lagi</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Riwayat Pemindaian" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Riwayat Pemindaian" onBack={() => navigation.goBack()} />
      {/* Header info event */}
      <View style={styles.eventBanner}>
        <Text style={styles.eventBannerTitle}>{eventName}</Text>
        <Text style={styles.eventBannerCount}>{logs.length} pemindaian</Text>
      </View>

      {/* Catatan privasi */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyNoteText}>
          🔒 Data minimization: histori ini tidak memuat identitas pribadi penonton.
        </Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => String(item.log_id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContainer,
          (logs.length === 0 || error) && styles.listContainerEmpty,
        ]}
        ListEmptyComponent={error ? <ErrorState /> : <EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007BFF']}
            tintColor="#007BFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}



