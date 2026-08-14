/**
 * bleGate.ts — Utilitas Kriptografi Gate-Bound TOTP
 *
 * File ini adalah INTI dari kontribusi inovatif TA:
 * "Gate-Bound TOTP" — kode QR yang tidak hanya berubah setiap 30 detik,
 * tetapi juga terikat secara kriptografis ke identitas gerbang fisik tertentu.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                HIERARKI DERIVASI KUNCI (KDF)                    │
 * │                                                                 │
 * │  master_secret  (per user, di backend)                          │
 * │      └── ticket_secret = HMAC(master_secret, ticket_id)         │
 * │              └── gate_secret = HMAC(ticket_secret, gate_id)     │
 * │                      └── TOTP(gate_secret, time_step)           │
 * │                              └── [6-digit OTP dalam QR payload] │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Keunggulan arsitektur ini:
 * - Satu tiket yang bocor tidak bisa digunakan di gerbang lain (gate isolation)
 * - Satu tiket yang bocor tidak mengungkap tiket pengguna lain (user isolation)
 * - QR hanya bisa di-generate setelah HP pengguna mendeteksi sinyal BLE gerbang
 *
 * Format Gate ID: {type}_{letter} — misal: regular_a, silver_b, vip_c
 * 4 tipe × 3 huruf = 12 gerbang total
 */

import { Buffer } from 'buffer';
import { hmac } from '@noble/hashes/hmac.js';   // HMAC — fungsi utama key derivation
import { sha256 } from '@noble/hashes/sha2.js'; // SHA-256 sebagai fungsi hash untuk HMAC

// ─────────────────────────────────────────────────────────────────────────────
// Konstanta & Tipe Gate
// ─────────────────────────────────────────────────────────────────────────────

/** Tipe tiket yang tersedia — menentukan gerbang mana yang dapat diakses */
export type TicketType = 'regular' | 'silver' | 'gold' | 'vip';

/** Tipe data representasi satu gerbang fisik di venue */
export type Gate = {
  id: string;       // ID mesin (digunakan dalam kriptografi, misal: "regular_a")
  name: string;     // Nama tampilan di UI, misal: "Regular A"
  gateType: string; // Tipe gate: regular / silver / gold / vip
  letter: string;   // Huruf gerbang dalam tipe yang sama: A / B / C
  emoji: string;    // Ikon visual di UI
  color: string;    // Warna aksen unik per tipe gerbang (hex)
};

/**
 * Warna dan emoji per tipe gate — digunakan secara konsisten di seluruh UI.
 * Semua gate dalam satu tipe berbagi warna yang sama untuk kemudahan identifikasi visual.
 */
const GATE_TYPE_STYLE: Record<string, { emoji: string; color: string }> = {
  regular: { emoji: '🔵', color: '#3b82f6' },
  silver:  { emoji: '⚪', color: '#94a3b8' },
  gold:    { emoji: '🟡', color: '#f59e0b' },
  vip:     { emoji: '🔴', color: '#ef4444' },
};

/**
 * Daftar 12 gerbang fisik: 4 tipe × 3 huruf (A, B, C) per tipe.
 * Gate ID ini dimasukkan ke dalam payload QR dan digunakan saat HMAC derivation.
 * Harus konsisten dengan DEFAULT_GATES di backend/main.py.
 */
