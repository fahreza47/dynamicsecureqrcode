"""
auth.py — Modul Autentikasi dan Otorisasi JWT

Modul ini mengimplementasikan:
  1. JWT Access Token: Dibuat saat login, wajib disertakan di header Authorization
     pada setiap request selanjutnya.
  2. Dependency get_current_user(): Memvalidasi token dan mengembalikan objek User.
  3. Dependency require_role(): Memastikan user memiliki role yang sesuai (RBAC).

Referensi keamanan:
  - OWASP API2:2023 — Broken Authentication
  - OWASP API5:2023 — Broken Function Level Authorization
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

import database
import models

# =============================================
# Konfigurasi JWT
# =============================================

# Secret key untuk menandatangani JWT — di produksi, ambil dari environment variable
# Jika tidak ada di .env, generate random string (akan berubah setiap restart server,
# sehingga semua token lama menjadi invalid — ini acceptable untuk MVP TA)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.urandom(32).hex())

# Algoritma signing JWT — HS256 (HMAC-SHA256) standar dan cukup untuk MVP
JWT_ALGORITHM = "HS256"

# Durasi token berlaku: 7 hari (cukup lama untuk demo/sidang TA,
# di produksi biasanya 15-60 menit + refresh token)
ACCESS_TOKEN_EXPIRE_DAYS = 7

# OAuth2 scheme — FastAPI akan otomatis mencari header "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# =============================================
# Fungsi Pembuatan Token
# =============================================

def create_access_token(user_id: int, username: str, role: str) -> str:
    """
    Membuat JWT access token berisi identitas user.

    Payload (claims):
      - sub: user_id (subject — siapa pemilik token ini)
      - username: untuk display di client tanpa query tambahan
      - role: "user" atau "admin" — digunakan untuk RBAC
      - exp: waktu kedaluwarsa token (UTC)

    Token ini ditandatangani dengan JWT_SECRET_KEY menggunakan HS256.
    Hanya server yang memiliki secret key bisa memvalidasi token.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


# =============================================
# Dependency: Autentikasi (siapa kamu?)
# =============================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    """
    [SECURITY] Dependency untuk memvalidasi JWT dan mengembalikan objek User.

    Proses:
    1. Decode JWT token dari header Authorization
    2. Ekstrak user_id dari claim "sub"
    3. Query database untuk mendapatkan objek User lengkap
    4. Jika token invalid/expired/user tidak ditemukan → 401 Unauthorized

    Setiap endpoint yang membutuhkan autentikasi harus menyertakan:
      current_user: models.User = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


# =============================================
# Dependency: Otorisasi Role (boleh ngapain?)
# =============================================

def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    [SECURITY] Dependency RBAC — hanya mengizinkan user dengan role 'admin'.

    Mengatasi OWASP API5:2023 (Broken Function Level Authorization):
    Endpoint administratif seperti /admin/tickets, /stats, /reset_tickets
    harus dilindungi oleh pengecekan role di sisi server, bukan hanya
    "menyembunyikan tombol" di APK.

    Penggunaan:
      current_user: models.User = Depends(require_admin)
    """
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: hanya admin yang diizinkan",
        )
    return current_user
