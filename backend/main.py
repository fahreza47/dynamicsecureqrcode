"""
main.py — FastAPI Backend untuk Sistem E-Ticketing Dinamis

Arsitektur keamanan backend:
  1. ECDSA P-256: Server memiliki private_key permanen (disimpan di private_key.pem).
     Public key-nya bisa diunduh admin via GET /public_key untuk verifikasi offline.

  2. KDF Hierarki:
     master_secret_key (per user, acak) → ticket_secret = HMAC(master_secret, ticket_id)
     ticket_secret dikirim ke client saat /buy_ticket, lalu client men-derive:
     gate_secret = HMAC(ticket_secret, gate_id) — hanya di sisi client, tidak pernah ke server.

  3. Anti-double spending sisi server via kolom is_used di database (endpoint /use_ticket).

  4. ScanLog untuk audit trail pemindaian (tanpa data pribadi penonton — data minimization).
"""

import os
import json
import base64
import hmac
import hashlib
import re
import bcrypt
from datetime import datetime, timezone, timedelta, date as date_type
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional
from ecdsa import SigningKey, NIST256p
import ecdsa
import models
import database
from database import engine
from auth import create_access_token, get_current_user, require_admin

# Buat tabel database jika belum ada (auto-migrate sederhana)
database.Base.metadata.create_all(bind=engine)

# =============================================
# [KRITIS] ECDSA Key Management — Persisten Antar Restart
#
# Private key disimpan ke file PEM agar tidak berubah saat server restart.
# Jika key berubah, semua signature tiket lama akan gagal diverifikasi.
# Di produksi: simpan key di environment variable atau secrets manager.
# =============================================
KEY_FILE = "private_key.pem"

def load_or_generate_key() -> SigningKey:
    """
    Load ECDSA private key dari environment variable (prioritas utama untuk platform awan),
    fallback ke file 'private_key.pem' jika ada, atau generate baru dan simpan.
    """
    # 1. Cek dari Environment Variable (Railway dll)
    env_key = os.getenv("ECDSA_PRIVATE_KEY")
    if env_key:
        try:
            # Karena env var mungkin menggunakan \n literal, kita perbaiki dulu
            clean_key = env_key.replace('\\n', '\n')
            return SigningKey.from_pem(clean_key.encode('utf-8'))
        except Exception as e:
            print(f"[ERROR] Gagal membaca ECDSA_PRIVATE_KEY dari ENV: {e}")

    # 2. Cek dari file lokal
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            return SigningKey.from_pem(f.read())
            
    # 3. Generate baru
    key = SigningKey.generate(curve=NIST256p)
    with open(KEY_FILE, "wb") as f:
        f.write(key.to_pem())
    print(f"[INIT] ECDSA key baru digenerate dan disimpan ke '{KEY_FILE}'.")
    return key

PRIVATE_KEY = load_or_generate_key()
PUBLIC_KEY = PRIVATE_KEY.get_verifying_key()

app = FastAPI(title="E-Ticketing Backend MVP")


# =============================================
# Gate Definitions — Konsisten dengan bleGate.ts
# Format: {type}_{letter} — 4 tipe × 3 huruf = 12 gerbang
# =============================================
DEFAULT_GATES = [
    # Regular: gate tipe regular dengan 3 gerbang (A, B, C)
    {"id": "regular_a", "name": "Regular A", "gate_type": "regular", "letter": "A"},
    {"id": "regular_b", "name": "Regular B", "gate_type": "regular", "letter": "B"},
    {"id": "regular_c", "name": "Regular C", "gate_type": "regular", "letter": "C"},
    # Silver
    {"id": "silver_a",  "name": "Silver A",  "gate_type": "silver",  "letter": "A"},
    {"id": "silver_b",  "name": "Silver B",  "gate_type": "silver",  "letter": "B"},
    {"id": "silver_c",  "name": "Silver C",  "gate_type": "silver",  "letter": "C"},
    # Gold
    {"id": "gold_a",    "name": "Gold A",    "gate_type": "gold",    "letter": "A"},
    {"id": "gold_b",    "name": "Gold B",    "gate_type": "gold",    "letter": "B"},
    {"id": "gold_c",    "name": "Gold C",    "gate_type": "gold",    "letter": "C"},
    # VIP
    {"id": "vip_a",     "name": "VIP A",     "gate_type": "vip",     "letter": "A"},
    {"id": "vip_b",     "name": "VIP B",     "gate_type": "vip",     "letter": "B"},
    {"id": "vip_c",     "name": "VIP C",     "gate_type": "vip",     "letter": "C"},
]


