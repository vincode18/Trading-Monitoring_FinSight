"""Endpoint API analisis teknikal: skor, radar, support/resistance."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.schemas import (
    AnalysisIndicatorSignal,
    AnalysisScoreResponse,
    RadarScoreResponse,
    SupportResistanceResponse,
)
from app.indicators.technical import (
    add_all_indicators,
    compute_analysis_score,
    compute_radar_scores,
    compute_support_resistance,
)
from app.services.market_data import get_history

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _load_indicated(symbol: str):
    symbol = symbol.upper()
    df = get_history(symbol, period="6mo", interval="1d")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"Data tidak tersedia untuk '{symbol}'")
    return symbol, add_all_indicators(df)


@router.get("/score/{symbol}", response_model=AnalysisScoreResponse)
def get_analysis_score(symbol: str):
    """
    Skor teknikal 0–100 + label. BUKAN saran finansial — ringkasan indikator saja.
    """
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
    """Lima skor radar (price action, volume, momentum, trend, volatility)."""
    symbol, df = _load_indicated(symbol)
    result = compute_radar_scores(df)
    return RadarScoreResponse(symbol=symbol, **result)


@router.get("/support-resistance/{symbol}", response_model=SupportResistanceResponse)
def get_support_resistance(symbol: str):
    """Estimasi 2 level support dan 2 resistance dari local min/max."""
    symbol, df = _load_indicated(symbol)
    result = compute_support_resistance(df)
    return SupportResistanceResponse(
        symbol=symbol,
        support=result["support"],
        resistance=result["resistance"],
    )
