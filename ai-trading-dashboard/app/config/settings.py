"""
Konfigurasi terpusat aplikasi.
Semua modul lain HARUS mengambil config dari sini, jangan baca os.environ langsung
di banyak tempat — supaya gampang diaudit saat pindah ke Tahap 2/3.
"""
import os
from dotenv import load_dotenv

load_dotenv()  # baca file .env kalau ada


def _get_list(key: str, default: str) -> list[str]:
    raw = os.getenv(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    # --- Umum ---
    APP_ENV: str = os.getenv("APP_ENV", "local")
    APP_NAME: str = "AI Trading Dashboard"

    # --- Tahap 1: Data & Cache ---
    DEFAULT_WATCHLIST: list[str] = _get_list(
        "DEFAULT_WATCHLIST", "BBCA.JK,BBRI.JK,TLKM.JK,AAPL,MSFT,BTC-USD"
    )
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
    NEWS_MAX_ITEMS: int = int(os.getenv("NEWS_MAX_ITEMS", "8"))

    # --- Tahap 2 (disiapkan, belum dipakai) ---
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    JWT_SECRET_KEY: str | None = os.getenv("JWT_SECRET_KEY")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

    # --- Tahap 3 (disiapkan, belum dipakai) ---
    MIDTRANS_SERVER_KEY: str | None = os.getenv("MIDTRANS_SERVER_KEY")
    MIDTRANS_CLIENT_KEY: str | None = os.getenv("MIDTRANS_CLIENT_KEY")
    MIDTRANS_IS_PRODUCTION: bool = os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"
    BANK_TRANSFER_ACCOUNT_NAME: str | None = os.getenv("BANK_TRANSFER_ACCOUNT_NAME")
    BANK_TRANSFER_ACCOUNT_NUMBER: str | None = os.getenv("BANK_TRANSFER_ACCOUNT_NUMBER")
    BANK_TRANSFER_BANK_NAME: str | None = os.getenv("BANK_TRANSFER_BANK_NAME")


settings = Settings()
