import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Reload saat tab aktif
import { SESSION_KEY, getTicketsKey } from '../config';
import AppHeader from '../components/AppHeader';
import { styles } from './HistoryScreen.styles';

// Tipe lokal yang hanya berisi field yang diperlukan di layar ini
type TicketData = {
  ticketId: number;
  eventName: string;
  eventDate: string;
  ticketType?: string; // Tipe tiket: regular/silver/gold/vip (opsional untuk backward compat)
  purchasedAt: string;
};

// Badge warna per tipe tiket
const TICKET_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  regular: { label: 'Regular', color: '#007BFF', bg: '#eff6ff' }, // Azure Blue
  silver:  { label: 'Silver',  color: '#64748b', bg: '#f8f9fa' },
  gold:    { label: 'Gold',    color: '#d97706', bg: '#fffbeb' },
  vip:     { label: 'VIP',     color: '#dc2626', bg: '#fef2f2' },
};

export default function HistoryScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<TicketData[]>([]);

  /**
   * useFocusEffect: memuat ulang riwayat setiap kali tab "Riwayat" aktif.
   * Tiket baru disimpan di AsyncStorage dari UserDashboard, sehingga perlu
   * di-reload agar selalu menampilkan data terbaru tanpa restart app.
   */
  useFocusEffect(
    useCallback(() => {
      // Baca tiket dari key per-user agar riwayat tidak bocor antar akun
      const loadHistory = async () => {
        const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
        if (!sessionStr) { setTickets([]); return; }
        const session = JSON.parse(sessionStr);
        const ticketsKey = getTicketsKey(session.userId);
        const stored = await AsyncStorage.getItem(ticketsKey);
        if (stored) {
          const sorted: TicketData[] = JSON.parse(stored).sort(
            (a: TicketData, b: TicketData) =>
              new Date(b.purchasedAt).getTime() -
              new Date(a.purchasedAt).getTime(),
          );
          setTickets(sorted);
        } else {
          setTickets([]);
        }
      };
      loadHistory();
    }, []),
  );

  const renderItem = ({ item, index }: { item: TicketData; index: number }) => {
    // Format tanggal dan waktu pembelian ke format Indonesia
    const date = new Date(item.purchasedAt);
    const dateStr = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.historyItem}>
        <View style={styles.timelineCol}>
          <View style={[styles.timelineDot, item.ticketType ? { backgroundColor: TICKET_TYPE_CONFIG[item.ticketType]?.color ?? '#007BFF' } : undefined]} />
          {index < tickets.length - 1 && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyEvent}>{item.eventName}</Text>
            {item.ticketType && TICKET_TYPE_CONFIG[item.ticketType] ? (
              <View style={[styles.typeBadge, { backgroundColor: TICKET_TYPE_CONFIG[item.ticketType].bg, borderColor: TICKET_TYPE_CONFIG[item.ticketType].color }]}>
                <Text style={[styles.typeBadgeText, { color: TICKET_TYPE_CONFIG[item.ticketType].color }]}>
                  {TICKET_TYPE_CONFIG[item.ticketType].label.toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>DIBELI</Text>
              </View>
            )}
          </View>
          <Text style={styles.historyEventDate}>📅 {item.eventDate}</Text>
          <View style={styles.historyMeta}>
            <Text style={styles.historyTicketId}>Tiket #{item.ticketId}</Text>
            <Text style={styles.historyTime}>
              {dateStr} • {timeStr}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image source={require('../assets/flaticon/history.png')} style={{ width: 64, height: 64, tintColor: '#9ca3af', marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Riwayat Kosong</Text>
      <Text style={styles.emptySubtitle}>
        Riwayat pembelian tiket akan muncul di sini.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Riwayat Pembelian" onBack={() => navigation.goBack()} />

      <FlatList
        data={tickets}
        keyExtractor={item => String(item.ticketId)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContainer,
          tickets.length === 0 && styles.listContainerEmpty,
        ]}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
