"""Konfigurasi terpusat backend. Sama prinsipnya dengan versi Streamlit —
semua modul lain ambil config dari sini, bukan os.environ langsung."""
import os
from dotenv import load_dotenv

load_dotenv()


def _get_list(key: str, default: str) -> list[str]:
    raw = os.getenv(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "local")
    APP_NAME: str = "AI Trading Dashboard API"

    # CORS — origin frontend yang diizinkan akses API ini
    CORS_ORIGINS: list[str] = _get_list("CORS_ORIGINS", "http://localhost:3000")

    DEFAULT_WATCHLIST: list[str] = _get_list(
        "DEFAULT_WATCHLIST", "BBCA.JK,BBRI.JK,TLKM.JK,AAPL,MSFT,BTC-USD"
    )
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
    NEWS_MAX_ITEMS: int = int(os.getenv("NEWS_MAX_ITEMS", "8"))

    # Database (Supabase + Prisma) — lihat Enhancement-system-setup_DatabaseSupabase.md
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    DIRECT_URL: str | None = os.getenv("DIRECT_URL") or os.getenv("DIRECT_DATABASE_URL")

    JWT_SECRET_KEY: str | None = os.getenv("JWT_SECRET_KEY")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))


settings = Settings()