export const GATES: Gate[] = [
  // ── Regular (biru) ─────────────────────────────────────────────
  { id: 'regular_a', name: 'Regular A', gateType: 'regular', letter: 'A', ...GATE_TYPE_STYLE.regular },
  { id: 'regular_b', name: 'Regular B', gateType: 'regular', letter: 'B', ...GATE_TYPE_STYLE.regular },
  { id: 'regular_c', name: 'Regular C', gateType: 'regular', letter: 'C', ...GATE_TYPE_STYLE.regular },
  // ── Silver (abu-abu) ───────────────────────────────────────────
  { id: 'silver_a',  name: 'Silver A',  gateType: 'silver',  letter: 'A', ...GATE_TYPE_STYLE.silver },
  { id: 'silver_b',  name: 'Silver B',  gateType: 'silver',  letter: 'B', ...GATE_TYPE_STYLE.silver },
  { id: 'silver_c',  name: 'Silver C',  gateType: 'silver',  letter: 'C', ...GATE_TYPE_STYLE.silver },
  // ── Gold (kuning) ──────────────────────────────────────────────
  { id: 'gold_a',    name: 'Gold A',    gateType: 'gold',    letter: 'A', ...GATE_TYPE_STYLE.gold },
  { id: 'gold_b',    name: 'Gold B',    gateType: 'gold',    letter: 'B', ...GATE_TYPE_STYLE.gold },
  { id: 'gold_c',    name: 'Gold C',    gateType: 'gold',    letter: 'C', ...GATE_TYPE_STYLE.gold },
  // ── VIP (merah) ────────────────────────────────────────────────
  { id: 'vip_a',     name: 'VIP A',     gateType: 'vip',     letter: 'A', ...GATE_TYPE_STYLE.vip },
  { id: 'vip_b',     name: 'VIP B',     gateType: 'vip',     letter: 'B', ...GATE_TYPE_STYLE.vip },
  { id: 'vip_c',     name: 'VIP C',     gateType: 'vip',     letter: 'C', ...GATE_TYPE_STYLE.vip },
];

/** Lookup map gate_id → Gate untuk akses O(1) saat parsing payload */
export const GATE_MAP: Record<string, Gate> = Object.fromEntries(
  GATES.map(g => [g.id, g]),
);

/**
 * Filter GATES berdasarkan tipe tiket penonton.
 * Digunakan di MyTicketScreen agar dropdown BLE hanya menampilkan
 * gate yang sesuai dengan tipe tiket yang dibeli.
 *
 * Contoh: filterGatesByTicketType('regular') → [regular_a, regular_b, regular_c]
 *
 * @param ticketType - Tipe tiket yang dimiliki penonton
 * @returns Array gate yang relevan (3 gate per tipe)
 */
export const filterGatesByTicketType = (ticketType: TicketType): Gate[] =>
  GATES.filter(g => g.gateType === ticketType);

// ─────────────────────────────────────────────────────────────────────────────
// Konstanta BLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prefix yang di-embed dalam manufacturer data BLE beacon.
 * Beacon dari HP admin akan memancarkan: "GATE:regular_a" (misalnya).
 * HP pengguna mencari prefix ini untuk mengidentifikasi beacon milik sistem kita.
 */
export const BLE_GATE_PREFIX = 'GATE:';

/**
 * Service UUID BLE — identifier unik aplikasi ini di jaringan BLE.
 * Sama dengan yang didefinisikan di BleGateBroadcasterModule.kt (sisi Android native).
 */
export const GATE_SERVICE_UUID = '12345678-1234-1234-1234-1234567890AB';

// ─────────────────────────────────────────────────────────────────────────────
// [KRITIS] Fungsi Derivasi Kunci Gate — Gate-Bound Secret
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menurunkan gate_secret dari ticket_secret dan gate_id menggunakan HMAC-SHA256.
 *
 * Formula: gate_secret = HMAC-SHA256(key=ticket_secret, msg=gate_id)
 *
 * Mengapa ini penting untuk keamanan:
 * 1. Setiap kombinasi (tiket × gerbang) menghasilkan secret yang unik
 * 2. Tidak dapat di-reverse: mengetahui gate_secret tidak mengungkap ticket_secret
 * 3. Seorang penyerang yang berhasil mendapatkan QR di regular_a tidak dapat
 *    menggunakannya di vip_a karena TOTP-nya berbeda secara kriptografis
 *
 * @param ticketSecretHex - ticket_secret dalam format hex (32 bytes = 64 karakter hex)
 * @param gateId - ID gerbang (contoh: "regular_a")
 * @returns gate_secret dalam format hex (32 bytes = 64 karakter hex)
 */
