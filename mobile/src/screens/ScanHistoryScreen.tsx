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
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import type { ScanLogEntry } from '../types';
import AppHeader from '../components/AppHeader';
import { styles } from './ScanHistoryScreen.styles';

// Konfigurasi warna per tipe tiket
const TICKET_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  regular: { label: 'REGULAR', color: '#2563eb', bg: '#eff6ff' },
  silver:  { label: 'SILVER',  color: '#64748b', bg: '#f8fafc' },
  gold:    { label: 'GOLD',    color: '#d97706', bg: '#fffbeb' },
  vip:     { label: 'VIP',     color: '#dc2626', bg: '#fef2f2' },
};

type Props = { route: any; navigation: any };

export default function ScanHistoryScreen({ route, navigation }: Props) {
  const { eventId, eventName } = route.params || {};

  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: `Riwayat: ${eventName || 'Event'}` });
    fetchHistory();
  }, [eventId]);

  const fetchHistory = async () => {
    try {
      setError(null);
      const res = await authFetch(`${BASE_URL}/scan_history?event_id=${eventId}`);
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
    const dateStr = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/:/g, '.');

    return `${dateStr} • ${timeStr}`;
  };

  /** Format gate_id menjadi tampilan yang lebih ramah — misal: "silver_c" → "SILVER C" */
  const formatGateId = (gateId: string) => {
    return gateId.replace('_', ' ').toUpperCase();
  };

  const renderItem = ({ item, index }: { item: ScanLogEntry; index: number }) => {
    const typeConfig = TICKET_TYPE_CONFIG[item.ticket_type?.toLowerCase() || 'regular'] || TICKET_TYPE_CONFIG.regular;

    return (
      <View style={styles.logItem}>
        {/* Kolom Garis Timeline & Dot */}
        <View style={styles.timelineCol}>
          <View style={[styles.timelineDot, { backgroundColor: typeConfig.color }]} />
          {index < logs.length - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Kartu Log Pemindaian */}
        <View style={styles.logCard}>
          {/* Header Kartu: Tipe Tiket + Waktu Pemindaian */}
          <View style={styles.logCardHeader}>
            <View style={styles.typeBadge}>
              <View style={[styles.typeDot, { backgroundColor: typeConfig.color }]} />
              <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>

            <View style={styles.timeRow}>
              <Image
                source={require('../assets/flaticon/calendar.png')}
                style={styles.timeIcon}
              />
              <Text style={styles.logTime}>{formatTime(item.scanned_at)}</Text>
            </View>
          </View>

          {/* 3 Baris Info Terstruktur */}
          <View style={styles.logDetailsContainer}>
            {/* ID Tiket */}
            <View style={styles.logRowBox}>
              <View style={styles.logRowLeft}>
                <View style={styles.logRowIconBox}>
                  <Image
                    source={require('../assets/flaticon/ticket.png')}
                    style={styles.logRowIcon}
                  />
                </View>
                <Text style={styles.logKey}>ID Tiket</Text>
              </View>
              <Text style={styles.logVal}>#{item.ticket_id}</Text>
            </View>

            {/* Gerbang */}
            <View style={styles.logRowBox}>
              <View style={styles.logRowLeft}>
                <View style={styles.logRowIconBox}>
                  <Image
                    source={require('../assets/flaticon/gate.png')}
                    style={styles.logRowIcon}
                  />
                </View>
                <Text style={styles.logKey}>Gerbang</Text>
              </View>
              <Text style={styles.logVal}>{formatGateId(item.gate_id)}</Text>
            </View>

            {/* Log ID */}
            <View style={styles.logRowBox}>
              <View style={styles.logRowLeft}>
                <View style={styles.logRowIconBox}>
                  <Image
                    source={require('../assets/flaticon/disk.png')}
                    style={styles.logRowIcon}
                  />
                </View>
                <Text style={styles.logKey}>Log ID</Text>
              </View>
              <Text style={styles.logVal}>#{item.log_id}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/flaticon/history.png')}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Belum Ada Pemindaian</Text>
      <Text style={styles.emptySubtitle}>
        Riwayat pemindaian tiket yang berhasil akan muncul di sini setelah scanner digunakan.
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/flaticon/triangle-warning.png')}
        style={{ width: 48, height: 48, tintColor: '#dc2626', marginBottom: 16 }}
      />
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
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Riwayat Pemindaian" onBack={() => navigation.goBack()} />

      {/* Hero Event Banner & Data Minimization Note di Atas */}
      <View style={styles.heroCard}>
        <View style={styles.eventBannerRow}>
          <View style={styles.eventThumbnail}>
            <Image
              source={require('../assets/flaticon/music-event.png')}
              style={styles.eventThumbnailIcon}
            />
          </View>
          <Text style={styles.eventBannerTitle} numberOfLines={1}>
            {eventName || 'Event'}
          </Text>
          <Text style={styles.eventBannerCount}>{logs.length} pemindaian</Text>
        </View>

        {/* Catatan Privasi (Data Minimization) */}
        <View style={styles.privacyBanner}>
          <View style={styles.privacyIconBox}>
            <Image
              source={require('../assets/flaticon/privacy.png')}
              style={styles.privacyIcon}
            />
          </View>
          <View style={styles.privacyTextBox}>
            <Text style={styles.privacyTitle}>Data minimization</Text>
            <Text style={styles.privacySubtitle}>
              Histori ini tidak menyimpan atau menampilkan identitas pribadi penonton.
            </Text>
          </View>
          <View style={styles.privacyCheckCircle}>
            <Image
              source={require('../assets/flaticon/check-no-bg.png')}
              style={styles.privacyCheckIcon}
            />
          </View>
        </View>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      />
    </SafeAreaView>
  );
}
