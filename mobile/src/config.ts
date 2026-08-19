/**
 * config.ts — Konfigurasi Terpusat Aplikasi
 *
 * Semua konstanta global disimpan di sini agar mudah diubah
 * tanpa harus mencari ke banyak file.
 */

// Alamat IP server backend FastAPI — ganti jika IP jaringan berubah
export const BASE_URL = 'https://dynamicsecureqrcode-production.up.railway.app/';

// Key penyimpanan sesi pengguna di AsyncStorage (login state)
export const SESSION_KEY = 'user_session';

// Key penyimpanan JWT access token di AsyncStorage
// Token ini dikirim di header Authorization pada setiap request ke backend
export const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Key penyimpanan tiket per pengguna — WAJIB menyertakan userId agar
 * tiket tidak bocor ke akun penonton lain yang login di perangkat yang sama.
 * Contoh: user id=3 → 'user_tickets_3'
 */
export const getTicketsKey = (userId: number | string) => `user_tickets_${userId}`;