# =============================================
# Event Seeder — Jalankan saat startup
# =============================================
def seed_events(db: Session):
    """
    Mengisi data event dan gate default jika database masih kosong.
    Event default sudah dilengkapi dengan lokasi, waktu, dan kuota tiket.
    """
    if db.query(models.Event).count() == 0:
        # Tanggal dinamis: event pertama = besok (untuk testing validasi waktu),
        # event kedua = 30 hari lagi (untuk demo jangka panjang)
        tomorrow = (date_type.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        next_month = (date_type.today() + timedelta(days=30)).strftime("%Y-%m-%d")
        default_events = [
            models.Event(
                id=1,
                name="Konser Demo (Test)",
                date=tomorrow,
                location="GBK Jakarta",
                time="19:00 WIB",
                quota_regular=100,
                quota_silver=50,
                quota_gold=30,
                quota_vip=20,
            ),
            models.Event(
                id=2,
                name="Sheila on 7 Live",
                date=next_month,
                location="Istora Senayan",
                time="20:00 WIB",
                quota_regular=150,
                quota_silver=60,
                quota_gold=40,
                quota_vip=25,
            ),
        ]
        db.add_all(default_events)
        db.commit()
        print(f"[INIT] Default events di-seed: '{tomorrow}' dan '{next_month}'.")

    if db.query(models.Gate).count() == 0:
        gates = [
            models.Gate(
                id=g["id"],
                name=g["name"],
                gate_type=g["gate_type"],
                letter=g["letter"],
            )
            for g in DEFAULT_GATES
        ]
        db.add_all(gates)
        db.commit()
        print("[INIT] 12 default gates (Regular/Silver/Gold/VIP × A/B/C) berhasil di-seed.")

def seed_admin(db: Session):
    admin_user = db.query(models.User).filter(models.User.username == "Eja123").first()
    if not admin_user:
        hashed_password = get_password_hash("Eja123")
        master_secret = models.generate_master_secret()
        new_admin = models.User(
            username="Eja123",
            password_hash=hashed_password,
            role=models.RoleEnum.admin,
            master_secret_key=master_secret,
            origin=None,
        )
        db.add(new_admin)
        db.commit()
        print("[INIT] Akun Admin default (Eja123) berhasil di-seed.")

@app.on_event("startup")
def startup_event():
    """Inisialisasi database saat server pertama kali dijalankan."""
    db = next(database.get_db())
    try:
        seed_events(db)
        seed_admin(db)
    finally:
        db.close()


# =============================================
# Utility Functions
# =============================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password menggunakan bcrypt constant-time comparison."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash password dengan bcrypt (saltnya otomatis ter-embed dalam hash)."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_ticket_secret(master_secret_key: str, ticket_id: int) -> str:
    """
    [KRITIS] Derivasi ticket_secret via HMAC-SHA256.

    ticket_secret = HMAC-SHA256(key=master_secret_key, msg=str(ticket_id))

    Mengapa HMAC daripada hash biasa?
    - HMAC membutuhkan pengetahuan kunci (master_secret_key) — penyerang
      tidak bisa men-derive ticket_secret hanya dengan mengetahui ticket_id.
    - Setiap user memiliki master_secret_key unik → ticket_secret pun unik
      bahkan untuk ticket_id yang sama antar user.

    Output: hex string 64 karakter (32 bytes)
    """
    hmac_obj = hmac.new(
        master_secret_key.encode('utf-8'),
        str(ticket_id).encode('utf-8'),
        hashlib.sha256
    )
    return hmac_obj.hexdigest()


# =============================================
# Pydantic Schemas — Validasi input request
# =============================================
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class BuyTicketRequest(BaseModel):
    user_id: int
    event_id: int
    ticket_type: models.TicketTypeEnum  # Tipe tiket yang dipilih penonton

class UseTicketRequest(BaseModel):
    ticket_id: int

class EventCreate(BaseModel):
    name: str
    date: str           # Format: YYYY-MM-DD
    location: Optional[str] = None
    time: Optional[str] = None
    quota_regular: int = 100
    quota_silver: int = 50
    quota_gold: int = 30
    quota_vip: int = 20

    @validator('name')
    def name_min_length(cls, v):
        """Nama acara wajib minimal 8 karakter."""
        v = v.strip()
        if len(v) < 8:
            raise ValueError('Nama acara minimal 8 karakter')
        return v

    @validator('date')
    def date_valid(cls, v):
        """Tanggal harus format YYYY-MM-DD dan bulan/hari valid."""
        v = v.strip()
        try:
            d = datetime.strptime(v, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('Format tanggal harus YYYY-MM-DD dengan nilai valid (mis. bulan 1-12, hari sesuai bulan)')
        if d < date_type.today():
            raise ValueError('Tanggal acara tidak boleh di masa lalu')
        return v

    @validator('location')
    def location_min_length(cls, v):
        """Lokasi wajib diisi minimal 8 karakter."""
        if v is None or v.strip() == '':
            raise ValueError('Lokasi venue wajib diisi')
        if len(v.strip()) < 8:
            raise ValueError('Lokasi venue minimal 8 karakter')
        return v.strip()

    @validator('time')
    def time_valid_format(cls, v):
        """Waktu harus format HH:MM (jam dan menit integer, jam 0-23)."""
        if v is None:
            return v
        v = v.strip()
        # Cek format HH:MM
        match = re.fullmatch(r'(\d{1,2}):(\d{2})', v)
        if not match:
            raise ValueError('Format waktu harus HH:MM (mis. 19:30 atau 08:00)')
        hour, minute = int(match.group(1)), int(match.group(2))
        if not (0 <= hour <= 23):
            raise ValueError('Jam harus antara 0-23')
        if not (0 <= minute <= 59):
            raise ValueError('Menit harus antara 0-59')
        return v

class UpdateProfileRequest(BaseModel):
    origin: Optional[str] = None  # Asal daerah penonton

class ScanLogRequest(BaseModel):
    """
    Request untuk mencatat log pemindaian yang berhasil.
    CATATAN: Tidak ada username/user_id — prinsip data minimization.
    """
    ticket_id: int
    event_id: int
    gate_id: str
    ticket_type: str  # "regular" / "silver" / "gold" / "vip"

class BatchSyncItem(BaseModel):
    """Satu entri dalam batch sync queue — tiket yang di-scan saat offline."""
    ticket_id: int
    event_id: int
    gate_id: str
    ticket_type: str
    scanned_at: Optional[str] = None  # ISO timestamp waktu pemindaian lokal

class BatchSyncRequest(BaseModel):
    """Request untuk mengirim batch scan results dari offline queue."""
    scans: list  # List of BatchSyncItem dicts

class UserResponse(BaseModel):
    """Response registrasi — menyertakan master_secret_key untuk disimpan client."""
    id: int
    username: str
    role: models.RoleEnum
    master_secret_key: str
    origin: Optional[str] = None

    class Config:
        from_attributes = True


# =============================================
# Endpoints — Auth
# =============================================

@app.get("/public_key")
def get_public_key():
    """
    Mengembalikan ECDSA public key server dalam format hex uncompressed (04 + x + y).
    Admin mengunduh ini saat online, lalu menyimpannya untuk verifikasi ECDSA offline.
    """
    pub_key_bytes = PUBLIC_KEY.to_string()
    pub_key_hex = "04" + pub_key_bytes.hex()
    return {"public_key": pub_key_hex}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    """
    Registrasi pengguna baru.

    Langkah-langkah kriptografis:
    1. Hash password dengan bcrypt
    2. Generate master_secret_key acak 32-byte (root KDF untuk seluruh tiket user ini)
    3. Simpan ke database

    [SECURITY NOTE] master_secret_key HANYA disimpan di server. 
    Tidak pernah dikembalikan ke client (bahkan saat registrasi) untuk mencegah kompromi 
    kunci root jika HP penonton diretas.
    """
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(user.password)
    master_secret = models.generate_master_secret()

    new_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        role=models.RoleEnum.user,  # Selalu jadikan user biasa saat registrasi publik
        master_secret_key=master_secret,
        origin=None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Buat JWT access token agar user langsung terautentikasi setelah register
    access_token = create_access_token(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role.value,
    )

    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role,
        "access_token": access_token,
        "token_type": "bearer",
    }

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(database.get_db)):
    """
    Login pengguna — mengembalikan JWT access token.

    [SECURITY HARDENING] Perubahan dari versi sebelumnya:
    - master_secret_key TIDAK lagi dikembalikan saat login (hanya saat register).
      Ini mencegah kebocoran kunci derivasi jika session dicuri.
    - Response kini menyertakan access_token (JWT) yang harus disertakan
      di header Authorization pada setiap request selanjutnya.
    """
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Buat JWT access token
    access_token = create_access_token(
        user_id=db_user.id,
        username=db_user.username,
        role=db_user.role.value,
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username,
        "role": db_user.role,
        "origin": db_user.origin,
    }

