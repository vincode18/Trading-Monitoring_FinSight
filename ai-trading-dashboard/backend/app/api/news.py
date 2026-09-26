"""Endpoint API untuk berita terkait simbol + news per market (Dashboard v1.1)."""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Request

from app.api.schemas import NewsItemResponse
from app.config.sectors import SECTOR_BASKETS
from app.core.rate_limit import DEFAULT_LIMIT, limiter
from app.services.news_data import get_news_for_symbol

router = APIRouter(prefix="/api/news", tags=["news"])

# Index + representative names per market (align with frontend marketConfig.newsSymbols)
MARKET_NEWS_SYMBOLS: dict[str, list[str]] = {
    "us": ["^GSPC", "AAPL", "MSFT", "NVDA"],
    "indonesia": ["^JKSE", "BBCA.JK", "BBRI.JK"],
    "crypto": ["BTC-USD", "ETH-USD"],
}


@router.get("/market/{market}", response_model=List[NewsItemResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_market_news(request: Request, market: str, limit: int = 8):
    """
    Gabungan berita beberapa simbol representatif per market — dedupe judul + sort published_at.
    Endpoint per-simbol `/{symbol}` tetap untuk Chart/Analysis.
    """
    key = market.lower().strip()
    symbols = MARKET_NEWS_SYMBOLS.get(key)
    if not symbols:
        if key not in SECTOR_BASKETS:
            raise HTTPException(status_code=404, detail=f"Market '{market}' tidak dikenal")
        symbols = MARKET_NEWS_SYMBOLS.get("us", [])

    merged = []
    seen_titles: set[str] = set()
    for sym in symbols:
        for item in get_news_for_symbol(sym.upper()):
            title_key = (item.title or "").strip().lower()
            if not title_key or title_key in seen_titles:
                continue
            seen_titles.add(title_key)
            merged.append(item)

    merged.sort(
        key=lambda item: item.published_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return [NewsItemResponse(**item.to_dict()) for item in merged[:limit]]


@router.get("/{symbol}", response_model=List[NewsItemResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_news(request: Request, symbol: str):
    """Ambil daftar berita terkait satu simbol."""
    items = get_news_for_symbol(symbol.upper())
    return [NewsItemResponse(**item.to_dict()) for item in items]
