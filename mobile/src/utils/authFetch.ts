/**
 * authFetch.ts — Utility untuk mengirim request dengan JWT token
 *
 * Semua request ke endpoint yang membutuhkan autentikasi harus menggunakan
 * fungsi authFetch() ini sebagai pengganti fetch() biasa.
 *
 * Cara kerja:
 * 1. Ambil JWT token dari AsyncStorage
 * 2. Sisipkan ke header Authorization: Bearer <token>
 * 3. Lakukan fetch seperti biasa
 *
 * Jika token tidak ada (belum login), request tetap dikirim tanpa header auth
 * (backend akan menolak dengan 401).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {AUTH_TOKEN_KEY} from '../config';

/**
 * Wrapper fetch yang otomatis menyertakan JWT token di header Authorization.
 * Gunakan ini untuk semua request ke endpoint yang membutuhkan autentikasi.
 */
export const authFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
