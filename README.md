# Dynamic Secure QR Ticketing MVP

Sistem *Smart Ticketing* yang mengimplementasikan keamanan tinggi menggunakan kombinasi Kriptografi Kurva Eliptik (ECDSA), *Gate-Bound Time-Based One-Time Password* (TOTP), dan perlindungan *Double Spending*. Sistem ini didesain untuk mencegah pemalsuan tiket, pencurian tiket via tangkapan layar (*screenshot*), dan penggunaan tiket berulang, bahkan ketika pemindai tiket (*scanner*) beroperasi secara *offline* di lokasi acara.

Aplikasi ini merupakan produk Tugas Akhir (TA) untuk membuktikan konsep tiket QR dinamis yang divalidasi langsung secara lokal.

## Arsitektur Sistem

Proyek ini menggunakan struktur *Monorepo* yang berisi dua bagian utama:
1. **Backend (Python / FastAPI)**: Mengelola *database* SQLite terpusat, registrasi *user*, alokasi gerbang, pembelian tiket, dan sinkronisasi antrean (*offline sync*). *Backend* juga menyimpan *Private Key* ECDSA untuk menandatangani setiap tiket yang dibeli secara kriptografis.
2. **Mobile (React Native / Expo)**: Aplikasi *frontend* dengan dua peran:
   - **Sisi Penonton**: Menerima tiket (berisi *Ticket Secret* & Signature ECDSA), mendeteksi pemancar sinyal Bluetooth Low Energy (BLE) di gerbang, dan mem-versi-kan (*generate*) QR Dinamis yang berubah setiap 30 detik (*TOTP*).
   - **Sisi Admin/Scanner**: Memancarkan *beacon* Bluetooth gerbang (`Gate-ID`), memindai QR penonton, dan memverifikasi keaslian kriptografis tiket secara lokal tanpa perlu internet (*Offline-First*).

## Fitur Keamanan (3 Lapis Validasi)

1. **Lapis 1: Keaslian Kriptografis (ECDSA P-256)**
   Membuktikan tiket secara sah diterbitkan oleh *backend* resmi. *Scanner* memverifikasi *signature* tiket menggunakan *Public Key* tanpa perlu terkoneksi ke *backend*.
2. **Lapis 2: Gate-Bound TOTP (Anti-Screenshot/Replay)**
   Kode QR akan otomatis berubah setiap 30 detik. Validasi TOTP ini diikatkan secara unik pada ID Gerbang tertentu (*Gate-Bound*). QR tidak akan bisa dibuat jika Bluetooth HP penonton tidak menangkap sinyal dari HP pemindai gerbang.
3. **Lapis 3: Anti-Double Spending & Offline Sync**
   Jika tiket valid, *scanner* akan mencatat ID tiket ke penyimpanan lokal (*AsyncStorage*). Jika tiket dipindai ulang di gerbang mana pun, *scanner* akan menolaknya. Saat *scanner* kembali *online*, riwayat pemindaian akan disinkronkan ke server pusat (*Batch Sync*).

## Struktur Direktori

```text
dynamic-secure-qr-ticketing-mvp/
├── backend/            # API Server (FastAPI), Database (SQLite)
├── mobile/             # React Native CLI App (Frontend Penonton & Admin)
├── PROJECT_CONTEXT.md  # Dokumentasi log pengembangan dan keputusan teknis TA
├── TODO_LIST_TA.md     # Rencana pengerjaan (Selesai sepenuhnya untuk lokal)
└── README.md           # Anda berada di sini
```

## Cara Menjalankan Aplikasi di Lokal

### 1. Menjalankan Backend
1. Pastikan Anda telah menginstal **Python 3.9+**.
2. Masuk ke direktori `backend/`:
   ```bash
   cd backend
   ```
3. Instal semua dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan *server* FastAPI (akan otomatis jalan di port `8000`):
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 2. Menjalankan Mobile App (React Native)
1. Buka terminal baru dan masuk ke direktori `mobile/`:
   ```bash
   cd mobile
   ```
2. Pastikan `BASE_URL` di dalam `mobile/src/config.ts` merujuk ke alamat IP lokal komputermu (bukan `localhost` jika dijalankan di *device* fisik).
   ```typescript
   export const BASE_URL = 'http://192.168.x.x:8000';
   ```
3. Instal seluruh *package* NPM:
   ```bash
   npm install
   ```
4. Jalankan *Metro Bundler*:
   ```bash
   npm start
   ```
5. Buka aplikasi di emulator atau perangkat fisik (disarankan menggunakan *device* Android sungguhan untuk mendukung pemindaian BLE dan Kamera).

---
*Dibuat untuk keperluan Tugas Akhir - 2026*