@app.patch("/users/{user_id}/profile")
def update_profile(
    user_id: int,
    request: UpdateProfileRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Update data profil penonton — saat ini hanya kolom origin (asal daerah).
    Data ini disimpan di server untuk analisis demografis penyelenggara,
    TIDAK masuk ke QR code (prinsip data minimization).

    [SECURITY] BOLA protection: user hanya bisa mengedit profil miliknya sendiri.
    """
    # Ownership check — cegah user mengedit profil orang lain
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda hanya dapat mengedit profil sendiri",
        )

    if request.origin is not None:
        current_user.origin = request.origin

    db.commit()
    db.refresh(current_user)
    return {
        "message": "Profile updated",
        "user_id": current_user.id,
        "origin": current_user.origin,
    }


# =============================================
# Endpoints — Tiket
# =============================================

@app.post("/buy_ticket")
def buy_ticket(
    request: BuyTicketRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Pembelian tiket — inti dari pipeline kriptografis server.

    Proses kriptografis:
    1. Buat record Ticket di database (dapatkan ticket_id, simpan ticket_type)
    2. Derive ticket_secret = HMAC(user.master_secret_key, ticket_id)
    3. Sign pesan "ticket_id:event_id" dengan ECDSA private key
    4. Kembalikan ticket_secret + signature + ticket_type ke client

    Catatan: ticket_secret TIDAK disimpan di database.

    [SECURITY] BOLA: user hanya bisa membeli tiket untuk dirinya sendiri.
    """
    # Ownership check — pastikan user_id di request = user yang terautentikasi
    if current_user.id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda hanya dapat membeli tiket untuk akun sendiri",
        )

    event = db.query(models.Event).filter(models.Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # ── CEK KUOTA TIKET PER TIPE ──────────────────────────────────────────
    # Hitung tiket tipe ini yang sudah terjual untuk event ini
    sold_count = db.query(models.Ticket).filter(
        models.Ticket.event_id == request.event_id,
        models.Ticket.ticket_type == request.ticket_type,
    ).count()

    # Ambil batas kuota sesuai tipe yang dipilih
    quota_map = {
        "regular": event.quota_regular,
        "silver":  event.quota_silver,
        "gold":    event.quota_gold,
        "vip":     event.quota_vip,
    }
    ticket_type_str = request.ticket_type.value
    quota_limit = quota_map.get(ticket_type_str, 0)

    if sold_count >= quota_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Kuota tiket {ticket_type_str.upper()} untuk event ini sudah habis ({sold_count}/{quota_limit})."
        )

    # Buat record tiket dengan tipe yang dipilih penonton
    new_ticket = models.Ticket(
        user_id=current_user.id,
        event_id=request.event_id,
        ticket_type=request.ticket_type,
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # [KRITIS] Derive ticket_secret unik untuk tiket ini
    ticket_secret = generate_ticket_secret(current_user.master_secret_key, new_ticket.id)

    # [KRITIS] Tanda tangani pesan menggunakan ECDSA P-256 private key
    message_to_sign = f"{new_ticket.id}:{request.event_id}"
    signature = PRIVATE_KEY.sign(
        message_to_sign.encode('utf-8'),
        hashfunc=hashlib.sha256
    )

    # Encode ke Base64 agar aman ditransmisikan dalam JSON
    signature_b64 = base64.b64encode(signature).decode('utf-8')

    return {
        "ticket_id": new_ticket.id,
        "event_id": request.event_id,
        "ticket_type": request.ticket_type.value,  # Dikembalikan untuk filter gate di client
        "ticket_secret": ticket_secret,
        "signature": signature_b64,
    }

@app.post("/use_ticket")
def use_ticket(
    request: UseTicketRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    Tandai tiket sebagai sudah digunakan di backend.
    Anti-double spending Lapis 3 sisi server.

    [SECURITY] Atomic transaction dengan row-level lock (FOR UPDATE)
    untuk mencegah race condition ketika 2 scanner memvalidasi tiket yang sama
    pada saat yang hampir bersamaan.
    """
    # SELECT ... FOR UPDATE — kunci baris ini sampai transaksi selesai
    # Jika scanner lain sedang memproses tiket yang sama, ia akan menunggu
    ticket = (
        db.query(models.Ticket)
        .filter(models.Ticket.id == request.ticket_id)
        .with_for_update()
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.is_used:
        raise HTTPException(status_code=409, detail="Ticket already used")

    ticket.is_used = True
    ticket.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Ticket marked as used", "ticket_id": request.ticket_id}

@app.post("/events/{event_id}/reset_tickets")
def reset_tickets(
    event_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    [ADMIN / DEMO] Reset status semua tiket pada event tertentu.
    
    Tujuan: Memudahkan demo/sidang TA agar admin bisa mendemonstrasikan
    ulang alur pemindaian tanpa harus membuat user dan membeli tiket baru.
    
    Yang dilakukan:
    1. Set is_used = False dan used_at = None untuk semua tiket event ini
    2. Hapus semua scan_logs terkait event ini (agar statistik ikut bersih)
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Reset semua tiket event ini
    tickets = db.query(models.Ticket).filter(models.Ticket.event_id == event_id).all()
    reset_count = 0
    for ticket in tickets:
        if ticket.is_used:
            ticket.is_used = False
            ticket.used_at = None
            reset_count += 1

    # Hapus scan logs terkait event ini agar statistik konsisten
    deleted_logs = db.query(models.ScanLog).filter(
        models.ScanLog.event_id == event_id
    ).delete()

    db.commit()
    return {
        "message": f"Reset berhasil untuk event '{event.name}'",
        "event_id": event_id,
        "tickets_reset": reset_count,
        "scan_logs_deleted": deleted_logs,
    }

@app.post("/batch_sync_scans")
def batch_sync_scans(
    request: BatchSyncRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    [OFFLINE SYNC QUEUE] Menerima batch scan results yang dikumpulkan saat offline.

    Untuk setiap item dalam antrian:
    1. Tandai tiket sebagai digunakan (is_used = True) jika belum
    2. Buat entri ScanLog untuk audit trail

    Endpoint ini idempotent: jika tiket sudah is_used, tidak akan error,
    hanya di-skip dan tetap buat scan log (jika belum ada).

    [SECURITY] RBAC: Hanya admin yang boleh mengirim batch sync.
    [SECURITY] Atomic: FOR UPDATE lock pada setiap tiket untuk mencegah race condition.
    """
    synced = 0
    skipped = 0
    for item in request.scans:
        try:
            scan = BatchSyncItem(**item) if isinstance(item, dict) else item

            # Tandai tiket sebagai used (skip jika sudah) — dengan row lock
            ticket = (
                db.query(models.Ticket)
                .filter(models.Ticket.id == scan.ticket_id)
                .with_for_update()
                .first()
            )
            if ticket and not ticket.is_used:
                ticket.is_used = True
                ticket.used_at = datetime.now(timezone.utc)

            # Buat scan log (audit trail)
            scanned_at_dt = None
            if scan.scanned_at:
                try:
                    scanned_at_dt = datetime.fromisoformat(scan.scanned_at.replace('Z', '+00:00'))
                except Exception:
                    scanned_at_dt = datetime.now(timezone.utc)
            else:
                scanned_at_dt = datetime.now(timezone.utc)

            log = models.ScanLog(
                ticket_id=scan.ticket_id,
                event_id=scan.event_id,
                gate_id=scan.gate_id,
                ticket_type=scan.ticket_type,
                scanned_at=scanned_at_dt,
            )
            db.add(log)
            synced += 1
        except Exception:
            skipped += 1

    db.commit()
    return {
        "message": f"Batch sync selesai: {synced} berhasil, {skipped} dilewati.",
        "synced": synced,
        "skipped": skipped,
    }

@app.get("/my_tickets")
def get_my_tickets(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Mengembalikan semua tiket milik user beserta ticket_secret dan ticket_type.
    Berguna sebagai mekanisme recovery jika AsyncStorage client terhapus.

    [SECURITY] BOLA: user hanya bisa melihat tiket miliknya sendiri.
    """
    # Ownership check
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Anda hanya dapat melihat tiket sendiri",
        )

    tickets = db.query(models.Ticket).filter(models.Ticket.user_id == user_id).all()
    result = []
    for ticket in tickets:
        event = db.query(models.Event).filter(models.Event.id == ticket.event_id).first()
        secret = generate_ticket_secret(current_user.master_secret_key, ticket.id)
        message_to_sign = f"{ticket.id}:{ticket.event_id}"
        signature = PRIVATE_KEY.sign(
            message_to_sign.encode('utf-8'),
            hashfunc=hashlib.sha256
        ).hex()
        result.append({
            "ticket_id": ticket.id,
            "event_id": ticket.event_id,
            "ticket_type": ticket.ticket_type.value if ticket.ticket_type else "regular",
            "event_name": event.name if event else "Unknown Event",
            "event_date": event.date if event else "—",
            "event_location": event.location if event else None,
            "ticket_secret": secret,
            "signature": signature,
            "is_used": ticket.is_used,
        })
    return result

@app.get("/events/{event_id}/scan_window")
def get_scan_window(event_id: int, db: Session = Depends(database.get_db)):
    """
    Mengecek apakah sekarang sudah masuk jendela waktu scan untuk sebuah event.

    Aturan bisnis:
    - Scan diperbolehkan mulai dari 1 jam SEBELUM waktu mulai event.
    - Scan tidak diperbolehkan jika hari acara sudah lewat (expired).
    - Jika field 'time' event kosong, asumsi mulai 00:00 (awal hari).

    Response:
      {
        "can_scan": bool,         // True jika sekarang dalam jendela scan
        "reason": str,            // Penjelasan jika can_scan False
        "event_date": str,        // Tanggal event (YYYY-MM-DD)
        "event_time": str | null, // Waktu mulai event
        "scan_opens_at": str,     // Waktu kapan scan mulai dibuka (ISO string)
        "now_utc": str            // Waktu server sekarang (ISO, untuk debug)
      }
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Parse waktu event. Format time di DB: "HH:MM WIB" atau "HH:MM"
    time_str = event.time or "00:00"
    # Ambil hanya bagian HH:MM (buang label zona jika ada)
    time_part = re.split(r'\s+', time_str.strip())[0]
    try:
        hour, minute = map(int, time_part.split(':'))
    except Exception:
        hour, minute = 0, 0

    # Bangun datetime event dalam UTC+7 (WIB), lalu ubah ke UTC untuk perbandingan
    # Catatan: karena server bisa di timezone berbeda, kita pakai UTC naive untuk kesederhanaan
    try:
        event_date_obj = datetime.strptime(event.date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=500, detail="Format tanggal event di database tidak valid")

    wib_offset = timedelta(hours=7)
    # Datetime event dalam WIB (naive) → konversi ke UTC
    event_datetime_wib = datetime(
        event_date_obj.year, event_date_obj.month, event_date_obj.day,
        hour, minute, 0
    )
    event_datetime_utc = event_datetime_wib - wib_offset

    # Jendela scan: mulai 1 jam sebelum event
    scan_opens_utc = event_datetime_utc - timedelta(hours=1)

    # Waktu sekarang UTC
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    # Event dianggap expired jika sudah lewat 1 hari setelah tanggal event
    event_expires_utc = event_datetime_utc + timedelta(hours=24)

    now_str = now_utc.isoformat(timespec='seconds') + 'Z'
    scan_opens_str = (scan_opens_utc + wib_offset).isoformat(timespec='seconds') + ' WIB'

    if now_utc > event_expires_utc:
        return {
            "can_scan": False,
            "reason": f"Acara '{event.name}' pada {event.date} telah selesai dan tiket sudah kedaluwarsa.",
            "event_date": event.date,
            "event_time": event.time,
            "scan_opens_at": scan_opens_str,
            "now_utc": now_str,
        }

    if now_utc < scan_opens_utc:
        delta = scan_opens_utc - now_utc
        hours_left = int(delta.total_seconds() // 3600)
        minutes_left = int((delta.total_seconds() % 3600) // 60)
        return {
            "can_scan": False,
            "reason": (
                f"Pemindaian tiket belum dibuka. Scan dibuka 1 jam sebelum acara mulai "
                f"({scan_opens_str}). Sisa waktu: {hours_left} jam {minutes_left} menit."
            ),
            "event_date": event.date,
            "event_time": event.time,
            "scan_opens_at": scan_opens_str,
            "now_utc": now_str,
        }

    return {
        "can_scan": True,
        "reason": "Jendela pemindaian aktif.",
        "event_date": event.date,
        "event_time": event.time,
        "scan_opens_at": scan_opens_str,
        "now_utc": now_str,
    }


@app.get("/admin/tickets")
def get_tickets_for_admin(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):

    """
    Mengembalikan semua data tiket beserta ticket_secret untuk sync offline ke scanner admin.
    Memungkinkan scanner beroperasi tanpa internet.

    [SECURITY] RBAC: Hanya admin yang boleh mengakses data tiket lengkap.
    """
    tickets = db.query(models.Ticket).all()
    result = []
    for ticket in tickets:
        user = db.query(models.User).filter(models.User.id == ticket.user_id).first()
        if not user:
            continue
        secret = generate_ticket_secret(user.master_secret_key, ticket.id)
        result.append({
            "ticket_id": ticket.id,
            "event_id": ticket.event_id,
            "ticket_type": ticket.ticket_type.value if ticket.ticket_type else "regular",
            "ticket_secret": secret,
            "is_used": ticket.is_used,
        })
    return result


# =============================================
# Endpoints — Events
# =============================================

@app.get("/events")
def get_events(db: Session = Depends(database.get_db)):
    """Mengembalikan daftar semua event dengan detail lengkap termasuk sisa kuota per tipe."""
    events = db.query(models.Event).all()
    result = []
    for e in events:
        # Hitung tiket terjual per tipe untuk event ini
        def sold(ttype: str) -> int:
            return db.query(models.Ticket).filter(
                models.Ticket.event_id == e.id,
                models.Ticket.ticket_type == ttype,
            ).count()
        sold_reg = sold("regular")
        sold_sil = sold("silver")
        sold_gld = sold("gold")
        sold_vip = sold("vip")

        result.append({
            "id": e.id,
            "name": e.name,
            "date": e.date,
            "location": e.location,
            "time": e.time,
            # Kuota total per tipe
            "quota_regular": e.quota_regular,
            "quota_silver":  e.quota_silver,
            "quota_gold":    e.quota_gold,
            "quota_vip":     e.quota_vip,
            # Sisa kuota (tersedia) — digunakan di UI penonton
            "remaining_regular": max(0, e.quota_regular - sold_reg),
            "remaining_silver":  max(0, e.quota_silver  - sold_sil),
            "remaining_gold":    max(0, e.quota_gold    - sold_gld),
            "remaining_vip":     max(0, e.quota_vip     - sold_vip),
        })
    return result


@app.post("/events")
def create_event(
    event: EventCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    Membuat event baru.
    Validasi input dilakukan via Pydantic validator:
    - Nama minimal 8 karakter
    - Tanggal format YYYY-MM-DD, nilai valid (bukan bulan 13 dll.), tidak di masa lalu
    - Lokasi wajib, minimal 8 karakter
    - Waktu format HH:MM, jam dan menit integer valid
    """
    db_event = models.Event(
        name=event.name,
        date=event.date,
        location=event.location,
        time=event.time,
        quota_regular=event.quota_regular,
        quota_silver=event.quota_silver,
        quota_gold=event.quota_gold,
        quota_vip=event.quota_vip,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return {
        "id": db_event.id,
        "name": db_event.name,
        "date": db_event.date,
        "location": db_event.location,
        "time": db_event.time,
        "quota_regular": db_event.quota_regular,
        "quota_silver": db_event.quota_silver,
        "quota_gold": db_event.quota_gold,
        "quota_vip": db_event.quota_vip,
    }


# =============================================
# Endpoints — Gates
# =============================================

@app.get("/gates")
def get_gates(db: Session = Depends(database.get_db)):
    """
    Mengembalikan daftar semua gerbang dengan informasi tipe dan huruf.
    Digunakan oleh scanner admin untuk memilih gate sebelum broadcast BLE.
    """
    gates = db.query(models.Gate).all()
    return [
        {"id": g.id, "name": g.name, "gate_type": g.gate_type, "letter": g.letter}
        for g in gates
    ]

@app.get("/gates/{gate_type}")
def get_gates_by_type(gate_type: str, db: Session = Depends(database.get_db)):
    """
    Mengembalikan daftar gerbang untuk tipe tertentu.
    Digunakan client untuk menampilkan hanya gate yang relevan dengan tipe tiket.
    """
    gates = db.query(models.Gate).filter(models.Gate.gate_type == gate_type).all()
    return [
        {"id": g.id, "name": g.name, "gate_type": g.gate_type, "letter": g.letter}
        for g in gates
    ]


# =============================================
# Endpoints — Statistics & Scan Log
# =============================================

@app.get("/stats")
def get_stats(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    Statistik agregat dan detail per-event untuk dashboard admin.
    Termasuk breakdown per tipe tiket untuk analisis antusiasme.
    """
    total_sold = db.query(models.Ticket).count()
    total_used = db.query(models.Ticket).filter(models.Ticket.is_used == True).count()  # noqa: E712
    total_events = db.query(models.Event).count()

    events = db.query(models.Event).all()
    event_details = []
    for event in events:
        tickets_q = db.query(models.Ticket).filter(models.Ticket.event_id == event.id)
        sold = tickets_q.count()
        used = tickets_q.filter(models.Ticket.is_used == True).count()  # noqa: E712

        # Breakdown per tipe tiket untuk analisis antusiasme
        sold_regular = tickets_q.filter(models.Ticket.ticket_type == models.TicketTypeEnum.regular).count()
        sold_silver  = tickets_q.filter(models.Ticket.ticket_type == models.TicketTypeEnum.silver).count()
        sold_gold    = tickets_q.filter(models.Ticket.ticket_type == models.TicketTypeEnum.gold).count()
        sold_vip     = tickets_q.filter(models.Ticket.ticket_type == models.TicketTypeEnum.vip).count()

        event_details.append({
            "id": event.id,
            "name": event.name,
            "date": event.date,
            "location": event.location,
            "time": event.time,
            "quota_regular": event.quota_regular,
            "quota_silver": event.quota_silver,
            "quota_gold": event.quota_gold,
            "quota_vip": event.quota_vip,
            "total_sold": sold,
            "total_used": used,
            "total_active": sold - used,
            "sold_regular": sold_regular,
            "sold_silver": sold_silver,
            "sold_gold": sold_gold,
            "sold_vip": sold_vip,
        })

    return {
        "total_sold": total_sold,
        "total_used": total_used,
        "total_active": total_sold - total_used,
        "total_events": total_events,
        "events": event_details,
    }

@app.post("/scan_log")
def create_scan_log(
    request: ScanLogRequest,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    Mencatat log pemindaian yang berhasil untuk audit trail penyelenggara.

    CATATAN PRIVASI: Endpoint ini TIDAK menyimpan data identitas penonton
    (tidak ada username, tidak ada user_id). Hanya data yang relevan untuk
    analisis antusiasme: ticket_id (anonim), tipe tiket, gate, dan waktu masuk.
    """
    log = models.ScanLog(
        ticket_id=request.ticket_id,
        event_id=request.event_id,
        gate_id=request.gate_id,
        ticket_type=request.ticket_type,
        scanned_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    return {"message": "Scan log recorded", "log_id": log.id}

@app.get("/scan_history")
def get_scan_history(
    event_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    """
    Mengembalikan histori pemindaian untuk event tertentu.
    Diurutkan dari yang terbaru. Tidak mengandung data pribadi penonton.
    """
    logs = (
        db.query(models.ScanLog)
        .filter(models.ScanLog.event_id == event_id)
        .order_by(models.ScanLog.scanned_at.desc())
        .all()
    )
    return [
        {
            "log_id": log.id,
            "ticket_id": log.ticket_id,
            "gate_id": log.gate_id,
            "ticket_type": log.ticket_type,
            "scanned_at": log.scanned_at.isoformat() if log.scanned_at else None,
        }
        for log in logs
    ]
