/**
 * MyTicketScreen.tsx — Layar QR Tiket Pengguna (SISI PENONTON)
 *
 * Ini adalah layar utama bagi penonton — menampilkan QR code yang
 * dihasilkan secara dinamis menggunakan Gate-Bound TOTP.
 *
 * Alur kerja layar ini:
 * 1. HP penonton men-scan sinyal BLE yang dipancarkan HP admin (ScannerScreen)
 * 2. Dari sinyal BLE, diekstrak gate_id (identitas gerbang)
 * 3. gate_secret = HMAC(ticket_secret, gate_id) — derivasi kunci gate-bound
 * 4. OTP = TOTP(gate_secret, waktu_sekarang) — berubah setiap 30 detik
 * 5. QR payload = "ticket_id:event_id:gate_id:otp:signature"
 * 6. QR TIDAK ditampilkan sampai gerbang terdeteksi (proximity enforcement)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  FlatList,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';  // Komponen render QR code
import * as OTPAuth from 'otpauth';             // Library TOTP sesuai RFC 6238
import { Buffer } from 'buffer';               // Buffer untuk konversi hex/bytes
import { BleManager } from 'react-native-ble-plx'; // Library BLE untuk scan beacon
import {
  GATES,                          // Daftar semua gerbang yang didukung
  GATE_MAP,                       // Lookup map gate_id → Gate
  Gate,
  TicketType,
  deriveGateSecret,               // [KRITIS] HMAC derivasi gate_secret dari ticket_secret
  parseGateIdFromManufacturerData, // Parse gate_id dari data BLE beacon
  formatQrPayload,                // Format payload QR 5 bagian
  BLE_GATE_PREFIX,                // Prefix "GATE:" untuk identifikasi beacon kita
  filterGatesByTicketType,        // Filter gate berdasarkan tipe tiket penonton
} from '../utils/bleGate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_KEY, BASE_URL } from '../config';
import { authFetch } from '../utils/authFetch';
import AppHeader from '../components/AppHeader';
import { styles } from './MyTicketScreen.styles';

// ─────────────────────────────────────────────────────────────────────────────
// POLYFILLS — wajib untuk library kriptografi di lingkungan React Native
// ─────────────────────────────────────────────────────────────────────────────
(global as any).Buffer = Buffer;
const TextEncoding = require('text-encoding');
(global as any).TextEncoder = TextEncoding.TextEncoder;
(global as any).TextDecoder = TextEncoding.TextDecoder;

// ─────────────────────────────────────────────────────────────────────────────
// BLE Manager — singleton, dibuat sekali di module level (bukan di dalam komponen)
// Membuat BleManager di dalam komponen akan menyebabkan kebocoran resource
// ─────────────────────────────────────────────────────────────────────────────
const bleManager = new BleManager();

// ─────────────────────────────────────────────────────────────────────────────
// Fungsi permintaan izin BLE scan runtime (Android)
// Android 12+ (API 31+) memerlukan izin eksplisit BLUETOOTH_SCAN & CONNECT
// Android <12 memerlukan ACCESS_FINE_LOCATION (karena BLE scan bisa ungkap lokasi)
// ─────────────────────────────────────────────────────────────────────────────
const requestBleScanPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true; // iOS tidak butuh runtime permission ini
  try {
    if (Platform.Version >= 31) {
      // Android 12+ (API 31+)
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return Object.values(result).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      // Android <12: lokasi diperlukan karena BLE scan bisa mengungkap posisi
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch {
    return false;
  }
};

// Status proses BLE scan — menentukan tampilan banner di UI
type BleStatus = 'idle' | 'scanning' | 'found' | 'not_found' | 'error' | 'bt_off';

export default function MyTicketScreen({ route, navigation }: any) {
  // Parameter yang dikirim dari MyTicketsListScreen atau UserDashboard
  const {
    ticketId,
    ticketSecret, // [KRITIS] Digunakan untuk derive gate_secret via HMAC
    signature,    // [KRITIS] Tanda tangan ECDSA — diverifikasi scanner saat scan QR
    eventId,
    eventName,
    eventDate,
    ticketType,   // Tipe tiket: "regular"/"silver"/"gold"/"vip" — untuk filter gate BLE
  } = route.params || {};

  // Gate yang diperbolehkan untuk tiket ini (3 gate per tipe)
  // Jika ticketType tidak tersedia, tampilkan semua gate (backward compat)
  const allowedGates = ticketType
    ? filterGatesByTicketType(ticketType as TicketType)
    : GATES;

  // ── State QR ──────────────────────────────────────────────────────────────
  const [qrPayload, setQrPayload] = useState('Mendeteksi-Gerbang...'); // String yang di-encode ke QR
  const [timeLeft, setTimeLeft] = useState(30);               // Countdown waktu sampai QR berganti
  const progressAnim = useRef(new Animated.Value(1)).current; // Animasi progress bar countdown

  // ── State BLE Gate ────────────────────────────────────────────────────────
  const [detectedGate, setDetectedGate] = useState<Gate | null>(null);  // Gate yang terdeteksi via BLE
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);  // Gate yang dipilih manual (fallback)
  const [bleStatus, setBleStatus] = useState<BleStatus>('idle');        // Status proses scan BLE
  const [showGatePicker, setShowGatePicker] = useState(false);          // Kontrol modal pemilihan gate manual
  const [rssi, setRssi] = useState<number | null>(null);                // Kekuatan sinyal BLE (dBm)

  /*
   * activeGate: gate yang digunakan untuk generate TOTP.
   * BLE-detected diutamakan (lebih aman, tidak bisa dipalsukan oleh user),
   * fallback ke pilihan manual jika BLE tidak tersedia.
   */
  const activeGate = detectedGate ?? selectedGate;

  // ─────────────────────────────────────────────────────────────────────────
  // [KRITIS] BLE SCANNING — Deteksi Beacon dari HP Admin
  //
  // Pengguna tidak bisa generate QR tanpa mendeteksi sinyal BLE dari admin.
  // Ini adalah "proximity enforcement" — membuktikan pengguna secara fisik
  // berada di dekat gerbang yang benar.
  // ─────────────────────────────────────────────────────────────────────────
  const startBleScanning = useCallback(async () => {
    const granted = await requestBleScanPermission();
    if (!granted) {
      setBleStatus('error');
      return;
    }

    const btState = await bleManager.state();
    if (btState !== 'PoweredOn') {
      setBleStatus('bt_off');
      return;
    }

    setBleStatus('scanning');

    bleManager.startDeviceScan(
      null,                    // null = scan semua service UUID (tidak difilter)
      { allowDuplicates: true }, // Terima advertisement berulang untuk RSSI update
      (error, device) => {
        if (error) {
          setBleStatus('error');
          return;
        }
        if (!device) return;

        // Strategi 1: Parse manufacturer data beacon (format: Base64 dari "GATE:{gate_id}")
        // Ini adalah metode utama — lebih handal karena tidak bergantung nama device
        const mfrData = device.manufacturerData;
        if (mfrData) {
          const gateId = parseGateIdFromManufacturerData(mfrData);
          // [FILTER] Hanya deteksi gate yang sesuai tipe tiket penonton
          // Misal: tiket Regular hanya akan bereaksi ke beacon regular_a/b/c
          if (gateId && GATE_MAP[gateId] && allowedGates.some(g => g.id === gateId)) {
            bleManager.stopDeviceScan();
            setDetectedGate(GATE_MAP[gateId]);
            setRssi(device.rssi ?? null);
            setBleStatus('found');
            return;
          }
        }

        // Strategi 2: Cek nama device yang mengandung prefix "GATE:"
        const name = device.name ?? device.localName ?? '';
        if (name.startsWith(BLE_GATE_PREFIX)) {
          const gateId = name.slice(BLE_GATE_PREFIX.length);
          // [FILTER] Gate harus ada di allowedGates (sesuai tipe tiket)
          if (GATE_MAP[gateId] && allowedGates.some(g => g.id === gateId)) {
            bleManager.stopDeviceScan();
            setDetectedGate(GATE_MAP[gateId]);
            setRssi(device.rssi ?? null);
            setBleStatus('found');
          }
        }
      },
    );

    // Timeout: stop scan setelah 10 detik jika tidak ada beacon yang terdeteksi
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setBleStatus(prev => (prev === 'scanning' ? 'not_found' : prev));
    }, 10000);
  }, []);

  // Mulai scan BLE otomatis saat layar pertama kali dibuka
  // Cleanup: stop scan saat layar ditutup (unmount) agar tidak drain baterai
  useEffect(() => {
    startBleScanning();
    return () => {
      bleManager.stopDeviceScan();
    };
  }, [startBleScanning]);

  // ─────────────────────────────────────────────────────────────────────────
  // [AUTO-EXIT] Polling status tiket dari server
  // Jika tiket sudah dipindai (is_used = true) oleh admin, otomatis kembali
  // ke layar sebelumnya agar penonton tidak stuck di layar QR.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeGate) return; // Hanya mulai polling jika QR sudah aktif

    const checkTicketStatus = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
        if (!sessionStr) return;
        const session = JSON.parse(sessionStr);

        const res = await authFetch(`${BASE_URL}/my_tickets?user_id=${session.userId}`);
        if (res.ok) {
          const tickets: any[] = await res.json();
          const currentTicket = tickets.find((t: any) => t.ticket_id === ticketId);
          if (currentTicket && currentTicket.is_used) {
            // Tiket sudah discan! Otomatis keluar
            navigation.goBack();
          }
        }
      } catch (err) {
        // Gagal fetch (offline dll), biarkan saja.
      }
    };

    // Polling setiap 5 detik
    const interval = setInterval(checkTicketStatus, 5000);
    return () => clearInterval(interval);
  }, [activeGate, ticketId, navigation]);

  // ─────────────────────────────────────────────────────────────────────────
  // [KRITIS] GATE-BOUND TOTP GENERATION
  //
  // Fungsi utama yang mengimplementasikan fitur inovatif TA.
  // Dipanggil: (1) saat gate pertama kali terdeteksi, (2) setiap 30 detik.
  // ─────────────────────────────────────────────────────────────────────────
  const generateQRCode = useCallback(() => {
    // QR tidak bisa di-generate tanpa ticket_secret (data kriptografis tiket)
    // dan tanpa activeGate (identitas gerbang yang dituju)
    if (!ticketSecret || !activeGate) {
      setQrPayload(activeGate ? 'Memproses...' : 'Mendeteksi-Gerbang...');
      return;
    }

    try {
      /*
       * [KRITIS] Derivasi kunci gate-bound:
       * gate_secret = HMAC-SHA256(key=ticket_secret, msg=gate_id)
       *
       * Ini adalah inti keamanan Gate-Bound TOTP:
       * - gate_secret unik untuk setiap kombinasi (tiket × gerbang)
       * - OTP yang dihasilkan hanya valid di gerbang dengan gate_id yang sama
       * - Scanner di gate_silver tidak akan menerima OTP dari gate_gold
       */
      const gateSecretHex = deriveGateSecret(ticketSecret, activeGate.id);
      const secretBytes = new Uint8Array(Buffer.from(gateSecretHex, 'hex'));

      // Buat instance TOTP dengan gate_secret sebagai rahasia
      const totpInstance = new OTPAuth.TOTP({
        issuer: 'SecureTicket',
        label: `Ticket-${ticketId}`,
        algorithm: 'SHA1',  // RFC 6238 default
        digits: 6,          // OTP 6 digit
        period: 30,         // Berubah setiap 30 detik
        secret: new OTPAuth.Secret({ buffer: secretBytes.buffer }),
      });

      // Generate OTP berdasarkan waktu sekarang (time-based)
      const otp = totpInstance.generate();

      /*
       * Format payload QR 5 bagian:
       * ticket_id : event_id : gate_id : otp : signature
       *     │           │         │        │        │
       *     │           │         │        │        └── ECDSA (keaslian tiket)
       *     │           │         │        └─────────── Gate-Bound TOTP (proximity)
       *     │           │         └──────────────────── Gerbang yang diklaim
       *     │           └────────────────────────────── Verifikasi event yang benar
       *     └────────────────────────────────────────── ID tiket untuk lookup offline DB
       */
      const payload = formatQrPayload(ticketId, eventId, activeGate.id, otp, signature);
      setQrPayload(payload);
    } catch (e) {
      console.error('[QR] Gate-Bound TOTP generation failed:', e);
    }
  }, [ticketSecret, activeGate, ticketId, eventId, signature]);

  // Regenerasi QR setiap kali gate berubah (BLE detected atau manual override)
  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // ─────────────────────────────────────────────────────────────────────────
  // Timer countdown 30 detik — sinkron dengan window TOTP
  //
  // Timer ini BUKAN yang menentukan kapan OTP berubah (itu ditentukan oleh
  // jam sistem yang disinkron lewat TOTP). Timer ini hanya untuk UX —
  // menampilkan sisa waktu sebelum QR berganti dan regenerasi pada waktunya.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const startTimer = () => {
      // Sinkronisasi dengan window TOTP: hitung sisa detik dalam window 30 detik saat ini
      const currentSeconds = Math.floor(Date.now() / 1000);
      const remaining = 30 - (currentSeconds % 30);
      setTimeLeft(remaining);
      // Reset dan mulai animasi progress bar
      progressAnim.setValue(remaining / 30);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: remaining * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    };

    startTimer();
    // Tick setiap 1 detik
    const interval = setInterval(() => {
      const currentSeconds = Math.floor(Date.now() / 1000);
      const remaining = 30 - (currentSeconds % 30);
      setTimeLeft(remaining);
      if (remaining === 30) {
        // Window TOTP baru dimulai — regenerasi QR dengan OTP baru
        generateQRCode();
        startTimer();
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup saat komponen unmount
  }, [generateQRCode]);

  // Interpolasi animasi progress bar: nilai 0-1 → lebar '0%'-'100%'
  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Banner status deteksi gerbang
  // Menampilkan tiga kondisi: ditemukan / sedang scan / tidak ditemukan
  // ─────────────────────────────────────────────────────────────────────────
  const renderGateBanner = () => {
    if (detectedGate) {
      // [KONDISI 1] Gate terdeteksi via BLE — tampilkan nama gate dan RSSI
      return (
        <View style={[styles.gateBanner, styles.gateBannerFound]}>
          <View style={[styles.gateDot, { backgroundColor: detectedGate.color }]} />
          <View style={styles.gateBannerTextGroup}>
            <Text style={styles.gateBannerTitle}>
              {detectedGate.emoji} Gerbang {detectedGate.name} Terdeteksi
            </Text>
            {/* RSSI: kekuatan sinyal — semakin kecil (misal: -40) = semakin dekat */}
            <Text style={styles.gateBannerSub}>
              via BLE {rssi != null ? `(RSSI: ${rssi} dBm)` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={startBleScanning}>
            <Text style={styles.reScanText}>Scan Ulang</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (bleStatus === 'scanning') {
      // [KONDISI 2] Sedang men-scan — spinner animasi
      return (
        <View style={[styles.gateBanner, styles.gateBannerScanning]}>
          <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 10 }} />
          <Text style={styles.gateBannerScanningText}>Mendeteksi gerbang terdekat via BLE...</Text>
        </View>
      );
    }

    if (bleStatus === 'bt_off') {
      // [KONDISI 3] BT Mati - JANGAN berikan tombol fallback manual
      return (
        <View style={[styles.gateBanner, styles.gateBannerMissed]}>
          <Text style={styles.gateBannerMissedText}>
            Bluetooth mati. Hidupkan Bluetooth untuk mendeteksi gerbang.
          </Text>
          <TouchableOpacity onPress={startBleScanning}>
            <Text style={styles.reScanText}>Coba Cek Ulang Bluetooth</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // [KONDISI 4] Tidak ditemukan / error — tampilkan opsi fallback manual (harus tunggu 10 detik scan)
    return (
      <View style={[styles.gateBanner, styles.gateBannerMissed]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('../assets/flaticon/triangle-warning.png')} 
            style={{ width: 14, height: 14, tintColor: '#856404', marginRight: 6 }} 
          />
          <Text style={styles.gateBannerMissedText}>
            Sinyal BLE tidak terdeteksi
          </Text>
        </View>
        {/*
          Pilihan manual: pengguna memilih gerbang sendiri sesuai instruksi petugas.
          Ini adalah fallback untuk kondisi di mana BLE tidak tersedia
          (HP tidak support, bluetooth mati, atau terlalu jauh dari beacon).
        */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
          style={styles.manualPickerBtn}
          onPress={() => setShowGatePicker(true)}>
          <Text style={styles.manualPickerBtnText}>
            {selectedGate ? `${selectedGate.emoji} ${selectedGate.name} (Manual)` : 'Pilih Gerbang Manual ▼'}
          </Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={styles.reScanBtn}
          onPress={startBleScanning}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
            source={require('../assets/flaticon/reload.png')} 
            style={{ width: 14, height: 14, tintColor: '#ffffff', marginRight: 4 }} 
          />
          <Text style={styles.reScanText}>Pindai Ulang Sinyal BLE</Text>
          </View> 
          </TouchableOpacity>
       </View> 
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Modal pemilihan gate secara manual (fallback BLE)
  // Ditampilkan saat BLE tidak berhasil mendeteksi beacon gerbang
  // ─────────────────────────────────────────────────────────────────────────
  const renderGatePickerModal = () => (
    <Modal
      visible={showGatePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGatePicker(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Pilih Gerbang Masuk</Text>
          <Text style={styles.modalSubtitle}>
            {ticketType
              ? `Tiket ${ticketType.toUpperCase()} dapat masuk di gerbang berikut:`
              : 'Pilih gerbang sesuai instruksi petugas'}
          </Text>
          {/*
            [FILTER] Hanya tampilkan gate yang sesuai tipe tiket.
            Tiket Regular hanya tampil gate regular_a/b/c, tiket VIP hanya vip_a/b/c, dst.
            Ini mencegah penonton salah memilih gate yang bukan haknya.
          */}
          <FlatList
            data={allowedGates}
            keyExtractor={g => g.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.gateOption,
                  selectedGate?.id === item.id && { borderColor: item.color, borderWidth: 2 },
                ]}
                onPress={() => {
                  setSelectedGate(item);
                  setDetectedGate(null);
                  setShowGatePicker(false);
                }}>
                <Text style={styles.gateOptionEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gateOptionName}>{item.name}</Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>{item.id}</Text>
                </View>
                {selectedGate?.id === item.id && (
                  <Text style={[styles.gateOptionCheck, { color: item.color }]}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={() => setShowGatePicker(false)}>
            <Text style={styles.modalCancelText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER UTAMA
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Tampilkan QR" onBack={() => navigation.goBack()} />
      {renderGatePickerModal()}

      {/* Banner status BLE */}
      <View style={styles.headerSection}>
        {renderGateBanner()}
      </View>

      <View style={styles.content}>
        <View style={styles.ticketCard}>
          <Text style={styles.eventName}>{eventName ?? 'Event'}</Text>
          <Text style={styles.eventDate}>{eventDate ?? '—'}</Text>

          {/* Badge nama gerbang aktif dengan warna unik per gate */}
          {activeGate && (
            <View style={[styles.gateIndicator, { borderColor: activeGate.color }]}>
              <Text style={[styles.gateIndicatorText, { color: activeGate.color }]}>
                {activeGate.emoji} Gate {activeGate.name}
              </Text>
            </View>
          )}

          {/*
            [KRITIS] QR Code — hanya ditampilkan jika activeGate sudah terdeteksi.
            Sebelum gate terdeteksi, tampilan 🔒 (QR terkunci) ditampilkan.
            Ini adalah implementasi "proximity enforcement":
            pengguna TIDAK BISA melihat QR-nya sebelum berada di dekat gerbang yang tepat.
          */}
          <View style={[
            styles.qrContainer,
            !activeGate && styles.qrContainerDisabled,
          ]}>
            {activeGate ? (
              <QRCode
                value={qrPayload}    // Payload 5 bagian: id:event:gate:otp:sig
                size={200}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            ) : (
              // Placeholder terkunci — muncul sebelum gate terdeteksi
              <View style={styles.qrPlaceholder}>
                <Image source={require('../assets/flaticon/qr-code.png')} style={{ width: 48, height: 48, tintColor: '#cbd5e1', marginBottom: 12 }} />
                <Text style={styles.qrPlaceholderText}>
                  Menunggu deteksi gerbang{'\n'}untuk membuka QR
                </Text>
              </View>
            )}
          </View>

          {/* Countdown timer TOTP — menunjukkan sisa waktu sebelum QR berganti */}
          <View style={styles.timerContainer}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerLabel}>
                {activeGate ? 'QR BERUBAH DALAM' : 'MENUNGGU GERBANG'}
              </Text>
              <Text style={styles.timerValue}>{activeGate ? `${timeLeft}s` : '—'}</Text>
            </View>
            {/* Progress bar yang menyusut seiring countdown — warna sesuai gate aktif */}
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: widthInterpolation, backgroundColor: activeGate?.color ?? '#94a3b8' }]} />
            </View>
          </View>

          {/* Debug info: preview payload QR (dipotong untuk keamanan tampilan) */}
          <Text style={styles.payloadText} numberOfLines={1}>
            {activeGate ? `🔐 Gate-Bound: ${qrPayload.slice(0, 40)}...` : '🔒 QR terkunci — deteksi gerbang dulu'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}


