import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, getTicketsKey, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import type { TicketData } from '../types';
import AppHeader from '../components/AppHeader';
import { styles } from './MyTicketsListScreen.styles';

// Konfigurasi visual per tipe tiket
const TICKET_TYPE_MAP: Record<string, { label: string; color: string }> = {
  regular: { label: 'Regular', color: '#2563eb' },
  silver:  { label: 'Silver',  color: '#64748b' },
  gold:    { label: 'Gold',    color: '#d97706' },
  vip:     { label: 'VIP',     color: '#dc2626' },
};

export default function MyTicketsListScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  /**
   * useFocusEffect: reload daftar tiket setiap kali tab "Tiket Saya" menjadi aktif.
   * Membaca key per-user (user_tickets_${userId}) agar tiket tidak bocor antar akun.
   */
  const loadAndSyncTickets = async () => {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) { setTickets([]); return; }
    const session = JSON.parse(sessionStr);
    const ticketsKey = getTicketsKey(session.userId);
    const stored = await AsyncStorage.getItem(ticketsKey);
    let localTickets: TicketData[] = stored ? JSON.parse(stored) : [];

    // Sort lokal: yang belum digunakan di atas, yang sudah digunakan di bawah
    localTickets.sort((a, b) => {
      if (a.isUsed === b.isUsed) return 0;
      return a.isUsed ? 1 : -1;
    });
    
    // Tampilkan data lokal dulu agar tidak ada loading delay
    setTickets(localTickets);

    // Cek status terbaru dari server (fire-and-forget jika gagal)
    try {
      const res = await authFetch(`${BASE_URL}/my_tickets?user_id=${session.userId}`);
      if (res.ok) {
        const serverTickets: any[] = await res.json();
        const localMap = new Map<number, TicketData>();
        localTickets.forEach(t => localMap.set(t.ticketId, t));

        let hasChanges = false;
        const updatedTickets: TicketData[] = serverTickets.map((t: any) => {
          const local = localMap.get(t.ticket_id);
          if (!local) {
            hasChanges = true;
            return {
              ticketId: t.ticket_id,
              eventId: t.event_id,
              ticketType: t.ticket_type,
              eventName: t.event_name,
              eventDate: t.event_date,
              ticketSecret: t.ticket_secret,
              signature: t.signature,
              isUsed: t.is_used,
              purchasedAt: new Date().toISOString(),
            };
          }
          if (local.isUsed !== t.is_used) {
            hasChanges = true;
            return { ...local, isUsed: t.is_used };
          }
          return local;
        });

        if (hasChanges || updatedTickets.length !== localTickets.length) {
          updatedTickets.sort((a, b) => {
            if (a.isUsed === b.isUsed) return 0;
            return a.isUsed ? 1 : -1;
          });
          setTickets(updatedTickets);
          await AsyncStorage.setItem(ticketsKey, JSON.stringify(updatedTickets));
        }
      }
    } catch {
      // Gagal sync? Tidak masalah
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAndSyncTickets();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAndSyncTickets();
    setRefreshing(false);
  };

  /**
   * Navigasi ke MyTicketScreen dengan meneruskan data kriptografis tiket.
   */
  const handleOpenQR = (ticket: TicketData) => {
    if (ticket.isUsed) return;
    navigation.navigate('MyTicketScreen', {
      ticketId: ticket.ticketId,
      ticketSecret: ticket.ticketSecret,
      signature: ticket.signature,
      eventId: ticket.eventId,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      ticketType: ticket.ticketType,
    });
  };

  // Hitung jumlah statistik untuk 3-grid di atas
  const totalCount = tickets.length;
  const activeCount = tickets.filter(t => !t.isUsed).length;
  const usedCount = tickets.filter(t => t.isUsed).length;

  const renderItem = ({ item, index }: { item: TicketData; index: number }) => {
    const purchasedDate = new Date(item.purchasedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const isUsed = Boolean(item.isUsed);
    const themeItem = getEventTheme(index);
    const typeConfig = TICKET_TYPE_MAP[item.ticketType?.toLowerCase() || 'regular'] || {
      label: item.ticketType || 'Regular',
      color: '#2563eb',
    };

    return (
      <View style={[styles.ticketCard, isUsed && styles.ticketCardUsed]}>
        {/* Bagian Atas Tiket */}
        <View style={styles.ticketTop}>
          <View style={styles.ticketHeaderRow}>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>E-TICKET</Text>
            </View>

            {isUsed ? (
              <View style={styles.usedBadge}>
                <Image
                  source={require('../assets/flaticon/check-no-bg.png')}
                  style={styles.usedBadgeIcon}
                />
                <Text style={styles.usedBadgeText}>SUDAH DIGUNAKAN</Text>
              </View>
            ) : (
              <Text style={styles.ticketId}>#{item.ticketId}</Text>
            )}
          </View>

          {/* Baris Utama: Thumbnail + Info Event + QR Silhouette */}
          <View style={styles.ticketMainRow}>
            {/* Thumbnail Kategori Event */}
            <View style={[styles.eventThumbnail, { backgroundColor: isUsed ? '#cbd5e1' : themeItem.bg }]}>
              <Image source={themeItem.icon} style={styles.eventThumbnailIcon} />
            </View>

            {/* Info Nama, Tanggal, dan Tipe Tiket */}
            <View style={styles.ticketInfoCol}>
              <Text
                style={[styles.eventName, isUsed && styles.eventNameUsed]}
                numberOfLines={1}
              >
                {item.eventName}
              </Text>

              <View style={styles.metaRow}>
                <Image
                  source={require('../assets/flaticon/calendar.png')}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText}>{item.eventDate}</Text>
              </View>

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: isUsed ? '#94a3b8' : typeConfig.color },
                  ]}
                />
                <Text style={styles.typeText}>{typeConfig.label}</Text>
              </View>
            </View>

            {/* Watermark / Silhouette QR di Kanan */}
            <View style={styles.qrSilhouetteBox}>
              <Image
                source={require('../assets/flaticon/qr-code.png')}
                style={styles.qrSilhouetteIcon}
              />
            </View>
          </View>
        </View>

        {/* Garis Pembatas Putus-putus dengan Lekukan Sobekan Tiket Fisik */}
        <View style={styles.dividerContainer}>
          <View style={styles.notchLeft} />
          <View style={styles.dashedDivider} />
          <View style={styles.notchRight} />
        </View>

        {/* Bagian Bawah: Tanggal Beli & Tombol Tampilkan QR */}
        <View style={styles.ticketBottom}>
          <View style={styles.purchasedCol}>
            <View style={styles.purchasedBadge}>
              <Text style={styles.purchasedBadgeText}>DIBELI</Text>
            </View>
            <Text style={styles.purchasedDateText}>{purchasedDate}</Text>
          </View>

          {isUsed ? (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>Tidak Tersedia</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.showQrBtn}
              onPress={() => handleOpenQR(item)}
              activeOpacity={0.85}
            >
              <Image
                source={require('../assets/flaticon/qr-code.png')}
                style={styles.showQrIcon}
              />
              <Text style={styles.showQrText}>Tampilkan QR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Tampilan saat belum ada tiket yang dibeli
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/flaticon/tickets.png')}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Belum Ada Tiket</Text>
      <Text style={styles.emptySubtitle}>
        Tiket yang telah kamu beli di tab Beranda akan muncul di sini.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Tiket Saya" onBack={() => navigation.goBack()} />

      <FlatList
        data={tickets}
        keyExtractor={item => String(item.ticketId)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContainer,
          tickets.length === 0 && styles.listContainerEmpty,
        ]}
        ListHeaderComponent={
          tickets.length > 0 ? (
            <View>
              {/* 3 Grid Statistik Tiket di Atas */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
                    <Image
                      source={require('../assets/flaticon/tickets.png')}
                      style={[styles.statIcon, { tintColor: '#3b82f6' }]}
                    />
                  </View>
                  <Text style={[styles.statValue, { color: '#1d4ed8' }]}>{totalCount}</Text>
                  <Text style={styles.statLabel}>Total Tiket</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: '#f0fdf4' }]}>
                    <Image
                      source={require('../assets/flaticon/users.png')}
                      style={[styles.statIcon, { tintColor: '#22c55e' }]}
                    />
                  </View>
                  <Text style={[styles.statValue, { color: '#16a34a' }]}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Aktif</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconBadge, { backgroundColor: '#fef2f2' }]}>
                    <Image
                      source={require('../assets/flaticon/check.png')}
                      style={[styles.statIcon, { tintColor: '#ef4444' }]}
                    />
                  </View>
                  <Text style={[styles.statValue, { color: '#dc2626' }]}>{usedCount}</Text>
                  <Text style={styles.statLabel}>Digunakan</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>DAFTAR TIKET SAYA</Text>
            </View>
          ) : null
        }
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
