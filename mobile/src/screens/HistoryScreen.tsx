import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, getTicketsKey } from '../config';
import AppHeader from '../components/AppHeader';
import { styles } from './HistoryScreen.styles';

// Tipe data tiket lokal untuk riwayat
type TicketData = {
  ticketId: number;
  eventName: string;
  eventDate: string;
  ticketType?: string;
  purchasedAt: string;
};

// Konfigurasi visual per tipe tiket
const TICKET_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; watermark: any }
> = {
  regular: {
    label: 'Regular',
    color: '#2563eb',
    bg: '#eff6ff',
    watermark: require('../assets/flaticon/ticket.png'),
  },
  silver: {
    label: 'Silver',
    color: '#64748b',
    bg: '#f8fafc',
    watermark: require('../assets/flaticon/medal.png'),
  },
  gold: {
    label: 'Gold',
    color: '#d97706',
    bg: '#fffbeb',
    watermark: require('../assets/flaticon/crown.png'),
  },
  vip: {
    label: 'VIP',
    color: '#dc2626',
    bg: '#fef2f2',
    watermark: require('../assets/flaticon/sparkler.png'),
  },
};

export default function HistoryScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Helper thumbnail visual kartu event (Music / Sing / Ticket)
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

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

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
    }).replace(':', '.');

    const themeItem = getEventTheme(index);
    const typeKey = item.ticketType?.toLowerCase() || 'regular';
    const typeConfig = TICKET_TYPE_CONFIG[typeKey] || TICKET_TYPE_CONFIG.regular;

    return (
      <View style={styles.historyItem}>
        {/* Kolom Garis Timeline & Titik Dot */}
        <View style={styles.timelineCol}>
          <View
            style={[
              styles.timelineDot,
              { backgroundColor: typeConfig.color },
            ]}
          />
          {index < tickets.length - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Kartu Transaksi */}
        <View style={styles.historyCard}>
          {/* Baris Atas Kartu */}
          <View style={styles.cardTopRow}>
            {/* Thumbnail Event Kiri */}
            <View style={[styles.eventThumbnail, { backgroundColor: themeItem.bg }]}>
              <Image source={themeItem.icon} style={styles.eventThumbnailIcon} />
            </View>

            {/* Kolom Info Tengah */}
            <View style={styles.eventInfoCol}>
              <Text style={styles.historyEvent} numberOfLines={1}>
                {item.eventName}
              </Text>
              <View style={styles.metaRow}>
                <Image
                  source={require('../assets/flaticon/calendar.png')}
                  style={styles.metaIcon}
                />
                <Text style={styles.historyEventDate}>{item.eventDate}</Text>
              </View>
            </View>

            {/* Kolom Kanan: Pill Badge Tipe & Watermark Icon */}
            <View style={styles.badgeWatermarkCol}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeConfig.bg, borderColor: typeConfig.color },
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                  {typeConfig.label.toUpperCase()}
                </Text>
              </View>

              <Image
                source={typeConfig.watermark}
                style={[styles.watermarkIcon, { tintColor: typeConfig.color }]}
              />
            </View>
          </View>

          {/* Garis Pembatas Putus-putus */}
          <View style={styles.dashedLine} />

          {/* Baris Bawah Kartu: ID Tiket & Waktu Pembelian */}
          <View style={styles.cardBottomRow}>
            <View style={styles.ticketIdRow}>
              <Image
                source={require('../assets/flaticon/ticket.png')}
                style={styles.ticketIcon}
              />
              <Text style={styles.historyTicketId}>Tiket #{item.ticketId}</Text>
            </View>
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
      <Image
        source={require('../assets/flaticon/history.png')}
        style={styles.emptyIcon}
      />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      />
    </SafeAreaView>
  );
}
