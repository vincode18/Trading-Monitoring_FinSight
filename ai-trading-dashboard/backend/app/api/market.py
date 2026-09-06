"""Endpoint API terkait data pasar: quote snapshot, watchlist, pencarian simbol."""
from typing import List

from fastapi import APIRouter, HTTPException, Query, Request

from app.api.schemas import (
    MarketSummaryResponse,
    QuoteSnapshotResponse,
    SymbolSearchResult,
    WatchlistRequest,
)
from app.core.rate_limit import DEFAULT_LIMIT, limiter
from app.services.market_data import (
    get_history,
    get_multiple_snapshots,
    get_quote_snapshot,
    search_symbol,
)

router = APIRouter(prefix="/api/market", tags=["market"])

OVERVIEW_SYMBOLS = ["^GSPC", "^DJI", "^IXIC", "BTC-USD"]
CRYPTO_SUMMARY_SYMBOLS = ["BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD"]


@router.get("/quote/{symbol}", response_model=QuoteSnapshotResponse)
def get_quote(symbol: str):
    """Ambil snapshot harga terkini untuk satu simbol."""
    snapshot = get_quote_snapshot(symbol.upper())
    if snapshot.last_price is None:
        raise HTTPException(status_code=404, detail=f"Data tidak ditemukan untuk simbol '{symbol}'")
    return QuoteSnapshotResponse(**snapshot.to_dict())


@router.post("/watchlist", response_model=List[QuoteSnapshotResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_watchlist_quotes(request: Request, payload: WatchlistRequest):
    """Ambil snapshot harga untuk banyak simbol sekaligus (dipakai tabel watchlist)."""
    if not payload.symbols:
        return []
    symbols = [s.upper() for s in payload.symbols]
    snapshots = get_multiple_snapshots(symbols)
    return [QuoteSnapshotResponse(**s.to_dict()) for s in snapshots]


@router.get("/search", response_model=List[SymbolSearchResult])
@limiter.limit(DEFAULT_LIMIT)
def search(
    request: Request,
    q: str = Query(..., min_length=1, description="Kata kunci pencarian simbol/nama"),
):
    """Cari simbol saham/crypto/index berdasarkan nama atau ticker."""
    results = search_symbol(q)
    return [SymbolSearchResult(**r) for r in results]


@router.get("/overview", response_model=List[QuoteSnapshotResponse])
def get_market_overview():
    """Snapshot indeks global + BTC untuk ticker bar dashboard."""
    snapshots = get_multiple_snapshots(OVERVIEW_SYMBOLS)
    return [QuoteSnapshotResponse(**s.to_dict()) for s in snapshots]


@router.post("/top-gainers", response_model=List[QuoteSnapshotResponse])
def get_top_gainers(
    payload: WatchlistRequest,
    limit: int = Query(5, ge=1, le=50, description="Jumlah top gainer yang dikembalikan"),
):
    """Urutkan simbol dari body watchlist berdasarkan change_pct descending."""
    if not payload.symbols:
        return []
    symbols = [s.upper() for s in payload.symbols]
    snapshots = get_multiple_snapshots(symbols)
    ranked = sorted(
        snapshots,
        key=lambda s: s.change_pct if s.change_pct is not None else float("-inf"),
        reverse=True,
    )
    return [QuoteSnapshotResponse(**s.to_dict()) for s in ranked[:limit]]


@router.get("/summary", response_model=MarketSummaryResponse)
def get_market_summary():
    """
    Ringkasan agregat crypto utama: total market cap, estimasi volume 24h, BTC dominance.
    Jika market_cap tidak tersedia dari yfinance, field terkait dikembalikan null.
    """
    snapshots = get_multiple_snapshots(CRYPTO_SUMMARY_SYMBOLS)
    caps = [s.market_cap for s in snapshots if s.market_cap is not None]
    total_market_cap = sum(caps) if caps else None

    btc_cap = next((s.market_cap for s in snapshots if s.symbol == "BTC-USD"), None)
    btc_dominance = None
    if btc_cap is not None and total_market_cap and total_market_cap > 0:
        btc_dominance = round((btc_cap / total_market_cap) * 100, 4)

    total_volume = 0.0
    volume_found = False
    for symbol in CRYPTO_SUMMARY_SYMBOLS:
        try:
            hist = get_history(symbol, period="5d", interval="1d")
            if hist is not None and not hist.empty and "Volume" in hist.columns:
                vol = hist["Volume"].iloc[-1]
                if vol is not None and float(vol) == float(vol):  # not NaN
                    total_volume += float(vol)
                    volume_found = True
        except Exception:
            continue

    return MarketSummaryResponse(
        total_market_cap=total_market_cap,
        total_volume_24h=total_volume if volume_found else None,
        btc_dominance=btc_dominance,
        symbols=list(CRYPTO_SUMMARY_SYMBOLS),
    )


@router.get("/fear-greed")
def get_fear_greed():
    """Placeholder Fear & Greed — belum terhubung ke sumber data pihak ketiga."""
    return {"value": None, "label": "Coming Soon", "source": "placeholder"}
