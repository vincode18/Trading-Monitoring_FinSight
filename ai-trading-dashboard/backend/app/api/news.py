"""Endpoint API untuk berita terkait simbol."""
from typing import List

from fastapi import APIRouter, Request

from app.api.schemas import NewsItemResponse
from app.core.rate_limit import DEFAULT_LIMIT, limiter
from app.services.news_data import get_news_for_symbol

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/{symbol}", response_model=List[NewsItemResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_news(request: Request, symbol: str):
    """Ambil daftar berita terkait satu simbol."""
    items = get_news_for_symbol(symbol.upper())
    return [NewsItemResponse(**item.to_dict()) for item in items]
