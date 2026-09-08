"""
Seed sample users (System Admin, Admin, Member).

Idempotent: skip jika email sudah ada.
Lihat Environment/Users.md untuk kredensial & matriks role.

Usage:
    cd backend
    python scripts/seed_users.py
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

# Session pooler (5432) menghindari error prepared statement di transaction pooler
direct = os.getenv("DIRECT_URL")
if direct:
    os.environ["DATABASE_URL"] = direct

import bcrypt
from prisma import Prisma
from prisma.enums import Role


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


SAMPLES = [
    {
        "email": "sysadmin@tradingmonitor.local",
        "name": "System Admin",
        "password": "SysAdmin@2026",
        "role": Role.SYSTEM_ADMIN,
    },
    {
        "email": "admin@tradingmonitor.local",
        "name": "Platform Admin",
        "password": "Admin@2026",
        "role": Role.ADMIN,
    },
    {
        "email": "member@tradingmonitor.local",
        "name": "Demo Member",
        "password": "Member@2026",
        "role": Role.MEMBER,
    },
]


async def main() -> None:
    db = Prisma()
    await db.connect()
    try:
        for row in SAMPLES:
            existing = await db.user.find_unique(where={"email": row["email"]})
            if existing:
                print(f"skip  {row['email']} (already exists, role={existing.role})")
                continue
            user = await db.user.create(
                data={
                    "email": row["email"],
                    "name": row["name"],
                    "passwordHash": hash_password(row["password"]),
                    "role": row["role"],
                }
            )
            print(f"created {user.email} role={user.role} id={user.id}")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
