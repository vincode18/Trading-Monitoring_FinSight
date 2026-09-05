"""
Prisma Client singleton untuk koneksi ke Supabase PostgreSQL.

Dipakai via lifespan FastAPI (lihat app/main.py):
  - connect_db() saat aplikasi start
  - disconnect_db() saat aplikasi stop
"""
from __future__ import annotations

from prisma import Prisma

db = Prisma()


async def connect_db() -> None:
    if not db.is_connected():
        await db.connect()


async def disconnect_db() -> None:
    if db.is_connected():
        await db.disconnect()
