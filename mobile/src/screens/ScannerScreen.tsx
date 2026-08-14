/**
 * ScannerScreen.tsx — Layar Scanner QR (SISI ADMIN/PENYELENGGARA)
 *
 * Ini adalah layar utama bagi admin — memiliki dua peran:
 * 1. BROADCASTER: Memancarkan sinyal BLE yang berisi gate_id via BleGateBroadcaster native module
 * 2. VALIDATOR: Memverifikasi tiket dengan 3 lapis keamanan:
 *    - LAPIS 1: Keaslian ECDSA (membuktikan tiket dari server resmi)
 *    - LAPIS 2: Gate-Bound TOTP (membuktikan QR segar dan dari gerbang yang benar)
 *    - LAPIS 3: Anti-Double Spending (mencegah tiket digunakan lebih dari sekali)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  NativeModules,
  NativeEventEmitter,
  NativeModule,
  Platform,
  PermissionsAndroid,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as OTPAuth from 'otpauth';           // Library TOTP RFC 6238
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera'; // Pustaka kamera riil
import { Buffer } from 'buffer';
import { p256 } from '@noble/curves/nist.js';    // ECDSA P-256 dari @noble/curves
// sha256 tidak lagi di-import: p256.verify() melakukan hashing secara internal
import { BASE_URL, SESSION_KEY } from '../config';
import { styles } from './ScannerScreen.styles';
import AppHeader from '../components/AppHeader';
import {
  GATES,
  GATE_MAP,
  Gate,
  deriveGateSecret,  // [KRITIS] HMAC KDF: ticket_secret → gate_secret
  parseQrPayload,    // [KRITIS] Parse 5 komponen payload QR
} from '../utils/bleGate';
import Snackbar from '../components/Snackbar';


// ─────────────────────────────────────────────────────────────────────────────
// POLYFILLS — diperlukan untuk @noble/curves di React Native
// ─────────────────────────────────────────────────────────────────────────────
(global as any).Buffer = Buffer;
const TextEncoding = require('text-encoding');
(global as any).TextEncoder = TextEncoding.TextEncoder;
(global as any).TextDecoder = TextEncoding.TextDecoder;

// ─────────────────────────────────────────────────────────────────────────────
// [KRITIS] BleGateBroadcaster — Native Module (Android Kotlin)
//
// Ini adalah jembatan ke kode Kotlin yang menggunakan Android BLE Advertiser API
// untuk memancarkan sinyal beacon yang berisi gate_id.
// Penonton (MyTicketScreen) men-scan sinyal ini untuk mengetahui gerbang mana
// mereka berada, sebelum QR bisa di-generate.
// ─────────────────────────────────────────────────────────────────────────────
const BleGateBroadcaster = NativeModules.BleGateBroadcaster as {
  startBroadcast: (gateId: string) => Promise<string>; // Mulai pancarkan beacon untuk gate_id ini
  stopBroadcast: () => Promise<string>;                 // Hentikan pancaran beacon
  isSupported: () => Promise<boolean>;                  // Cek apakah hardware mendukung BLE advertising (butuh BT aktif)
  isBluetoothEnabled: () => Promise<boolean>;           // Cek apakah Bluetooth sedang aktif/dihidupkan
};

// ─────────────────────────────────────────────────────────────────────────────
// AsyncStorage Keys (sisi admin)
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_PUBLIC_KEY_STORAGE = 'admin_public_key';   // ECDSA public key server untuk verifikasi
const OFFLINE_DB_STORAGE = 'admin_offline_ticket_db';   // Database lokal: ticket_id → {secret, eventId}
const SYNC_QUEUE_KEY = 'offline_sync_queue';             // Antrian scan results menunggu dikirim ke server

// Struktur satu entri dalam offline DB — mencakup ticketType untuk validasi gate
type OfflineTicket = { secret: string; eventId: string; ticketType?: string };

// ─────────────────────────────────────────────────────────────────────────────
// [KRITIS] Fungsi Anti-Double Spending
//
// Menggunakan AsyncStorage sebagai "used ticket registry" lokal.
// Setelah tiket di-scan dan valid, ID-nya ditandai 'true' agar tidak bisa dipakai lagi.
// ─────────────────────────────────────────────────────────────────────────────
const isTicketUsed = async (ticketId: string): Promise<boolean> => {
  const val = await AsyncStorage.getItem(`used_ticket_${ticketId}`);
  return val === 'true';
};
const markTicketAsUsed = async (ticketId: string): Promise<void> => {
  await AsyncStorage.setItem(`used_ticket_${ticketId}`, 'true');
};

// ─────────────────────────────────────────────────────────────────────────────
// [KRITIS] LAPIS 1 — Verifikasi Keaslian ECDSA P-256
//
// Membuktikan bahwa tiket diterbitkan oleh server resmi yang memiliki private key.
// Pesan yang ditandatangani: "ticket_id:event_id"
// Tanda tangan dibuat server saat /buy_ticket, dikirim ke client, dan disimpan di storage.
//
// PENTING: p256.verify() secara default melakukan SHA-256 hashing secara internal
// (prehash: true). Jangan hash manual sebelum memanggil verify() karena akan
// menyebabkan DOUBLE HASHING → signature selalu ditolak!
// ─────────────────────────────────────────────────────────────────────────────
const verifyEcdsaSignature = (
  ticketId: string,
  eventId: string,
  signatureB64: string,  // Tanda tangan ECDSA dalam format Base64 (dari payload QR)
  publicKeyHex: string,  // Public key server dalam format hex (dari sinkronisasi backend)
): boolean => {
  try {
    const message = `${ticketId}:${eventId}`;            // Rekonstruksi pesan yang ditandatangani
    const msgBytes = new Uint8Array(Buffer.from(message, 'utf-8')); // Pesan mentah (JANGAN di-hash manual!)
    const sigBytes = new Uint8Array(Buffer.from(signatureB64, 'base64'));
    const pubKeyBytes = new Uint8Array(Buffer.from(publicKeyHex, 'hex'));
    // [KRITIS] Berikan pesan mentah (msgBytes), bukan hash-nya.
    // p256.verify() akan melakukan SHA-256 satu kali secara internal.
    // lowS: false → karena Python ecdsa tidak memaksakan normalisasi low-S.
    return p256.verify(sigBytes, msgBytes, pubKeyBytes, { lowS: false });
  } catch {
    return false; // Jika format tidak valid, anggap palsu
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// [KRITIS] LAPIS 2 — Gate-Bound TOTP Validation
//
// Ini adalah inti inovasi sistem: TOTP yang terikat pada gerbang tertentu.
// Algoritma:
//   gate_secret = HMAC-SHA256(ticket_secret, scanner_gate_id)
//   valid       = TOTP(gate_secret, waktu) == otp_dari_qr
//
// Mengapa gate-bound?
// - QR penonton di-generate menggunakan gate_secret dari gate YANG SAMA
// - Jika penyerang mencoba pakai QR di gerbang berbeda, gate_secret berbeda → OTP salah
// - Ini mencegah "cross-gate fraud": tiket yang bocor tidak bisa dipakai di gerbang lain
// ─────────────────────────────────────────────────────────────────────────────
const validateGateBoundTotp = (
  totpCode: string,
  ticketHexSecret: string,  // ticket_secret dari offline DB
  scannerGateId: string,    // ID gerbang tempat scanner ini berdiri
): boolean => {
  try {
    // Turunkan gate_secret untuk gerbang scanner ini
    const gateSecretHex = deriveGateSecret(ticketHexSecret, scannerGateId);
    const secretBytes = new Uint8Array(Buffer.from(gateSecretHex, 'hex'));

    const validator = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ buffer: secretBytes.buffer }),
    });
    // window:1 → toleransi ±1 periode (±30 detik) untuk clock skew antar perangkat
    return validator.validate({ token: totpCode, window: 1 }) !== null;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Permintaan izin BLE runtime (Android)
// Admin perlu BLUETOOTH_ADVERTISE (Android 12+) untuk memancarkan beacon
// ─────────────────────────────────────────────────────────────────────────────
const requestBlePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    if (Platform.Version >= 31) {
      // Android 12+: Izin ADVERTISE wajib untuk BLE broadcasting
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE, // Kunci untuk broadcasting
      ]);
      return Object.values(result).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED,
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Komponen Utama: ScannerScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function ScannerScreen({ navigation }: any) {
  const route = useRoute<any>();
  const eventId = route.params?.eventId;
  const eventName = route.params?.eventName || 'Semua Acara';
  const eventLocation = route.params?.eventLocation;

  // ── State BLE Broadcast (Admin memancarkan gate_id ke udara) ──────────────
  const [selectedGate, setSelectedGate] = useState<Gate>(GATES[0]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [bleSupported, setBleSupported] = useState<boolean | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  // State izin runtime BLE — null=belum diminta, true=granted, false=ditolak
  const [blePermissionGranted, setBlePermissionGranted] = useState<boolean | null>(null);
  // State bluetooth on/off — null=belum dicek, true=hidup, false=mati
  const [isBluetoothOn, setIsBluetoothOn] = useState<boolean | null>(null);
  // State hardware: apakah perangkat mendukung BLE advertising secara fundamental
  const [bleHardwareSupported, setBleHardwareSupported] = useState<boolean | null>(null);

  // ── State Gate Picker 2-Level (tipe → huruf) ──────────────────────────────
  const [selectedGateType, setSelectedGateType] = useState<string>('regular');

  // ── State UI Modal & Snackbar ─────────────────────────────────────────────
  const [showGateModal, setShowGateModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('success');

  const showSnackbar = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // ── State Scanner Kamera Riil ─────────────────────────────────────────────
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanningLocked, setIsScanningLocked] = useState(false); // Mengunci scan sesaat setelah QR terdeteksi
  const device = useCameraDevice('back'); // Gunakan kamera belakang


  // ── State Database & Validasi ──────────────────────────────────────────────
  const [publicKey, setPublicKey] = useState<string | null>(null);         // ECDSA public key server
  const [offlineDb, setOfflineDb] = useState<Record<string, OfflineTicket>>({}); // DB lokal tiket
  const [scanFeedback, setScanFeedback] = useState<{
    status: 'success' | 'error';
    message: string;
    detail?: string;
  } | null>(null); // Hasil validasi QR terakhir

  // State baru untuk hitung local vs server active ticket counts & auto-sync
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(5);     // Auto sync interval (menit), default 5
  const [localActiveCount, setLocalActiveCount] = useState<number | null>(null);
  const [serverActiveCount, setServerActiveCount] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  // State tambahan: jumlah tiket sudah dipindai dan total tiket
  const [scannedCount, setScannedCount] = useState<number>(0);
  // State Offline Sync Queue: jumlah scan yang menunggu dikirim ke server
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [totalTicketCount, setTotalTicketCount] = useState<number>(0);

  // [FIX] Gunakan useFocusEffect agar setiap kali screen mendapat fokus,
  // izin kamera dan BLE dicek ulang. Ini mengatasi masalah fresh install
  // dimana state sudah terlanjur dirender sebelum izin di-grant.
  useFocusEffect(
    useCallback(() => {
      // Re-check izin kamera setiap kali screen aktif
      Camera.requestCameraPermission()
        .then((status: string) => {
          setHasCameraPermission(status === 'granted');
        })
        .catch(() => {
          setHasCameraPermission(false);
        });

      // Re-check status BLE (izin + bluetooth on/off) setiap kali screen aktif
      const recheckBle = async () => {
        const granted = await requestBlePermissions();
        setBlePermissionGranted(granted);
        if (granted && BleGateBroadcaster) {
          const btOn = await BleGateBroadcaster.isBluetoothEnabled().catch(() => false);
          setIsBluetoothOn(btOn);
          if (btOn) {
            const supported = await BleGateBroadcaster.isSupported().catch(() => false);
            setBleSupported(supported);
            setBleHardwareSupported(supported);
            setBleError(supported ? null : 'Perangkat tidak mendukung BLE advertising.');
          } else {
            setBleSupported(false);
            setBleError('Bluetooth mati. Nyalakan Bluetooth, lalu tekan "Mulai".');
          }
        }
      };
      recheckBle();
    }, []),
  );

  // ── Setup awal: minta izin BLE runtime, cek dukungan hardware, muat data ──
  useEffect(() => {
    /**
     * [KRITIS — FIX BLE] Minta izin BLE runtime TERLEBIH DAHULU sebelum memanggil
     * isSupported(). Pada Android 12+, adapter.bluetoothLeAdvertiser akan selalu
     * null jika BLUETOOTH_CONNECT & BLUETOOTH_ADVERTISE belum diberikan, sehingga
     * isSupported() akan salah-return false dan tombol Mulai akan ter-disable.
     *
     * Urutan yang benar:
     *   1. requestBlePermissions() → dialog muncul ke user
     *   2. Jika granted → panggil isSupported() untuk cek hardware capability
     */
    const initBle = async () => {
      // LANGKAH 1: Minta izin runtime BLE (wajib Android 12+)
      const granted = await requestBlePermissions();
      setBlePermissionGranted(granted);

      if (!granted) {
        setBleSupported(false);
        setBleError('Izin Bluetooth belum diberikan. Aktifkan di Pengaturan > Aplikasi.');
        return;
      }

      if (!BleGateBroadcaster) {
        setBleSupported(false);
        setBleHardwareSupported(false);
        setBleError('Modul BLE native tidak ditemukan. Rebuild aplikasi diperlukan.');
        return;
      }

      // LANGKAH 2: Cek apakah Bluetooth sedang aktif/dihidupkan
      // Pisahkan dari isSupported() agar bisa membedakan:
      //   BT mati → tampilkan "Hidupkan Bluetooth"
      //   Hardware tidak support → tampilkan "Perangkat tidak mendukung"
      const btOn = await BleGateBroadcaster.isBluetoothEnabled().catch(() => false);
      setIsBluetoothOn(btOn);

      if (!btOn) {
        // Bluetooth mati — perangkat mungkin sebenarnya support, tapi BT perlu dinyalakan
        setBleSupported(false);
        setBleError('Bluetooth mati. Nyalakan Bluetooth, lalu tekan "Mulai".');
        return;
      }

      // LANGKAH 3: BT aktif — cek apakah hardware mendukung BLE advertising
      try {
        const supported = await BleGateBroadcaster.isSupported();
        setBleSupported(supported);
        setBleHardwareSupported(supported);
        if (!supported) {
          setBleError('Perangkat tidak mendukung BLE advertising. Gunakan mode simulasi.');
        } else {
          setBleError(null); // Siap digunakan
        }
      } catch {
        setBleSupported(false);
        setBleHardwareSupported(false);
      }
    };

    initBle();

    // Muat data yang sudah di-cache dari sinkronisasi sebelumnya (offline-first)
    const loadCachedData = async () => {
      const cachedKey = await AsyncStorage.getItem(ADMIN_PUBLIC_KEY_STORAGE);
      if (cachedKey) setPublicKey(cachedKey);
      const cachedDb = await AsyncStorage.getItem(OFFLINE_DB_STORAGE);
      if (cachedDb) {
        const parsedDb = JSON.parse(cachedDb);
        setOfflineDb(parsedDb);
        await calculateTicketCounts(parsedDb);
      }
      // Muat jumlah antrian offline sync yang belum terkirim
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueStr) {
        const queue = JSON.parse(queueStr);
        setPendingSyncCount(Array.isArray(queue) ? queue.length : 0);
      }
    };
    loadCachedData();

    // Dengarkan event status dari native BleGateBroadcaster module
    // Event dikirim lewat RCTDeviceEventEmitter dari Kotlin
    let emitter: NativeEventEmitter | null = null;
    if (BleGateBroadcaster) {
      emitter = new NativeEventEmitter(NativeModules.BleGateBroadcaster as NativeModule);
      const sub = emitter.addListener('BleGateBroadcasterStatus', (status: string) => {
        if (status.startsWith('broadcasting:')) {
          setIsBroadcasting(true);
          setBleError(null);
        } else if (status === 'stopped') {
          setIsBroadcasting(false);
        } else if (status.startsWith('error:')) {
          setBleError(status.slice(6)); // Ekstrak pesan error dari "error:{pesan}"
          setIsBroadcasting(false);
        }
      });
      return () => sub.remove(); // Cleanup listener saat unmount
    }
  }, []);

  // Effect untuk interval auto-sync berkala
  useEffect(() => {
    if (autoSyncInterval <= 0) return;
    const intervalId = setInterval(() => {
      syncFromBackend(true); // Sync silent (tidak memicu Toast/Snackbar sukses)
    }, autoSyncInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [autoSyncInterval, offlineDb]);

  // Hentikan broadcast otomatis saat admin mengganti pilihan gerbang
  // agar beacon selalu memancarkan gate_id yang sesuai pilihan saat ini
  useEffect(() => {
    if (isBroadcasting) {
      handleToggleBroadcast(); // stop dulu, lalu biarkan admin mulai lagi manual
    }
  }, [selectedGate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Setup Code Scanner dari react-native-vision-camera ──────────────────────
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: any[]) => {
      if (isScanningLocked) return;
      const value = codes[0]?.value;
      if (value) {
        setIsScanningLocked(true);
        handleBarCodeScanned(value, false);
        // Lepas kunci scanner setelah 3 detik agar admin bisa scan tiket berikutnya
        setTimeout(() => {
          setIsScanningLocked(false);
        }, 3000);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // [KRITIS] Toggle BLE Broadcast
  //
  // Memanggil native BleGateBroadcaster.startBroadcast(gate_id) yang akan
  // memancarkan sinyal BLE berisi gate_id ke udara. Sinyal ini akan
  // dideteksi oleh HP penonton (MyTicketScreen) untuk menentukan gerbang.
  // ─────────────────────────────────────────────────────────────────────────
  const handleToggleBroadcast = useCallback(async () => {
    // Pastikan izin BLE sudah diberikan sebelum mencoba broadcast
    if (!blePermissionGranted) {
      const granted = await requestBlePermissions();
      setBlePermissionGranted(granted);
      if (!granted) {
        setBleError('Izin Bluetooth ditolak. Aktifkan di Pengaturan > Aplikasi > Izin.');
        showSnackbar('Izin Bluetooth diperlukan untuk memancarkan beacon.', 'error');
        return;
      }
    }

    // Cek ulang status Bluetooth (mungkin user mematikannya setelah screen dibuka)
    if (BleGateBroadcaster) {
      const btOn = await BleGateBroadcaster.isBluetoothEnabled().catch(() => false);
      setIsBluetoothOn(btOn);
      if (!btOn) {
        setBleError('Bluetooth mati. Hidupkan Bluetooth terlebih dahulu.');
        showSnackbar('Hidupkan Bluetooth terlebih dahulu.', 'error');
        return;
      }
      // Jika BT baru saja dihidupkan, re-check hardware support
      if (bleHardwareSupported === null || (isBluetoothOn === false && btOn)) {
        const supported = await BleGateBroadcaster.isSupported().catch(() => false);
        setBleSupported(supported);
        setBleHardwareSupported(supported);
        if (!supported) {
          setBleError('Perangkat tidak mendukung BLE advertising.');
          showSnackbar('Perangkat tidak mendukung BLE advertising.', 'error');
          return;
        }
      }
    }

    if (isBroadcasting) {
      try {
        await BleGateBroadcaster.stopBroadcast();
        setIsBroadcasting(false);
        setBleError(null);
      } catch (e: any) {
        setBleError(`Gagal menghentikan: ${e.message}`);
      }
    } else {
      try {
        setBleError(null);
        await BleGateBroadcaster.startBroadcast(selectedGate.id);
      } catch (e: any) {
        const rawMsg: string = e.message || '';
        let friendlyMsg = 'Gagal memulai beacon.';
        if (rawMsg.includes('BT_DISABLED') || rawMsg.includes('Bluetooth tidak aktif')) {
          friendlyMsg = 'Bluetooth mati. Hidupkan Bluetooth, lalu coba lagi.';
          setIsBluetoothOn(false);
        } else if (rawMsg.includes('ADVERTISE_FAILED_ALREADY_STARTED') || rawMsg.includes('Already started')) {
          friendlyMsg = 'Beacon sudah aktif.';
          setIsBroadcasting(true);
        } else if (rawMsg.includes('Feature unsupported') || rawMsg.includes('FEATURE_UNSUPPORTED') || rawMsg.includes('BT_LE_UNSUPPORTED')) {
          friendlyMsg = 'Perangkat tidak mendukung BLE advertising.';
          setBleSupported(false);
          setBleHardwareSupported(false);
        } else if (rawMsg.includes('Too many advertisers') || rawMsg.includes('TOO_MANY_ADVERTISERS')) {
          friendlyMsg = 'Terlalu banyak aplikasi menggunakan BLE. Tutup aplikasi lain, lalu coba lagi.';
        } else if (rawMsg.includes('DATA_TOO_LARGE')) {
          friendlyMsg = 'Data beacon terlalu besar. Hubungi developer.';
        } else if (rawMsg.includes('PERMISSION') || rawMsg.includes('SecurityException')) {
          friendlyMsg = 'Izin Bluetooth dicabut. Buka Pengaturan > Aplikasi untuk mengaktifkan kembali.';
          setBlePermissionGranted(false);
        } else if (rawMsg) {
          friendlyMsg = `Error BLE: ${rawMsg}`;
        }
        setBleError(friendlyMsg);
        showSnackbar(friendlyMsg, 'error');
      }
    }
  }, [isBroadcasting, selectedGate, blePermissionGranted, bleHardwareSupported, isBluetoothOn]);

  // ─────────────────────────────────────────────────────────────────────────
  // [KRITIS] Sinkronisasi Data dari Backend
  //
  // Admin harus melakukan sinkronisasi saat online agar scanner bisa
  // beroperasi offline. Data yang di-sync:
  // 1. public_key: untuk verifikasi ECDSA (tidak berubah selama server berjalan)
  // 2. ticket secrets: ticket_secret setiap tiket untuk validasi Gate-Bound TOTP
  //
  // Setelah sinkronisasi, admin bisa memvalidasi tiket tanpa internet.
  // ─────────────────────────────────────────────────────────────────────────
  const calculateTicketCounts = async (db: Record<string, OfflineTicket>, serverTickets?: any[]) => {
    try {
      const eventTickets = Object.entries(db).filter(([_, data]) => {
        if (!eventId) return true;
        return Number(data.eventId) === Number(eventId);
      });

      const ticketIds = eventTickets.map(([id]) => `used_ticket_${id}`);
      const usedStates = await AsyncStorage.multiGet(ticketIds);
      const usedMap = new Map<string, boolean>();
      usedStates.forEach(([key, val]) => {
        usedMap.set(key, val === 'true');
      });

      let localActive = 0;
      let scanned = 0;
      eventTickets.forEach(([id]) => {
        const isUsed = usedMap.get(`used_ticket_${id}`);
        if (!isUsed) {
          localActive++;
        } else {
          scanned++;
        }
      });
      setLocalActiveCount(localActive);
      setScannedCount(scanned);
      setTotalTicketCount(eventTickets.length);

      if (serverTickets) {
        const serverActive = serverTickets.filter(t => {
          const matchesEvent = eventId ? Number(t.event_id) === Number(eventId) : true;
          return matchesEvent && !t.is_used;
        }).length;
        setServerActiveCount(serverActive);
      }
    } catch (err) {
      console.warn('Error calculating ticket counts', err);
    }
  };

  // ── Offline Sync Queue: Tambah item ke antrian lokal ──
  const addToSyncQueue = async (item: {
    ticket_id: number; event_id: number; gate_id: string;
    ticket_type: string; scanned_at: string;
  }) => {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: any[] = queueStr ? JSON.parse(queueStr) : [];
      queue.push(item);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      setPendingSyncCount(queue.length);
    } catch (err) {
      console.warn('Error adding to sync queue', err);
    }
  };

  // ── Offline Sync Queue: Kirim semua antrian ke server secara batch ──
  const flushSyncQueue = async (silent = false) => {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: any[] = queueStr ? JSON.parse(queueStr) : [];
      if (queue.length === 0) {
        setPendingSyncCount(0);
        return;
      }

      const res = await fetch(`${BASE_URL}/batch_sync_scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scans: queue }),
      });

      if (res.ok) {
        const data = await res.json();
        // Berhasil dikirim — kosongkan antrian
        await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
        setPendingSyncCount(0);
        if (!silent) {
          showSnackbar(`${data.synced} scan offline berhasil disinkronkan!`, 'success');
        }
      }
    } catch {
      // Masih offline — biarkan antrian tetap ada
      if (!silent) {
        showSnackbar('Server tidak terjangkau. Scan tersimpan di antrian lokal.', 'info');
      }
    }
  };

  const syncFromBackend = async (isSilent = false) => {
    try {
      // [LANGKAH 1] Kirim antrian offline ke server terlebih dahulu (push)
      await flushSyncQueue(true);

      // [LANGKAH 2] Tarik data terbaru dari server (pull)
      const [keyRes, ticketsRes] = await Promise.all([
        fetch(`${BASE_URL}/public_key`),
        fetch(`${BASE_URL}/admin/tickets`),
      ]);
      const keyData = await keyRes.json();
      const ticketsData: Array<{
        ticket_id: number;
        event_id: number;
        ticket_secret: string;
        ticket_type: string;
        is_used: boolean;
      }> = await ticketsRes.json();

      await AsyncStorage.setItem(ADMIN_PUBLIC_KEY_STORAGE, keyData.public_key);
      setPublicKey(keyData.public_key);

      const newDb: Record<string, OfflineTicket> = {};
      
      // Update local storage untuk tiket yang ditandai digunakan di server
      for (const t of ticketsData) {
        newDb[t.ticket_id.toString()] = {
          secret: t.ticket_secret,
          eventId: t.event_id.toString(),
          ticketType: t.ticket_type || 'regular',
        };
        if (t.is_used) {
          await AsyncStorage.setItem(`used_ticket_${t.ticket_id}`, 'true');
        }
      }

      await AsyncStorage.setItem(OFFLINE_DB_STORAGE, JSON.stringify(newDb));
      setOfflineDb(newDb);
      
      await calculateTicketCounts(newDb, ticketsData);
      setLastSyncTime(new Date());

      if (!isSilent) {
        showSnackbar(`Sinkronisasi Berhasil! ${ticketsData.length} tiket dimuat.`, 'success');
      }
    } catch {
      if (!isSilent) {
        showSnackbar('Gagal memuat data dari server. Pastikan laptop/server online.', 'error');
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // [KRITIS] Pipeline Validasi Tiket (3 LAPIS KEAMANAN)
  // ─────────────────────────────────────────────────────────────────────────
  const handleBarCodeScanned = async (data: string, skipEcdsa = false) => {
    // 0. Parse Payload QR (harus berisi 5 bagian: ticketId:eventId:gateId:OTP:signature)
    const parsed = parseQrPayload(data);
    if (!parsed) {
      setScanFeedback({
        status: 'error',
        message: '❌ Tiket Tidak Valid',
        detail: 'Format payload QR tidak sesuai standar sistem keamanan.',
      });
      return;
    }

    const { ticketId, eventId: ticketEventId, gateId, otp, signature } = parsed;

    // ── PENGENCANGAN KEAMANAN: Batasan Acara Aktif ─────────────────────────
    // Jika scanner dibuka dari event khusus di Dashboard, tolak tiket event lain.
    if (eventId && Number(ticketEventId) !== Number(eventId)) {
      setScanFeedback({
        status: 'error',
        message: '❌ Tiket Salah Acara!',
        detail: `Tiket ini untuk event #${ticketEventId}, sedangkan gerbang memindai event: ${eventName}`,
      });
      return;
    }

    // ── VALIDASI JENDELA WAKTU ──────────────────────────────────────────────
    // Cek ke backend apakah sekarang sudah masuk jendela scan (1 jam sebelum acara).
    // Tolak tiket jika terlalu awal (belum waktunya) atau sudah kedaluwarsa.
    const scanEventId = eventId || ticketEventId;
    if (scanEventId) {
      try {
        const windowRes = await fetch(`${BASE_URL}/events/${Number(scanEventId)}/scan_window`);
        if (windowRes.ok) {
          const windowData = await windowRes.json();
          if (!windowData.can_scan) {
            setScanFeedback({
              status: 'error',
              message: '⏰ Pemindaian Tidak Dapat Dilakukan',
              detail: windowData.reason,
            });
            return;
          }
        }
        // Jika endpoint tidak bisa dijangkau (offline), lanjutkan scan tanpa cek waktu
      } catch {
        // Backend offline — lanjutkan, biarkan admin memutuskan
      }
    }

    // ── LAPIS 1: Keaslian Tiket (ECDSA Digital Signature) ──────────────────
    if (!skipEcdsa) {
      if (!publicKey) {
        setScanFeedback({
          status: 'error',
          message: '❌ Gagal Verifikasi',
          detail: 'Public key server belum di-sync. Hubungkan ke internet lalu tekan Sinkronisasi.',
        });
        return;
      }

      const isSignatureValid = verifyEcdsaSignature(ticketId, ticketEventId, signature, publicKey);
      if (!isSignatureValid) {
        setScanFeedback({
          status: 'error',
          message: '❌ Tanda Tangan Palsu!',
          detail: 'Digital signature tidak valid. Tiket dicurigai hasil manipulasi hacker.',
        });
        return;
      }
    }

    // Cocokkan ticketId dengan basis data offline
    const localTicket = offlineDb[ticketId];
    if (!localTicket) {
      setScanFeedback({
        status: 'error',
        message: '❌ Tiket Tidak Terdaftar',
        detail: `ID Tiket #${ticketId} tidak ditemukan dalam database offline.`,
      });
      return;
    }

    // ── LAPIS 2a: Validasi Tipe Tiket vs Tipe Gerbang ──────────────────────
    // [POIN 2] Pastikan tipe tiket penonton sesuai dengan tipe gerbang scanner.
    // Contoh penolakan: tiket "regular" di gerbang "vip_a" → DITOLAK di sini.
    // Ini adalah cross-type fraud detection — berbeda dari cross-gate (beda huruf A/B/C).
    const ticketTypeOfHolder = localTicket.ticketType || 'regular';
    if (ticketTypeOfHolder !== selectedGate.gateType) {
      setScanFeedback({
        status: 'error',
        message: `❌ Tipe Tiket Tidak Sesuai Gerbang!`,
        detail: `Tiket ini tipe "${ticketTypeOfHolder.toUpperCase()}" — tidak dapat masuk gerbang ${selectedGate.name} (${selectedGate.gateType.toUpperCase()}). Silakan ke gerbang ${ticketTypeOfHolder.toUpperCase()}.`,
      });
      return;
    }

    // ── LAPIS 2b: Proximity & Freshness (Gate-Bound TOTP) ──────────────────
    // Validasi TOTP menggunakan ticket_secret tiket ini dan gate_id scanner ini.
    // Gate tipe sudah cocok (lolos 2a), sekarang cek apakah huruf gerbang dan OTP valid.
    const isTotpValid = validateGateBoundTotp(otp, localTicket.secret, selectedGate.id);
    if (!isTotpValid) {
      // Analisis kegagalan: salah huruf gerbang (cross-gate) atau QR sudah expired
      const isWrongGate = gateId !== selectedGate.id;
      setScanFeedback({
        status: 'error',
        message: isWrongGate ? '❌ Salah Gerbang (Cross-Gate)!' : '❌ Kode QR Kedaluwarsa!',
        detail: isWrongGate
          ? `Tiket di-generate untuk gerbang "${gateId}", discan di gerbang "${selectedGate.id}" (beda huruf, tipe sama).`
          : 'Masa berlaku QR (30 detik) telah habis atau jam perangkat tidak sinkron.',
      });
      return;
    }

    // ── LAPIS 3: Anti-Double Spending (Registry Lokal + Server Sync) ──────
    // Cek apakah tiket sudah pernah digunakan
    const alreadyUsed = await isTicketUsed(ticketId);
    if (alreadyUsed) {
      setScanFeedback({
        status: 'error',
        message: '❌ Tiket Sudah Digunakan!',
        detail: `Double spending terdeteksi. ID Tiket #${ticketId} sudah divalidasi sebelumnya.`,
      });
      return;
    }

    // Tiket Lolos Semua Uji Keamanan!
    await markTicketAsUsed(ticketId);
    await calculateTicketCounts(offlineDb);

    // [OFFLINE SYNC QUEUE] Simpan scan result ke antrian lokal,
    // lalu coba kirim langsung. Jika offline, data aman di antrian.
    const ticketTypeForLog = localTicket.ticketType || selectedGate.gateType || 'regular';
    const scanItem = {
      ticket_id: Number(ticketId),
      event_id: Number(ticketEventId || eventId),
      gate_id: selectedGate.id,
      ticket_type: ticketTypeForLog,
      scanned_at: new Date().toISOString(),
    };
    await addToSyncQueue(scanItem);
    // Coba flush langsung (akan berhasil jika online, gagal diam jika offline)
    await flushSyncQueue(true);

    setScanFeedback({
      status: 'success',
      message: '✅ Tiket Valid — Silakan Masuk!',
      detail: `${selectedGate.name} • Tiket #${ticketId} • ${ticketTypeForLog.toUpperCase()} • ${eventName}`,
    });
  };



  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Kustom dengan Tombol Kembali */}
      <AppHeader 
        title="Scanner Tiket" 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Info Event Aktif */}
        <View style={styles.eventBanner}>
          <Text style={styles.eventBannerLabel}>ACARA YANG DIPINDAI</Text>
          <Text style={styles.eventBannerTitle}>{eventName}</Text>
          {eventLocation ? (
            <View style={styles.eventBannerLocRow}>
              <Image source={require('../assets/flaticon/land-location.png')} style={styles.eventBannerLocIcon} />
              <Text style={styles.eventBannerLocText}>{eventLocation}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Status BLE Broadcaster — menampilkan apakah beacon sedang dipancarkan ── */}
        <View style={[styles.bleStatusBar, isBroadcasting ? styles.bleBarActive : styles.bleBarInactive]}>
          <View style={styles.bleBarLeft}>
            {/* Indikator titik hijau (aktif) atau abu-abu (non-aktif) */}
            <View style={[styles.bleDot, isBroadcasting ? styles.bleDotActive : styles.bleDotInactive]} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image 
                  source={require('../assets/flaticon/broadcast-tower.png')} 
                  style={{ width: 18, height: 18, tintColor: isBroadcasting ? '#22c55e' : '#94a3b8', marginRight: 6 }} 
                />
                <Text style={styles.bleBarTitle}>
                  {isBroadcasting
                    ? `Memancarkan "${selectedGate.name}"`
                    : 'Beacon Tidak Aktif'}
                </Text>
              </View>
              <Text style={styles.bleBarSubtitle}>
                {bleError
                  ? `Error: ${bleError}`
                  : isBroadcasting
                  ? `ID: ${selectedGate.id}` // Tampilkan gate_id yang sedang dipancarkan
                  : 'Tekan Mulai untuk memancarkan sinyal BLE'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.bleToggleBtn,
              isBroadcasting
                ? styles.bleToggleBtnStop
                : blePermissionGranted === false
                ? styles.bleToggleBtnPermission
                : styles.bleToggleBtnStart,
            ]}
            onPress={handleToggleBroadcast}
            disabled={bleSupported === false && blePermissionGranted !== false}
          >
            <Text style={styles.bleToggleBtnText}>
              {isBroadcasting
                ? 'Stop'
                : blePermissionGranted === false
                ? 'Izinkan'
                : 'Mulai'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Peringatan izin belum diberikan atau perangkat tidak mendukung BLE */}
        {blePermissionGranted === false && (
          <View style={[styles.bleUnsupportedBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 14, height: 14, tintColor: '#856404', marginRight: 6, marginTop: 2 }} />
              <Text style={[styles.bleUnsupportedText, { color: '#856404', flex: 1 }]}>
                Izin Bluetooth belum diberikan. Tekan tombol "Izinkan" untuk mengaktifkan beacon.
              </Text>
            </View>
          </View>
        )}
        {blePermissionGranted !== false && isBluetoothOn === false && (
          <View style={[styles.bleUnsupportedBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
            <Text style={[styles.bleUnsupportedText, { color: '#856404' }]}>
              📶 Bluetooth mati. Hidupkan Bluetooth, lalu tekan "Mulai" kembali.
            </Text>
          </View>
        )}
        {blePermissionGranted !== false && isBluetoothOn !== false && bleHardwareSupported === false && (
          <View style={styles.bleUnsupportedBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 14, height: 14, tintColor: '#dc2626', marginRight: 6, marginTop: 2 }} />
              <Text style={[styles.bleUnsupportedText, { flex: 1 }]}>
                Perangkat ini tidak mendukung BLE advertising. Gunakan mode simulasi.
              </Text>
            </View>
          </View>
        )}

        {/* ── Gate Selector Button (Modifikasi UI Modal) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GERBANG SCANNER INI</Text>
          <TouchableOpacity
            style={[styles.gateSelectorBtn, { borderColor: selectedGate.color }]}
            onPress={() => setShowGateModal(true)}
          >
            <View style={styles.gateSelectorBtnLeft}>
              <Text style={styles.gateSelectorBtnEmoji}>{selectedGate.emoji}</Text>
              <Text style={styles.gateSelectorBtnText}>
                Gerbang {selectedGate.name} <Text style={styles.gateSelectorBtnId}>({selectedGate.id})</Text>
              </Text>
            </View>
            <Text style={[styles.gateSelectorBtnAction, { color: '#007BFF' }]}>Pilih Gerbang ▼</Text>
          </TouchableOpacity>
        </View>

        {/* ── Area Kamera Riil menggunakan react-native-vision-camera ── */}
        <View style={styles.cameraContainer}>
          {hasCameraPermission === null ? (
            <View style={styles.cameraFallback}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.cameraFallbackText}>Meminta izin kamera...</Text>
            </View>
          ) : hasCameraPermission === false ? (
            <View style={styles.cameraFallback}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 14, height: 14, tintColor: '#ffffff', marginRight: 6 }} />
                <Text style={styles.cameraFallbackText}>Akses kamera tidak diizinkan.</Text>
              </View>
            </View>
          ) : device == null ? (
            <View style={styles.cameraFallback}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 14, height: 14, tintColor: '#ffffff', marginRight: 6 }} />
                <Text style={styles.cameraFallbackText}>Sensor kamera belakang tidak ditemukan.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                codeScanner={codeScanner}
              />
              {/* Overlay visual scanner (kotak target) */}
              <View style={styles.cameraOverlay}>
                <View style={[styles.cameraScanBox, { borderColor: selectedGate.color }]}>
                  {isScanningLocked && (
                    <View style={styles.scanLockOverlay}>
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={styles.cameraOverlayText}>
                  Sorot QR Code Tiket Penonton
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Tombol Sinkronisasi — wajib dilakukan saat online sebelum bertugas ── */}
        <TouchableOpacity style={styles.syncButton} onPress={() => syncFromBackend(false)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('../assets/flaticon/sync.png')} style={{ width: 18, height: 18, tintColor: '#ffffff', marginRight: 8 }} />
            <Text style={styles.syncButtonText}>Sinkronkan Data E-Ticket</Text>
          </View>
        </TouchableOpacity>
        {/* Sync Settings (Auto Sync Selector) */}
        <View style={styles.syncSettingsContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../assets/flaticon/sync.png')} style={{ width: 14, height: 14, tintColor: '#6c757d', marginRight: 6 }} />
            <Text style={styles.syncSettingsLabel}>Auto Sync berkala:</Text>
          </View>
          <View style={styles.syncPickerWrapper}>
            <Picker
              selectedValue={autoSyncInterval}
              onValueChange={(val: number) => setAutoSyncInterval(val)}
              style={[styles.syncPicker, { color: '#212529' }]}
              dropdownIconColor="#007BFF"
            >
              <Picker.Item label="Matikan" value={0} color="#212529" />
              <Picker.Item label="1 Menit" value={1} color="#212529" />
              <Picker.Item label="5 Menit" value={5} color="#212529" />
              <Picker.Item label="10 Menit" value={10} color="#212529" />
            </Picker>
          </View>
        </View>

        {/* Statistik Tiket — Grid 2×2 */}
        <View style={localStyles.statsGrid}>
          <View style={localStyles.statCard}>
            <Image source={require('../assets/flaticon/disk.png')} style={localStyles.statIcon} />
            <Text style={localStyles.statValue}>{localActiveCount ?? '—'}</Text>
            <Text style={localStyles.statLabel}>Aktif di Lokal</Text>
          </View>
          <View style={localStyles.statCard}>
            <Image source={require('../assets/flaticon/sync.png')} style={[localStyles.statIcon, { tintColor: '#007BFF' }]} />
            <Text style={localStyles.statValue}>{serverActiveCount ?? '—'}</Text>
            <Text style={localStyles.statLabel}>Aktif di Server</Text>
          </View>
          <View style={localStyles.statCard}>
            <Image source={require('../assets/flaticon/checked.png')} style={[localStyles.statIcon, { tintColor: '#22c55e' }]} />
            <Text style={localStyles.statValue}>{scannedCount}</Text>
            <Text style={localStyles.statLabel}>Sudah Dipindai</Text>
          </View>
          <View style={localStyles.statCard}>
            <Image source={require('../assets/flaticon/ticket.png')} style={[localStyles.statIcon, { tintColor: '#d97706' }]} />
            <Text style={localStyles.statValue}>{totalTicketCount}</Text>
            <Text style={localStyles.statLabel}>Total Tiket</Text>
          </View>
        </View>
        {lastSyncTime ? (
          <Text style={styles.syncTimeText}>
            (Disinkronkan pukul {lastSyncTime.toLocaleTimeString()})
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 8 }}>
            <Image source={require('../assets/flaticon/triangle-warning.png')} style={{ width: 12, height: 12, tintColor: '#dc2626', marginRight: 4 }} />
            <Text style={[styles.syncTimeText, { marginTop: 0 }]}>
              Belum sinkron — tekan tombol di atas saat online
            </Text>
          </View>
        )}

        {/* ── Indikator Antrian Offline Sync ── */}
        {pendingSyncCount > 0 && (
          <View style={localStyles.pendingBanner}>
            <Image source={require('../assets/flaticon/sync.png')} style={{ width: 16, height: 16, tintColor: '#92400e', marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={localStyles.pendingText}>
                {pendingSyncCount} tiket menunggu sinkronisasi ke server
              </Text>
              <Text style={localStyles.pendingSubtext}>
                Data tersimpan aman secara lokal. Akan dikirim otomatis saat koneksi tersedia.
              </Text>
            </View>
          </View>
        )}

        {/* ── Area Feedback Validasi — menampilkan hasil verifikasi tiket ── */}
        <View style={styles.feedbackContainer}>
          {scanFeedback ? (
            <View style={[styles.feedbackAlert, scanFeedback.status === 'success' ? styles.alertSuccess : styles.alertError]}>
              <Text style={styles.feedbackIcon}>
                {scanFeedback.status === 'success' ? '✅' : '❌'}
              </Text>
              <View style={styles.feedbackTextGroup}>
                <Text style={[styles.feedbackMessage, scanFeedback.status === 'success' ? styles.textSuccess : styles.textError]}>
                  {scanFeedback.message}
                </Text>
                {scanFeedback.detail && (
                  <Text style={styles.feedbackDetail}>{scanFeedback.detail}</Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.waitingText}>Menunggu pemindaian QR...</Text>
          )}
        </View>



      </ScrollView>

      {/* Modal Gate Picker */}
      <Modal
        visible={showGateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Pilih Gerbang Scanner</Text>
            <Text style={styles.modalSubtitle}>Tentukan gerbang fisik yang sedang dijaga saat ini</Text>

            <View style={styles.modalGateList}>
              {['regular', 'silver', 'gold', 'vip'].map(type => {
                const typeLabel = type.toUpperCase();
                return (
                  <View key={type} style={styles.modalGateRow}>
                    <Text style={styles.modalGateRowLabel}>{typeLabel}</Text>
                    <View style={styles.modalGateLetterGroup}>
                      {['A', 'B', 'C'].map(letter => {
                        const gateId = `${type}_${letter.toLowerCase()}`;
                        const gate = GATE_MAP[gateId];
                        const isSelected = selectedGate.id === gateId;
                        return (
                          <TouchableOpacity
                            key={gateId}
                            style={[
                              styles.modalGateLetterBtn,
                              isSelected && {
                                backgroundColor: gate.color,
                                borderColor: gate.color,
                              },
                            ]}
                            onPress={() => {
                              setSelectedGate(gate);
                              setSelectedGateType(type);
                              setShowGateModal(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.modalGateLetterText,
                                isSelected && styles.modalGateLetterTextActive,
                              ]}
                            >
                              {letter}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowGateModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Snackbar Notifikasi */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
}

// Styles khusus untuk grid statistik 2×2 yang baru
const localStyles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 22,
    height: 22,
    tintColor: '#6c757d',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Styles untuk banner antrian offline sync
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  pendingSubtext: {
    fontSize: 11,
    color: '#a16207',
    marginTop: 2,
  },
});
