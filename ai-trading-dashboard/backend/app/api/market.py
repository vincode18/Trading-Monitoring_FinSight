"""Endpoint API terkait data pasar: quote snapshot, watchlist, pencarian simbol."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.api.schemas import QuoteSnapshotResponse, SymbolSearchResult, WatchlistRequest
from app.services.market_data import get_multiple_snapshots, get_quote_snapshot, search_symbol

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/quote/{symbol}", response_model=QuoteSnapshotResponse)
def get_quote(symbol: str):
    """Ambil snapshot harga terkini untuk satu simbol."""
    snapshot = get_quote_snapshot(symbol.upper())
    if snapshot.last_price is None:
        raise HTTPException(status_code=404, detail=f"Data tidak ditemukan untuk simbol '{symbol}'")
    return QuoteSnapshotResponse(**snapshot.to_dict())


@router.post("/watchlist", response_model=list[QuoteSnapshotResponse])
def get_watchlist_quotes(payload: WatchlistRequest):
    """Ambil snapshot harga untuk banyak simbol sekaligus (dipakai tabel watchlist)."""
    if not payload.symbols:
        return []
    symbols = [s.upper() for s in payload.symbols]
    snapshots = get_multiple_snapshots(symbols)
    return [QuoteSnapshotResponse(**s.to_dict()) for s in snapshots]


@router.get("/search", response_model=list[SymbolSearchResult])
def search(q: str = Query(..., min_length=1, description="Kata kunci pencarian simbol/nama")):
    """Cari simbol saham/crypto/index berdasarkan nama atau ticker."""
    results = search_symbol(q)
    return [SymbolSearchResult(**r) for r in results]
