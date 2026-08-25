import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SESSION_KEY, getTicketsKey, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import type { TicketData } from '../types';
import AppHeader from '../components/AppHeader';
import { styles } from './MyTicketsListScreen.styles';

export default function MyTicketsListScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<TicketData[]>([]);

  /**
   * useFocusEffect: reload daftar tiket setiap kali tab "Tiket Saya" menjadi aktif.
   * Membaca key per-user (user_tickets_${userId}) agar tiket tidak bocor antar akun.
   *
   * [FITUR BARU] Setelah memuat data lokal, cek status terbaru dari server (is_used).
   * Jika server menandai tiket sebagai terpakai, update data lokal agar UI menunjukkan
   * badge "Sudah Digunakan" dan menonaktifkan tombol QR.
   */
  useFocusEffect(
    useCallback(() => {
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
            // Buat map ticket_id → is_used dari server
            // Buat map ticket_id → is_used dari data lokal
            const localMap = new Map<number, TicketData>();
            localTickets.forEach(t => localMap.set(t.ticketId, t));

            let hasChanges = false;
            // Gunakan serverTickets sebagai sumber utama (source of truth)
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
                  purchasedAt: new Date().toISOString(), // Fallback if missing
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
              // Persist ke AsyncStorage agar konsisten di session berikutnya
              await AsyncStorage.setItem(ticketsKey, JSON.stringify(updatedTickets));
            }
          }
        } catch {
          // Gagal sync? Tidak masalah — tetap tampilkan data lokal terakhir
        }
      };
      loadAndSyncTickets();
    }, []),
  );

  /**
   * Navigasi ke MyTicketScreen dengan meneruskan data kriptografis tiket.
   * ticketSecret dan signature adalah data paling penting — diperlukan untuk
   * generate Gate-Bound TOTP dan verifikasi ECDSA di layar QR.
   */
  const handleOpenQR = (ticket: TicketData) => {
    if (ticket.isUsed) return; // Blokir navigasi jika tiket sudah digunakan
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

  const renderItem = ({ item }: { item: TicketData }) => {
    // Format tanggal pembelian ke format Indonesia
    const purchasedDate = new Date(item.purchasedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const isUsed = item.isUsed || false;

    return (
      <TouchableOpacity
        style={[styles.ticketCard, isUsed && usedStyles.ticketCardUsed]}
        onPress={() => handleOpenQR(item)}
        activeOpacity={isUsed ? 1 : 0.85}
        disabled={isUsed}
      >
        {/* Badge "SUDAH DIGUNAKAN" — overlay di atas kartu */}
        {isUsed && (
          <View style={usedStyles.usedOverlay}>
            <Text style={usedStyles.usedBadge}>✓ SUDAH DIGUNAKAN</Text>
          </View>
        )}

        {/* Bagian atas kartu tiket (desain menyerupai tiket fisik) */}
        <View style={styles.ticketTop}>
          <View style={styles.ticketHeader}>
            <View style={[styles.eventBadge, isUsed && usedStyles.badgeUsed]}>
              <Text style={styles.eventBadgeText}>E-TICKET</Text>
            </View>
            <Text style={[styles.ticketId, isUsed && usedStyles.textMuted]}>#{item.ticketId}</Text>
          </View>
          <Text style={[styles.eventName, isUsed && usedStyles.textMuted]}>{item.eventName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Image source={require('../assets/flaticon/calendar.png')} style={{ width: 12, height: 12, tintColor: isUsed ? '#94a3b8' : '#64748b', marginRight: 4 }} />
            <Text style={[styles.eventDate, { marginBottom: 0 }, isUsed && usedStyles.textMuted]}>{item.eventDate}</Text>
          </View>
          {item.ticketType && (
            <Text style={[styles.ticketTypeBadge, isUsed && usedStyles.textMuted]}>
              {item.ticketType === 'regular' ? '🔵' :
               item.ticketType === 'silver'  ? '⚪' :
               item.ticketType === 'gold'    ? '🟡' : '🔴'}
              {' '}{item.ticketType.charAt(0).toUpperCase() + item.ticketType.slice(1)}
            </Text>
          )}
        </View>

        {/* Garis pemisah bergaya tiket sobek (torn ticket effect) */}
        <View style={styles.divider}>
          <View style={styles.dividerCircleLeft} />
          <View style={styles.dividerDashed} />
          <View style={styles.dividerCircleRight} />
        </View>

        {/* Bagian bawah kartu: tanggal beli & tombol buka QR */}
        <View style={styles.ticketBottom}>
          <View>
            <Text style={styles.purchasedLabel}>DIBELI</Text>
            <Text style={[styles.purchasedDate, isUsed && usedStyles.textMuted]}>{purchasedDate}</Text>
          </View>
          <View style={[styles.qrButton, isUsed && usedStyles.qrButtonDisabled]}>
            <Text style={[styles.qrButtonText, isUsed && usedStyles.qrButtonTextDisabled]}>
              {isUsed ? 'Tidak Tersedia' : 'Tampilkan QR'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Tampilan saat belum ada tiket yang dibeli
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image source={require('../assets/flaticon/ticket.png')} style={{ width: 64, height: 64, tintColor: '#9ca3af', marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Belum Ada Tiket</Text>
      <Text style={styles.emptySubtitle}>
        Tiket yang telah dibeli di tab Beranda akan muncul di sini.
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
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// Styles khusus untuk tiket yang sudah digunakan
const usedStyles = StyleSheet.create({
  ticketCardUsed: {
    opacity: 0.7,
  },
  usedOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#6b7280',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  usedBadge: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeUsed: {
    backgroundColor: '#9ca3af',
  },
  textMuted: {
    color: '#9ca3af',
  },
  qrButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  qrButtonTextDisabled: {
    color: '#9ca3af',
  },
});
