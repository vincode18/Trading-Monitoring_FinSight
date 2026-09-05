"""
Entry point backend API — AI Trading Dashboard (Tahap 2).

Cara jalankan (development):
    uvicorn app.main:app --reload --port 8000

Dokumentasi API otomatis tersedia di:
    http://localhost:8000/docs      (Swagger UI)
    http://localhost:8000/redoc     (ReDoc)
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chart, market, news
from app.config.settings import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="REST API untuk data pasar, grafik teknikal, dan berita — dikonsumsi oleh frontend Next.js.",
    version="2.0.0",
)

# CORS: izinkan frontend (Next.js, biasanya port 3000) mengakses API ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router)
app.include_router(chart.router)
app.include_router(news.router)


@app.get("/api/health", tags=["health"])
def health_check():
    """Endpoint sederhana untuk cek backend hidup (dipakai monitoring/uptime check)."""
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
