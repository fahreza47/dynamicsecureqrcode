"""
Skrip tes sederhana ECDSA P-256.
Menandatangani pesan "1:1" (simulasi ticket_id:event_id),
lalu mencetak signature (base64) dan public key (hex).
Digunakan untuk menguji verifikasi di sisi JavaScript.
"""
import hashlib
import base64
from ecdsa import SigningKey, NIST256p

# Generate key pair baru untuk tes
private_key = SigningKey.generate(curve=NIST256p)
public_key = private_key.get_verifying_key()

# Pesan yang ditandatangani (sama persis dengan format backend)
message = "1:1"  # ticket_id:event_id

# Sign menggunakan SHA-256 (sama persis dengan backend)
signature = private_key.sign(
    message.encode('utf-8'),
    hashfunc=hashlib.sha256
)

# Encode signature ke Base64 (sama persis dengan backend)
sig_b64 = base64.b64encode(signature).decode('utf-8')

# Public key dalam format uncompressed hex (sama persis dengan backend)
pub_hex = "04" + public_key.to_string().hex()

print("=== ECDSA P-256 Test Data ===")
print(f"Message       : {message}")
print(f"Signature (b64): {sig_b64}")
print(f"Sig length     : {len(signature)} bytes")
print(f"Public key (hex): {pub_hex}")
print(f"Pub key length  : {len(bytes.fromhex(pub_hex))} bytes")

# Verifikasi lokal di Python (harus True)
try:
    public_key.verify(signature, message.encode('utf-8'), hashfunc=hashlib.sha256)
    print(f"\nPython verify  : ✅ VALID")
except Exception as e:
    print(f"\nPython verify  : ❌ INVALID - {e}")
