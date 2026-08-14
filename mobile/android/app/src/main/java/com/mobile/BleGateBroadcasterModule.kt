/*
 * BleGateBroadcasterModule.kt — Native Android Module untuk BLE Beacon Broadcasting
 *
 * Modul ini adalah komponen sisi admin dalam arsitektur proximity enforcement.
 * Menggunakan Android BluetoothLeAdvertiser API untuk memancarkan sinyal BLE
 * yang berisi gate_id ke udara (non-connectable advertising).
 *
 * Alur kerja proximity enforcement:
 *   1. Admin HP memancarkan beacon: "GATE:{gate_id}" via manufacturer data
 *   2. Penonton HP (react-native-ble-plx) scan dan baca manufacturerData
 *   3. parseGateIdFromManufacturerData() mengekstrak gate_id dari beacon
 *   4. gate_secret = HMAC(ticket_secret, gate_id) di-derive di MyTicketScreen
 *   5. QR (Gate-Bound TOTP) baru di-generate dan ditampilkan
 */
package com.mobile

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.Build
import android.os.ParcelUuid
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.UUID

/**
 * BleGateBroadcasterModule — Native Android Module
 *
 * Menjembatani JavaScript (ScannerScreen.tsx) dengan Android BLE Advertiser API.
 * @ReactMethod membuatnya dapat dipanggil dari JavaScript via NativeModules.BleGateBroadcaster
 *
 * Data yang dipancarkan:
 *  - Service UUID: untuk identifikasi aplikasi E-Ticketing
 *  - Manufacturer Data: "GATE:{gate_id}" dalam encoding UTF-8
 *    (Contoh: "GATE:gate_vip" → bytes 47 41 54 45 3A 67 61 74 65 5F 76 69 70)
 */
class BleGateBroadcasterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        /**
         * Service UUID unik untuk identifikasi beacon E-Ticketing.
         * HP Penonton bisa memfilter scan hanya untuk UUID ini (opsional).
         */
        val GATE_SERVICE_UUID: UUID = UUID.fromString("12345678-1234-1234-1234-1234567890AB")
        /**
         * Company ID dalam manufacturer data (0xFFFF = test/demo, tidak terdaftar secara resmi).
         * Di produksi, gunakan company ID yang terdaftar di Bluetooth SIG.
         */
        const val COMPANY_ID = 0xFFFF
        /** Prefix string yang mengidentifikasi ini adalah beacon gate kita */
        const val GATE_PREFIX = "GATE:"
    }

    private var advertiser: BluetoothLeAdvertiser? = null  // Instance BLE advertiser Android
    private var advertiseCallback: AdvertiseCallback? = null  // Callback hasil start/stop advertising

    /** Nama modul yang digunakan oleh NativeModules.BleGateBroadcaster di JavaScript */
    override fun getName(): String = "BleGateBroadcaster"

    /**
     * [BRIDGE] Mulai memancarkan BLE beacon dengan gate_id yang diberikan.
     * Dapat dipanggil dari JavaScript: await NativeModules.BleGateBroadcaster.startBroadcast(gateId)
     *
     * @param gateId ID gerbang (mis. "gate_vip") yang akan di-encode ke beacon
     * @param promise Resolve dengan pesan sukses, atau reject dengan kode error
     */
    @ReactMethod
    fun startBroadcast(gateId: String, promise: Promise) {
        try {
            val bluetoothManager =
                reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            val bluetoothAdapter = bluetoothManager?.adapter

            if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
                promise.reject("BT_DISABLED", "Bluetooth tidak aktif.")
                return
            }

            advertiser = bluetoothAdapter.bluetoothLeAdvertiser
            if (advertiser == null) {
                promise.reject("BT_LE_UNSUPPORTED", "Perangkat tidak mendukung BLE advertising.")
                return
            }

            // Hentikan broadcast sebelumnya sebelum memulai yang baru
            stopBroadcastInternal()

            /**
             * AdvertiseSettings: konfigurasi parameter broadcast BLE.
             * - LOW_LATENCY: interval advertise pendek (~100ms) untuk deteksi lebih cepat
             * - TX_POWER_HIGH: daya pancar maksimum untuk jangkauan lebih luas
             * - setConnectable(false): beacon-only, penonton tidak perlu connect ke HP admin
             */
            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(false)  // Non-connectable: hanya pancarkan data, tidak terima koneksi
                .build()

            /**
             * Encode gate_id ke dalam manufacturer data BLE.
             * Format: "GATE:{gate_id}" dalam UTF-8 bytes
             * Contoh: "GATE:regular_a" → diterima client → parseGateIdFromManufacturerData()
             *          → "regular_a" → GATE_MAP["regular_a"] → Gate object
             *
             * [FIX] Tidak lagi menyertakan Service UUID di advertising packet.
             * Kalkulasi byte sebelumnya menyebabkan ADVERTISE_FAILED_DATA_TOO_LARGE (error 1):
             *   UUID (128-bit) = 1+1+16 = 18 bytes
             *   ManufacturerData = 1+1+2+14 = 18 bytes
             *   Total = 36 bytes > batas BLE 31 bytes ← OVERFLOW!
             *
             * Setelah fix (hanya ManufacturerData):
             *   ManufacturerData = 1+1+2+14 = 18 bytes ← aman
             * Identifikasi beacon tetap aman karena prefix "GATE:" sudah unik.
             */
            val gatePayload = (GATE_PREFIX + gateId).toByteArray(Charsets.UTF_8)

            val data = AdvertiseData.Builder()
                .addManufacturerData(COMPANY_ID, gatePayload)   // Payload utama: "GATE:{gate_id}"
                .setIncludeDeviceName(false)                     // Sembunyikan nama device untuk privasi
                .build()

            // Setup callback hasil advertising
            advertiseCallback = object : AdvertiseCallback() {
                override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                    // Kirim event ke JavaScript via RCTDeviceEventEmitter
                    sendEvent("BleGateBroadcasterStatus", "broadcasting:$gateId")
                    promise.resolve("Broadcasting gate: $gateId")
                }

                override fun onStartFailure(errorCode: Int) {
                    val reason = when (errorCode) {
                        ADVERTISE_FAILED_ALREADY_STARTED -> "Already started"
                        ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "Feature unsupported"
                        ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Too many advertisers"
                        else -> "Unknown error $errorCode"
                    }
                    sendEvent("BleGateBroadcasterStatus", "error:$reason")
                    promise.reject("ADVERTISE_FAILED", reason)
                }
            }

            // Mulai advertising — hasilnya diterima via callback di atas
            advertiser?.startAdvertising(settings, data, advertiseCallback)

        } catch (e: SecurityException) {
            // Android 12+: izin BLUETOOTH_ADVERTISE belum diberikan
            promise.reject("PERMISSION_DENIED", "Izin Bluetooth Advertise belum diberikan: ${e.message}")
        } catch (e: Exception) {
            promise.reject("BROADCAST_ERROR", e.message ?: "Unknown error")
        }
    }

    /**
     * [BRIDGE] Hentikan pancaran BLE beacon.
     * Dipanggil dari JavaScript: await NativeModules.BleGateBroadcaster.stopBroadcast()
     */
    @ReactMethod
    fun stopBroadcast(promise: Promise) {
        try {
            stopBroadcastInternal()
            // Kirim event "stopped" ke JavaScript (ScannerScreen akan update state)
            sendEvent("BleGateBroadcasterStatus", "stopped")
            promise.resolve("Broadcast stopped")
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message ?: "Unknown error")
        }
    }

    /**
     * [BRIDGE] Cek apakah perangkat mendukung BLE advertising (broadcasting).
     * Berbeda dari isBluetoothEnabled() — ini cek kemampuan HARDWARE, bukan status BT.
     * HP yang tidak mendukung harus menggunakan mode simulasi.
     *
     * Catatan: mengembalikan false jika BT sedang mati, karena bluetoothLeAdvertiser
     * tidak dapat dicek tanpa BT aktif. Gunakan isBluetoothEnabled() untuk membedakan.
     */
    @ReactMethod
    fun isSupported(promise: Promise) {
        try {
            val bluetoothManager =
                reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            val adapter = bluetoothManager?.adapter

            if (adapter == null) {
                // Tidak ada hardware Bluetooth sama sekali
                promise.resolve(false)
                return
            }
            if (!adapter.isEnabled) {
                // BT mati — kembalikan false, tapi ini bukan berarti hardware tidak support
                // Caller bisa cek isBluetoothEnabled() untuk membedakan kasus ini
                promise.resolve(false)
                return
            }
            // BT aktif — cek apakah hardware mendukung BLE advertising
            promise.resolve(adapter.bluetoothLeAdvertiser != null)
        } catch (e: SecurityException) {
            // Izin BLUETOOTH_CONNECT belum diberikan — tidak bisa cek
            promise.resolve(false)
        }
    }

    /**
     * [BRIDGE] Cek apakah Bluetooth saat ini aktif (dihidupkan).
     * Berbeda dari isSupported() — ini tidak cek hardware capability.
     * Gunakan untuk membedakan pesan error: "Hidupkan BT" vs "HP tidak support".
     */
    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        val bluetoothManager =
            reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val adapter = bluetoothManager?.adapter
        promise.resolve(adapter?.isEnabled == true)
    }

    /** Stop advertising secara internal tanpa mengirim event ke JavaScript */
    private fun stopBroadcastInternal() {
        val cb = advertiseCallback
        if (advertiser != null && cb != null) {
            try {
                advertiser?.stopAdvertising(cb)
            } catch (_: Exception) {}
        }
        advertiseCallback = null
    }

    /**
     * Kirim event ke JavaScript melalui RCTDeviceEventEmitter.
     * Di JavaScript, didengar via NativeEventEmitter:
     *   emitter.addListener('BleGateBroadcasterStatus', callback)
     */
    private fun sendEvent(eventName: String, data: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }

    /**
     * Dipanggil saat React Native bridge dihancurkan (mis. app di-kill).
     * Penting: selalu hentikan advertising agar tidak menguras baterai.
     */
    override fun onCatalystInstanceDestroy() {
        stopBroadcastInternal()
        super.onCatalystInstanceDestroy()
    }
}
