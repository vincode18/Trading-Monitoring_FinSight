"""Endpoint API untuk berita terkait simbol."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.schemas import NewsItemResponse
from app.services.news_data import get_news_for_symbol

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/{symbol}", response_model=list[NewsItemResponse])
def get_news(symbol: str):
    """Ambil daftar berita terkait satu simbol."""
    items = get_news_for_symbol(symbol.upper())
    return [NewsItemResponse(**item.to_dict()) for item in items]
