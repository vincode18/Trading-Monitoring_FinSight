"""Endpoint API analisis teknikal: skor, radar, S/R, fundamental, strategi."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.api.schemas import (
    AnalysisIndicatorSignal,
    AnalysisScoreResponse,
    FinancialStatementResponse,
    FundamentalChartsResponse,
    FundamentalCriteriaRequest,
    FundamentalFitResponse,
    FundamentalsResponse,
    RadarScoreResponse,
    ShareholderAnalysisResponse,
    FundamentalStrategyResponse,
    ScreenRequest,
    ScreenResponse,
    StrategyCatalogItem,
    StrategyResultResponse,
    SupportResistanceResponse,
)
from app.indicators.strategies import evaluate_strategy, known_slug, list_strategies
from app.indicators.technical import (
    add_all_indicators,
    compute_analysis_score,
    compute_radar_scores,
    compute_support_resistance,
)
from app.services.fundamental_screen import (
    evaluate_fundamental,
    list_fundamental_screens,
    screen_fundamental,
)
from app.services.fundamentals import (
    check_fundamental_criteria,
    get_financial_statement,
    get_fundamental_charts,
    get_shareholder_analysis,
)
from app.config.sectors import all_markets_pool
from app.services.strategy_screen import ALL_MARKETS_SYMBOLS, annotate_strategy, list_technical_screens, screen_technical
from app.services.market_data import get_fundamentals, get_history

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

STRATEGY_HISTORY_PERIOD = "2y"
DEFAULT_HISTORY_PERIOD = "6mo"


def _load_history(symbol: str, period: str = DEFAULT_HISTORY_PERIOD):
    symbol = symbol.upper().strip()
    df = get_history(symbol, period=period, interval="1d")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"Data not available for '{symbol}'")
    return symbol, df


def _load_indicated(symbol: str):
    symbol, df = _load_history(symbol)
    return symbol, add_all_indicators(df)


@router.get("/score/{symbol}", response_model=AnalysisScoreResponse)
def get_analysis_score(symbol: str):
    """Technical score 0–100 + label. Indicator summary — not financial advice."""
    symbol, df = _load_indicated(symbol)
    result = compute_analysis_score(df)
    return AnalysisScoreResponse(
        symbol=symbol,
        score=result["score"],
        label=result["label"],
        indicators=[AnalysisIndicatorSignal(**ind) for ind in result["indicators"]],
        disclaimer=result.get("disclaimer", "Not financial advice. Technical summary only."),
    )


@router.get("/radar/{symbol}", response_model=RadarScoreResponse)
def get_radar_scores(symbol: str):
    """Five radar scores (price action, volume, momentum, trend, volatility)."""
    symbol, df = _load_indicated(symbol)
    result = compute_radar_scores(df)
    return RadarScoreResponse(symbol=symbol, **result)


@router.get("/support-resistance/{symbol}", response_model=SupportResistanceResponse)
def get_support_resistance(symbol: str):
    """Estimate 2 support and 2 resistance levels from local min/max."""
    symbol, df = _load_indicated(symbol)
    result = compute_support_resistance(df)
    return SupportResistanceResponse(
        symbol=symbol,
        support=result["support"],
        resistance=result["resistance"],
    )


@router.get("/strategies", response_model=list[StrategyCatalogItem])
def get_strategy_catalog():
    """List of trading systems (PRD AllTradingStrategy) for the Analysis dropdown."""
    return [StrategyCatalogItem(**item) for item in list_strategies()]


@router.get("/strategy/{symbol}", response_model=StrategyResultResponse)
def get_strategy(
    symbol: str,
    slug: str = Query("profitunity", description="Slug sistem dari /api/analysis/strategies"),
):
    """
    Indicator conditions for one system on a symbol.
    Not a buy/sell signal — formula facts only (Alligator, RSI, etc.).
    """
    if not known_slug(slug):
        raise HTTPException(status_code=400, detail="Unknown strategy")
    symbol, df = _load_history(symbol, period=STRATEGY_HISTORY_PERIOD)
    try:
        result = evaluate_strategy(df, slug)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    extra = annotate_strategy(slug, result, df)
    extra.pop("conditions", None)
    return StrategyResultResponse(symbol=symbol, **result, **extra)


@router.get("/screen-strategies", response_model=list[StrategyCatalogItem])
def get_screen_strategies():
    """Technical strategies that reduce to one bullish pass/fail for a market screen."""
    return [StrategyCatalogItem(**item) for item in list_technical_screens()]


def _screen_symbols(body: ScreenRequest) -> tuple[list[str], int, int | None]:
    """All Markets scans the combined pool and returns one page. A named pool returns every match."""
    if (body.pool or "").lower() == "all":
        return all_markets_pool(), ALL_MARKETS_SYMBOLS, None
    return body.symbols, 40, None


@router.post("/screen/{strategy_key}", response_model=ScreenResponse)
def screen_strategy(
    strategy_key: str,
    body: ScreenRequest,
    page: int | None = Query(None, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """
    Run one technical strategy across the supplied symbol pool.
    pool=all scans every curated market and returns one page when page is set.
    """
    symbols, limit, _ = _screen_symbols(body)
    paged = (body.pool or "").lower() == "all"
    try:
        data = screen_technical(
            strategy_key,
            symbols,
            page=(page or 1) if paged else None,
            page_size=page_size,
            symbol_limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ScreenResponse(**data)


@router.get("/fundamental-screen-strategies", response_model=list[StrategyCatalogItem])
def get_fundamental_screen_strategies():
    """Fundamental screens (growth, Graham number, dividend yield, analyst counts)."""
    return [StrategyCatalogItem(**item) for item in list_fundamental_screens()]


@router.post("/fundamental-screen/{strategy_key}", response_model=ScreenResponse)
def screen_fundamental_strategy(
    strategy_key: str,
    body: ScreenRequest,
    page: int | None = Query(None, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Screen equities in the supplied pool. pool=all scans every curated market. Not a recommendation."""
    symbols, limit, _ = _screen_symbols(body)
    paged = (body.pool or "").lower() == "all"
    try:
        data = screen_fundamental(
            strategy_key,
            symbols,
            body.min_dividend_yield if body.min_dividend_yield is not None else 2.0,
            page=(page or 1) if paged else None,
            page_size=page_size,
            symbol_limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ScreenResponse(**data)


@router.get("/fundamental-strategy/{symbol}", response_model=FundamentalStrategyResponse)
def get_fundamental_strategy(
    symbol: str,
    strategy: str = Query("graham-number"),
    min_dividend_yield: float = Query(2.0),
):
    """One symbol against one fundamental screen, including the rule text and reference levels."""
    try:
        data = evaluate_fundamental(symbol, strategy, min_dividend_yield)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FundamentalStrategyResponse(**data)


@router.get("/fundamental/{symbol}", response_model=FundamentalsResponse)
def get_fundamental_analysis(symbol: str):
    """Brief financial statements from third-party market data. Not investment advice."""
    data = get_fundamentals(symbol.upper())
    return FundamentalsResponse(**data)


@router.get("/financials/{symbol}", response_model=FinancialStatementResponse)
def get_financials(
    symbol: str,
    statement: Literal["income_stmt", "balance_sheet", "cashflow"] = Query(...),
    freq: Literal["yearly", "quarterly", "trailing"] = Query("quarterly"),
):
    """
    One financial statement. Trailing frequency is rejected for the balance sheet.
    Not investment advice.
    """
    try:
        data = get_financial_statement(symbol, statement, freq)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FinancialStatementResponse(**data)


@router.get("/fundamental-charts/{symbol}", response_model=FundamentalChartsResponse)
def get_fundamental_chart_series(
    symbol: str,
    freq: Literal["yearly", "quarterly", "trailing"] = Query("quarterly"),
):
    """
    Historical fundamental series for the analysis charts.
    Quarterly valuation multiples use a trailing four-quarter sum.
    """
    try:
        data = get_fundamental_charts(symbol, freq)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FundamentalChartsResponse(**data)


@router.get("/shareholders/{symbol}", response_model=ShareholderAnalysisResponse)
def get_shareholders(symbol: str):
    """Reported holders and insider filings. Ownership facts, not a trading signal."""
    return ShareholderAnalysisResponse(**get_shareholder_analysis(symbol))


@router.post("/fundamental-fit/{symbol}", response_model=FundamentalFitResponse)
def fundamental_fit(symbol: str, body: FundamentalCriteriaRequest):
    """
    Compare annual ratios with thresholds supplied by the caller.
    The result reflects those thresholds. It is not a FinSight recommendation.
    """
    return FundamentalFitResponse(**check_fundamental_criteria(symbol, body.model_dump()))
