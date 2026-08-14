"""
models.py — Definisi Model Database SQLAlchemy

Arsitektur hierarki kunci (KDF):
  User.master_secret_key  (root, di-generate server saat /register)
      └── ticket_secret = HMAC-SHA256(master_secret_key, ticket_id)  (per tiket, di-generate /buy_ticket)
              └── gate_secret = HMAC-SHA256(ticket_secret, gate_id)  (per gerbang, di-derive client)

Tanda tangan ECDSA di-generate server saat /buy_ticket:
  signature = ECDSA_sign(private_key, "ticket_id:event_id")
"""

import os
import binascii
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from enum import Enum
import database


class RoleEnum(str, Enum):
    """Role pengguna menentukan akses fitur: user = penonton, admin = penyelenggara."""
    user = "user"
    admin = "admin"


class TicketTypeEnum(str, Enum):
    """
    Tipe tiket yang dapat dibeli penonton — menentukan gerbang mana yang bisa diakses.
    Regular → gate regular_a / regular_b / regular_c
    Silver  → gate silver_a / silver_b / silver_c
    Gold    → gate gold_a / gold_b / gold_c
    VIP     → gate vip_a / vip_b / vip_c
    """
    regular = "regular"
    silver = "silver"
    gold = "gold"
    vip = "vip"


class User(database.Base):
    """
    Model pengguna aplikasi.

    Kolom penting untuk sistem keamanan:
    - master_secret_key: ROOT dari seluruh hierarki kunci (KDF).
      Di-generate secara acak saat /register dan TIDAK PERNAH dikirim ke client.
      Digunakan server untuk men-derive ticket_secret setiap kali tiket dibeli.

    Kolom demografis (tidak masuk ke QR):
    - origin: Asal daerah penonton — hanya untuk analisis antusiasme event,
      sama sekali tidak diikutsertakan ke dalam kode QR (data minimization).
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)                      # Hash bcrypt dari password
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.user)
    master_secret_key = Column(String)                  # [KRITIS] Root KDF — 32 bytes random hex
    origin = Column(String, nullable=True)              # Asal daerah penonton (opsional, untuk analisis demografis)

    tickets = relationship("Ticket", back_populates="user")


class Event(database.Base):
    """
    Model acara/konser yang tiketnya dapat dibeli.

    Kolom kuota mengontrol berapa tiket per tipe yang tersedia.
    Kolom location dan time ditampilkan ke penonton saat memilih event.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)           # Nama acara, mis. "Konser Noah"
    date = Column(String)                       # Tanggal acara (format: YYYY-MM-DD)
    location = Column(String, nullable=True)    # Lokasi venue, mis. "GBK Jakarta"
    time = Column(String, nullable=True)        # Waktu mulai, mis. "19:00 WIB"
    quota_regular = Column(Integer, default=100)  # Kuota tiket Regular
    quota_silver = Column(Integer, default=50)    # Kuota tiket Silver
    quota_gold = Column(Integer, default=30)      # Kuota tiket Gold
    quota_vip = Column(Integer, default=20)       # Kuota tiket VIP

    tickets = relationship("Ticket", back_populates="event")
    scan_logs = relationship("ScanLog", back_populates="event")


class Ticket(database.Base):
    """
    Model tiket yang dimiliki pengguna untuk suatu acara.

    Kolom keamanan:
    - is_used: Digunakan oleh anti-double spending sisi server.
      Saat tiket di-scan dan valid, /use_ticket dipanggil untuk menandai ini.
    - used_at: Timestamp validasi pertama (untuk audit log).

    Kolom tipe:
    - ticket_type: Tipe tiket (regular/silver/gold/vip) yang menentukan
      gerbang mana yang dapat diakses penonton.

    Catatan: ticket_secret TIDAK disimpan di kolom ini.
    Ia di-derive ulang on-demand dari master_secret_key + ticket_id.
    """
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    ticket_type = Column(SQLEnum(TicketTypeEnum), default=TicketTypeEnum.regular)  # Tipe tiket yang dibeli
    is_used = Column(Boolean, default=False, nullable=False)  # Anti-double spending: false = belum dipakai
    used_at = Column(DateTime, nullable=True)                  # Timestamp penggunaan pertama

    user = relationship("User", back_populates="tickets")
    event = relationship("Event", back_populates="tickets")


class Gate(database.Base):
    """
    Model gerbang masuk fisik pada venue acara.

    Format gate ID: {type}_{letter} — misal: regular_a, regular_b, vip_a
    gate_id ini digunakan sebagai input HMAC derivasi gate_secret di sisi client:
      gate_secret = HMAC(ticket_secret, gate_id)

    Kolom gate_type menentukan tipe tiket mana yang boleh masuk gerbang ini.
    Misal gate_type='regular' berarti hanya tiket tipe 'regular' yang boleh akses.
    """
    __tablename__ = "gates"

    id = Column(String, primary_key=True)        # e.g. "regular_a" — digunakan dalam KDF
    name = Column(String)                        # e.g. "Regular A" — nama tampilan
    gate_type = Column(String)                   # e.g. "regular" — tipe tiket yang diizinkan
    letter = Column(String)                      # e.g. "A" — huruf gerbang dalam tipe yang sama


class ScanLog(database.Base):
    """
    Model log pemindaian tiket yang berhasil — catatan audit untuk admin/penyelenggara.

    CATATAN PRIVASI: Sesuai prinsip data minimization TA ini,
    kolom ini TIDAK menyimpan nama atau informasi identitas pribadi penonton.
    Hanya menyimpan data yang relevan untuk analisis antusiasme event:
    - ticket_id: ID tiket (anonim, tidak langsung mengungkap identitas)
    - ticket_type: Tipe tiket (regular/silver/gold/vip) — untuk segmentasi
    - gate_id: Gerbang yang dimasuki — untuk analisis pola distribusi masuk
    - scanned_at: Waktu masuk — untuk analisis distribusi waktu antusiasme
    - event_id: Event yang berkaitan
    """
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    gate_id = Column(String)                              # Gate yang digunakan, e.g. "regular_a"
    ticket_type = Column(String)                          # Tipe tiket — regular/silver/gold/vip
    scanned_at = Column(DateTime, default=datetime.utcnow)  # Waktu pemindaian (UTC)
    # Catatan: TIDAK ada user_id atau username — prinsip data minimization

    event = relationship("Event", back_populates="scan_logs")


def generate_master_secret() -> str:
    """
    Generate master_secret_key acak 32 byte (output: 64 karakter hex).
    Dipanggil satu kali saat user registrasi — ini adalah root dari seluruh hierarki kunci.
    Secara kriptografis, keamanan seluruh sistem bergantung pada keacakan nilai ini.
    """
    return binascii.hexlify(os.urandom(32)).decode()
