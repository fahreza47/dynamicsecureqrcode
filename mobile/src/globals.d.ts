/**
 * globals.d.ts — Deklarasi Tipe Global untuk Environment React Native
 *
 * TypeScript secara default tidak mengenal `global` karena bukan browser (window)
 * maupun Node.js murni. File ini membuatnya dikenali oleh compiler agar tidak error.
 */

// Deklarasi objek `global` — setara dengan `window` di browser, tersedia di seluruh app
declare var global: typeof globalThis & Record<string, any>;

// Deklarasi module untuk aset PNG agar bisa di-require tanpa error TypeScript
declare module '*.png' {
  const value: any;
  export default value;
}

/**
 * Deklarasi modul untuk subpath exports dari @noble yang tidak dikenali
 * oleh TypeScript karena moduleResolution tertentu tidak support package exports map.
 * Ini hanya untuk tujuan type-checking; implementasi aslinya tetap dari node_modules.
 */

// HMAC (Hash-based Message Authentication Code) — digunakan untuk key derivation (KDF)
declare module '@noble/hashes/hmac' {
  export function hmac(hash: any, key: Uint8Array, msg: Uint8Array): Uint8Array;
}

// SHA-256 — algoritma hash kriptografis, digunakan untuk ECDSA message hashing
declare module '@noble/hashes/sha256' {
  export function sha256(msg: Uint8Array): Uint8Array;
}

// P-256 (NIST P-256 / secp256r1) — kurva eliptik yang digunakan untuk ECDSA signature
declare module '@noble/curves/p256' {
  export const p256: {
    Signature: {
      fromCompact(bytes: Uint8Array): any;
    };
    verify(sig: any, msgHash: Uint8Array, publicKey: Uint8Array): boolean;
  };
}
