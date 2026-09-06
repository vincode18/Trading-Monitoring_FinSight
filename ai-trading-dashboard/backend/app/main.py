"""
Entry point backend API — AI Trading Dashboard (Tahap 2).

Cara jalankan (development):
    uvicorn app.main:app --reload --port 8000

Dokumentasi API otomatis tersedia di:
    http://localhost:8000/docs      (Swagger UI)
    http://localhost:8000/redoc     (ReDoc)
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import analysis, auth, chart, market, news, user_watchlist
from app.config.settings import settings
from app.core.db import connect_db, disconnect_db
from app.core.rate_limit import limiter


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Buka koneksi DB saat start; tutup rapi saat shutdown."""
    if settings.DATABASE_URL:
        try:
            await connect_db()
        except Exception as exc:
            # Backend tetap bisa jalan untuk market/chart/news meski DB belum siap
            print(f"[db] gagal connect: {exc}")
    yield
    try:
        await disconnect_db()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    description="REST API untuk data pasar, grafik teknikal, dan berita — dikonsumsi oleh frontend Next.js.",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS ketat: hanya method & header yang dipakai frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(user_watchlist.router)
app.include_router(market.router)
app.include_router(chart.router)
app.include_router(news.router)
app.include_router(analysis.router)


@app.get("/api/health", tags=["health"])
def health_check():
    """Endpoint sederhana untuk cek backend hidup (dipakai monitoring/uptime check)."""
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
