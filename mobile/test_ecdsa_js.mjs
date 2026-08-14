/**
 * Skrip tes cross-verification ECDSA P-256
 * Membuktikan bahwa fix double-hashing sudah benar.
 * 
 * Jalankan dengan: node test_ecdsa_js.mjs
 */

// Import dari path yang sama dengan ScannerScreen.tsx
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { Buffer } from 'buffer';

// === Data tes dari output test_ecdsa_python.py ===
const SIG_B64 = 'hluzo0qSGE2JISfxx3aGt59CfBOD8ddi9re+miXuFDtyIMGtLpuTpHmRi0Bly0yIPk0jaS9jAWJzqEIaYNjuLg==';
const PUB_KEY_HEX = '04b2ad18db1bd72e70773246462a5c497a7f82f31d94aaf0341539cdbceb346479556f0dfc3c138f400da43bdb9f2bf6a8405350f4f0a40db71c270bf360b5c6c6';
const MESSAGE = '1:1';

// Decode data
const msgBytes = new Uint8Array(Buffer.from(MESSAGE, 'utf-8'));
const sigBytes = new Uint8Array(Buffer.from(SIG_B64, 'base64'));
const pubKeyBytes = new Uint8Array(Buffer.from(PUB_KEY_HEX, 'hex'));

console.log('=== ECDSA P-256 Cross-Verification Test ===');
console.log(`Message        : "${MESSAGE}"`);
console.log(`Sig length     : ${sigBytes.length} bytes`);
console.log(`PubKey length  : ${pubKeyBytes.length} bytes`);
console.log('');

// --- TEST 1: KODE BARU / FIX (raw message, biarkan library hash secara internal) ---
try {
  const result1 = p256.verify(sigBytes, msgBytes, pubKeyBytes, { lowS: false });
  console.log(`[FIX] verify(sig, rawMessage, pubKey)      => ${result1 ? 'VALID' : 'INVALID'}`);
} catch (e) {
  console.log(`[FIX] verify(sig, rawMessage, pubKey)      => ERROR: ${e.message}`);
}

// --- TEST 2: KODE LAMA / BUG (hash manual lalu library hash lagi = double hash) ---
const msgHash = sha256(msgBytes); // Hash manual pertama
try {
  const result2 = p256.verify(sigBytes, msgHash, pubKeyBytes, { lowS: false });
  console.log(`[BUG] verify(sig, sha256(message), pubKey) => ${result2 ? 'VALID' : 'INVALID'}`);
} catch (e) {
  console.log(`[BUG] verify(sig, sha256(message), pubKey) => ERROR: ${e.message}`);
}

console.log('');
console.log('Jika [FIX]=VALID dan [BUG]=INVALID, maka fix double-hashing BENAR.');