export const deriveGateSecret = (
  ticketSecretHex: string,
  gateId: string,
): string => {
  // Konversi hex string ke bytes untuk operasi HMAC
  const keyBytes = new Uint8Array(Buffer.from(ticketSecretHex, 'hex'));
  const msgBytes = new Uint8Array(Buffer.from(gateId, 'utf-8'));

  // Hitung HMAC-SHA256: ticket_secret sebagai key, gate_id sebagai message
  const result = hmac(sha256, keyBytes, msgBytes);

  // Kembalikan hasil sebagai hex string
  return Buffer.from(result).toString('hex');
};

// ─────────────────────────────────────────────────────────────────────────────
// Fungsi Parse BLE Manufacturer Data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mengekstrak gate_id dari raw manufacturer data BLE beacon.
 *
 * Format data yang dikirim beacon: "GATE:{gate_id}" (ASCII, di-encode ke bytes)
 * Format yang diterima library BLE: Base64 string dari bytes tersebut
 *
 * @param manufacturerDataBase64 - Data mentah dari react-native-ble-plx (Base64)
 * @returns gate_id string (misal: "regular_a") atau null jika bukan beacon kita
 */
export const parseGateIdFromManufacturerData = (
  manufacturerDataBase64: string,
): string | null => {
  try {
    // Decode Base64 → string ASCII
    const decoded = Buffer.from(manufacturerDataBase64, 'base64').toString('utf-8');

    // Cek apakah string mengandung prefix "GATE:" - identitas beacon kita (bisa didahului 2 byte Company ID)
    const prefixIndex = decoded.indexOf(BLE_GATE_PREFIX);
    if (prefixIndex !== -1) {
      return decoded.slice(prefixIndex + BLE_GATE_PREFIX.length).trim(); // Ambil bagian setelah "GATE:"
    }
    return null; // Bukan beacon dari sistem kita
  } catch {
    return null; // Data rusak / tidak bisa di-decode
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [KRITIS] Format Payload QR — 5 Komponen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Membentuk string payload QR lengkap dengan format 5 bagian.
 *
 * Format: ticket_id:event_id:gate_id:otp:signature
 *
 * Penjelasan tiap komponen:
 * - ticket_id   → identitas tiket untuk lookup di offline DB scanner
 * - event_id    → verifikasi tiket benar untuk event yang dimaksud
 * - gate_id     → gerbang mana yang di-bound oleh TOTP ini (gate-bound enforcement)
 * - otp         → 6-digit TOTP berbasis gate_secret (membuktikan proximity + freshness)
 * - signature   → tanda tangan ECDSA (membuktikan tiket diterbitkan server resmi)
 */
export const formatQrPayload = (
  ticketId: number,
  eventId: number,
  gateId: string,
  otp: string,
  signature: string,
): string => `${ticketId}:${eventId}:${gateId}:${otp}:${signature}`;

/**
 * Tipe hasil parse payload QR — semua komponen sebagai string
 * (termasuk ticketId/eventId agar mudah dibandingkan dengan payload string)
 */
export type ParsedQrPayload = {
  ticketId: string;
  eventId: string;
  gateId: string;   // Gerbang yang diklaim QR ini
  otp: string;      // Kode TOTP yang perlu divalidasi oleh scanner
  signature: string;// Tanda tangan ECDSA yang perlu diverifikasi
};

/**
 * Mem-parse string payload QR menjadi komponen-komponennya.
 * Mengembalikan null jika format tidak valid (bukan 5 bagian).
 */
export const parseQrPayload = (raw: string): ParsedQrPayload | null => {
  const parts = raw.split(':');
  // Validasi: harus tepat 5 bagian
  // Catatan: signature (Base64) tidak mengandung ':', jadi split aman
  if (parts.length !== 5) return null;
  const [ticketId, eventId, gateId, otp, signature] = parts;
  return { ticketId, eventId, gateId, otp, signature };
};
