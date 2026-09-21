"""Endpoint API terkait data pasar: quote snapshot, watchlist, pencarian simbol, dashboard widgets."""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Request

from app.api.schemas import (
    EarningsCalendarResponse,
    MACrossAlertResponse,
    MarketSummaryResponse,
    QuoteSnapshotResponse,
    SectorPerformanceResponse,
    SentimentScoreResponse,
    SymbolSearchResult,
    VolumeMoverResponse,
    WatchlistRequest,
)
from app.config.sectors import SECTOR_BASKETS, mover_pool_for
from app.core.rate_limit import DEFAULT_LIMIT, limiter
from app.indicators.technical import (
    add_all_indicators,
    detect_ma_cross,
    sentiment_score,
    volume_ratio,
)
from app.indicators.technical import _safe_float
from app.services.market_data import (
    get_earnings_calendar_for_symbols,
    get_earnings_calendar_market_wide,
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
def get_market_overview(
    symbols: Optional[str] = Query(
        None,
        description="CSV simbol opsional; default OVERVIEW_SYMBOLS jika kosong",
    ),
):
    """Snapshot indeks untuk ticker bar — market-aware via query `symbols`."""
    if symbols and symbols.strip():
        sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    else:
        sym_list = list(OVERVIEW_SYMBOLS)
    snapshots = get_multiple_snapshots(sym_list)
    return [QuoteSnapshotResponse(**s.to_dict()) for s in snapshots]


@router.post("/top-gainers", response_model=List[QuoteSnapshotResponse])
def get_top_gainers(
    payload: WatchlistRequest,
    limit: int = Query(5, ge=1, le=50),
    order: str = Query("desc", description="desc = gainers, asc = losers"),
):
    """Urutkan simbol berdasarkan change_pct (desc=gainers, asc=losers)."""
    if not payload.symbols:
        return []
    symbols = [s.upper() for s in payload.symbols]
    snapshots = get_multiple_snapshots(symbols)
    descending = order.lower() != "asc"
    ranked = sorted(
        snapshots,
        key=lambda s: s.change_pct if s.change_pct is not None else (float("-inf") if descending else float("inf")),
        reverse=descending,
    )
    return [QuoteSnapshotResponse(**s.to_dict()) for s in ranked[:limit]]


@router.post("/volume-movers", response_model=List[VolumeMoverResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_volume_movers(
    request: Request,
    payload: WatchlistRequest,
    limit: int = Query(10, ge=1, le=50),
    min_ratio: float = Query(1.5, description="Filter rasio minimum (default 1.5x)"),
):
    if not payload.symbols:
        return []
    results: list[VolumeMoverResponse] = []
    quotes = {q.symbol: q for q in get_multiple_snapshots([s.upper() for s in payload.symbols])}
    for sym in [s.upper() for s in payload.symbols]:
        try:
            df = get_history(sym, period="3mo", interval="1d")
            ratio = volume_ratio(df)
            if ratio is None or ratio < min_ratio:
                continue
            q = quotes.get(sym)
            results.append(
                VolumeMoverResponse(
                    symbol=sym,
                    volume_ratio=round(ratio, 3),
                    last_price=q.last_price if q else None,
                    change_pct=q.change_pct if q else None,
                )
            )
        except Exception:
            continue
    results.sort(key=lambda r: r.volume_ratio, reverse=True)
    return results[:limit]


@router.get("/sentiment/{symbol}", response_model=SentimentScoreResponse)
@limiter.limit(DEFAULT_LIMIT)
def get_sentiment(request: Request, symbol: str):
    symbol = symbol.upper()
    df = get_history(symbol, period="1y", interval="1d")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"Data historis tidak tersedia untuk {symbol}")
    quote = get_quote_snapshot(symbol)
    result = sentiment_score(df, quote.last_price, quote.year_high, quote.year_low)
    return SentimentScoreResponse(symbol=symbol, **result)


@router.get("/sectors/{market}", response_model=SectorPerformanceResponse)
@limiter.limit(DEFAULT_LIMIT)
def get_sector_performance(request: Request, market: str):
    key = market.lower().strip()
    baskets = SECTOR_BASKETS.get(key)
    if not baskets:
        raise HTTPException(status_code=404, detail=f"Market '{market}' tidak dikenal")

    sectors = []
    for name, syms in baskets.items():
        snaps = get_multiple_snapshots(syms)
        pcts = [s.change_pct for s in snaps if s.change_pct is not None]
        avg = round(sum(pcts) / len(pcts), 4) if pcts else None
        sectors.append(
            {
                "name": name,
                "avg_change_pct": avg,
                "symbols": [s.symbol for s in snaps],
                "count": len(pcts),
            }
        )
    return SectorPerformanceResponse(market=key, sectors=sectors)


@router.post("/ma-cross-alerts", response_model=List[MACrossAlertResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_ma_cross_alerts(request: Request, payload: WatchlistRequest):
    if not payload.symbols:
        return []
    alerts: list[MACrossAlertResponse] = []
    for sym in [s.upper() for s in payload.symbols]:
        try:
            df = get_history(sym, period="6mo", interval="1d")
            if df is None or df.empty:
                continue
            ind = add_all_indicators(df)
            cross = detect_ma_cross(ind)
            if not cross:
                continue
            last = ind.iloc[-1]
            alerts.append(
                MACrossAlertResponse(
                    symbol=sym,
                    cross_type=cross,
                    ma20=_safe_float(last.get("MA20")),
                    ma50=_safe_float(last.get("MA50")),
                )
            )
        except Exception:
            continue
    return alerts


def _parse_date_param(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        try:
            return datetime.strptime(value[:10], "%Y-%m-%d")
        except Exception:
            return None


def _attach_watchlist(items: list[dict], watchlist: list[str] | None) -> list[EarningsCalendarResponse]:
    wl = {s.upper() for s in (watchlist or [])}
    out: list[EarningsCalendarResponse] = []
    for item in items:
        out.append(
            EarningsCalendarResponse(
                **{**item, "is_watchlist": item["symbol"].upper() in wl}
            )
        )
    return out


@router.get("/earnings-calendar", response_model=List[EarningsCalendarResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_earnings_calendar_by_market(
    request: Request,
    market: str = Query("us"),
    days_ahead: int = Query(7, ge=1, le=60),
    limit: int = Query(50, ge=1, le=100),
    only_unreported: bool = Query(True),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    watchlist: Optional[str] = Query(None, description="Comma-separated symbols for is_watchlist"),
):
    """
    Hybrid earnings calendar (PRD-S-002):
    - US: yfinance.Calendars market-wide
    - Indonesia: per-simbol pool (Calendars tidak mencakup IDX)
    - Crypto: kosong (tidak relevan)
    """
    key = market.lower().strip()
    wl = [s.strip().upper() for s in (watchlist or "").split(",") if s.strip()]

    start_dt = _parse_date_param(start)
    end_dt = _parse_date_param(end)
    if start_dt is None:
        start_dt = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if end_dt is None:
        end_dt = start_dt + timedelta(days=days_ahead)

    start_s = start_dt.strftime("%Y-%m-%d")
    end_s = end_dt.strftime("%Y-%m-%d")

    if key == "crypto":
        return []

    if key == "indonesia":
        pool = mover_pool_for("indonesia")
        items = get_earnings_calendar_for_symbols(
            pool,
            start=start_dt,
            end=end_dt,
            only_unreported=only_unreported,
            limit=limit,
        )
        return _attach_watchlist(items, wl)

    # Default / US — market-wide Calendars
    items = get_earnings_calendar_market_wide(
        start=start_s,
        end=end_s,
        limit=limit,
        only_unreported=only_unreported,
    )
    return _attach_watchlist(items, wl)


@router.post("/earnings-calendar", response_model=List[EarningsCalendarResponse])
@limiter.limit(DEFAULT_LIMIT)
def get_earnings_for_watchlist(
    request: Request,
    payload: WatchlistRequest,
    days: int = Query(7, ge=1, le=30),
):
    """Legacy POST: loop simbol eksplisit (tetap didukung)."""
    if not payload.symbols:
        return []
    now = datetime.now()
    horizon = now + timedelta(days=days)
    items = get_earnings_calendar_for_symbols(
        [s.upper() for s in payload.symbols],
        start=now,
        end=horizon,
        only_unreported=False,
        limit=None,
    )
    return _attach_watchlist(items, payload.symbols)


@router.get("/summary", response_model=MarketSummaryResponse)
def get_market_summary():
    """
    Ringkasan agregat crypto utama: total market cap, estimasi volume 24h, BTC dominance.
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
                if vol is not None and float(vol) == float(vol):
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
    """Placeholder — gunakan GET /sentiment/{symbol} untuk skor internal."""
    return {"value": None, "label": "Coming Soon", "source": "placeholder"}
