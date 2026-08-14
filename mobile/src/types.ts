/**
 * types.ts — Definisi Tipe TypeScript Terpusat
 *
 * Semua tipe data domain dan tipe navigasi didefinisikan di sini
 * agar konsisten di seluruh aplikasi dan menggantikan penggunaan `any`.
 */

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// Root Stack — Pembungkus Seluruh Navigator
// ─────────────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  UserTabs: undefined;
  AdminTabs: undefined;
  MyTicketScreen: {
    ticketId: number;
    ticketSecret: string;   // [KRITIS] Rahasia tiket untuk derivasi gate_secret
    signature: string;      // Tanda tangan ECDSA untuk keaslian tiket
    eventId: number;
    eventName: string;
    eventDate: string;
    ticketType: string;     // Tipe tiket: regular/silver/gold/vip — untuk filter gate BLE
  };
  ScanHistoryScreen: {
    eventId: number;
    eventName: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// User Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
export type UserTabParamList = {
  Home: undefined;
  MyTicketsList: undefined;
  History: undefined;
  UserProfile: undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
export type AdminTabParamList = {
  AdminHome: undefined;
  Scanner: {
    eventId?: number;
    eventName?: string;
    eventLocation?: string;
  } | undefined;
  AdminProfile: undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Prop Types
// ─────────────────────────────────────────────────────────────────────────────
export type UserTabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<UserTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

export type AdminTabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

export type MyTicketScreenRouteProp = RouteProp<RootStackParamList, 'MyTicketScreen'>;
export type ScanHistoryScreenRouteProp = RouteProp<RootStackParamList, 'ScanHistoryScreen'>;

// ─────────────────────────────────────────────────────────────────────────────
// Domain Types — Entitas Data Aplikasi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Data tiket yang disimpan di AsyncStorage setelah pembelian.
 * ticketSecret dan signature adalah data kriptografis utama.
 * ticketType menentukan gerbang mana yang dapat diakses penonton.
 */
export type TicketData = {
  ticketId: number;
  ticketSecret: string;   // [KRITIS] Hex string — untuk derive gate_secret via HMAC
  signature: string;      // [KRITIS] Base64 — tanda tangan ECDSA untuk keaslian
  eventId: number;
  eventName: string;
  eventDate: string;
  ticketType: string;     // "regular" / "silver" / "gold" / "vip"
  purchasedAt: string;    // ISO timestamp — untuk sorting di HistoryScreen
  isUsed?: boolean;       // Status dari server — true jika tiket sudah di-scan di gerbang
};

/**
 * Data event yang diterima dari backend.
 * Dilengkapi dengan informasi lokasi, waktu, dan kuota tiket per tipe.
 */
export type EventData = {
  id: number;
  name: string;
  date: string;
  location?: string;
  time?: string;
  quota_regular?: number;
  quota_silver?: number;
  quota_gold?: number;
  quota_vip?: number;
  // Sisa kuota (dikembalikan oleh GET /events) — digunakan di popup pilih tipe
  remaining_regular?: number;
  remaining_silver?: number;
  remaining_gold?: number;
  remaining_vip?: number;
};

/**
 * Sesi pengguna yang disimpan di AsyncStorage setelah login.
 * masterSecretKey adalah root dari hierarki kunci — tidak pernah dikirim ke pihak lain.
 */
export type UserSession = {
  userId: number;
  username: string;
  role: 'user' | 'admin';
  masterSecretKey: string; // [KRITIS] Root key KDF
  origin?: string;         // Asal daerah penonton (null jika belum diisi)
};

/**
 * Entri dalam offline database lokal milik admin scanner.
 * Berisi ticket_secret dan ticket_type semua tiket.
 */
export type OfflineTicketEntry = {
  secret: string;      // ticket_secret dalam hex — untuk validasi gate-bound TOTP
  eventId: string;     // eventId sebagai string untuk perbandingan dengan payload QR
  ticketType: string;  // Tipe tiket — untuk validasi bahwa gate sesuai tipe tiket
};

/** Respons statistik dari endpoint GET /stats */
export type StatsResponse = {
  total_sold: number;
  total_used: number;
  total_active: number;
  total_events: number;
  events?: Array<{
    id: number;
    name: string;
    date: string;
    location?: string;
    time?: string;
    quota_regular: number;
    quota_silver: number;
    quota_gold: number;
    quota_vip: number;
    total_sold: number;
    total_used: number;
    total_active: number;
    sold_regular: number;
    sold_silver: number;
    sold_gold: number;
    sold_vip: number;
  }>;
};

/** Satu entri log pemindaian dari endpoint GET /scan_history */
export type ScanLogEntry = {
  log_id: number;
  ticket_id: number;
  gate_id: string;      // misal: "regular_a"
  ticket_type: string;  // "regular" / "silver" / "gold" / "vip"
  scanned_at: string;   // ISO string UTC
};
