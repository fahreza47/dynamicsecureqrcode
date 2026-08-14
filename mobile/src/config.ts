/**
 * config.ts — Konfigurasi Terpusat Aplikasi
 *
 * Semua konstanta global disimpan di sini agar mudah diubah
 * tanpa harus mencari ke banyak file.
 */

// Alamat IP server backend FastAPI — ganti jika IP jaringan berubah
export const BASE_URL = 'http://10.21.107.93:8000';

// Key penyimpanan sesi pengguna di AsyncStorage (login state)
export const SESSION_KEY = 'user_session';

/**
 * Key penyimpanan tiket per pengguna — WAJIB menyertakan userId agar
 * tiket tidak bocor ke akun penonton lain yang login di perangkat yang sama.
 * Contoh: user id=3 → 'user_tickets_3'
 */
export const getTicketsKey = (userId: number | string) => `user_tickets_${userId}`;
