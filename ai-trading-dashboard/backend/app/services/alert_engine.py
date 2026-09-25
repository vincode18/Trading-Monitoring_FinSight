"""Lazy alert evaluation — reuses existing quote/indicator helpers."""
from __future__ import annotations

from datetime import datetime, timezone

from app.core.db import db
from app.indicators.technical import add_all_indicators, detect_ma_cross, volume_ratio
from app.services.market_data import get_history, get_quote_snapshot


def _alert_dict(alert) -> dict:
    return {
        "id": alert.id,
        "symbol": alert.symbol,
        "condition": str(alert.condition),
        "threshold": float(alert.threshold),
        "status": str(alert.status),
        "triggered_at": alert.triggeredAt.isoformat() if alert.triggeredAt else None,
        "created_at": alert.createdAt.isoformat() if alert.createdAt else "",
    }


async def evaluate_alerts_for_user(user_id: str) -> list[dict]:
    """Evaluate ACTIVE alerts; return those newly set to TRIGGERED on this call."""
    alerts = await db.alert.find_many(where={"userId": user_id, "status": "ACTIVE"})
    triggered: list[dict] = []

    for alert in alerts:
        condition = str(alert.condition)
        is_triggered = False
        threshold = float(alert.threshold or 0)

        try:
            if condition in ("PRICE_ABOVE", "PRICE_BELOW"):
                quote = get_quote_snapshot(alert.symbol)
                if quote.last_price is None:
                    continue
                is_triggered = (
                    quote.last_price > threshold
                    if condition == "PRICE_ABOVE"
                    else quote.last_price < threshold
                )
            elif condition in ("CHANGE_PCT_ABOVE", "CHANGE_PCT_BELOW"):
                quote = get_quote_snapshot(alert.symbol)
                if quote.change_pct is None:
                    continue
                is_triggered = (
                    quote.change_pct > threshold
                    if condition == "CHANGE_PCT_ABOVE"
                    else quote.change_pct < threshold
                )
            elif condition in ("RSI_OVERBOUGHT", "RSI_OVERSOLD"):
                df = get_history(alert.symbol, period="3mo", interval="1d")
                if df is None or df.empty:
                    continue
                df = add_all_indicators(df)
                latest_rsi = float(df["RSI14"].iloc[-1])
                if latest_rsi != latest_rsi:
                    continue
                is_triggered = latest_rsi > 70 if condition == "RSI_OVERBOUGHT" else latest_rsi < 30
            elif condition in ("GOLDEN_CROSS", "DEATH_CROSS"):
                df = get_history(alert.symbol, period="3mo", interval="1d")
                if df is None or df.empty:
                    continue
                df = add_all_indicators(df)
                cross = detect_ma_cross(df)
                is_triggered = (condition == "GOLDEN_CROSS" and cross == "golden") or (
                    condition == "DEATH_CROSS" and cross == "death"
                )
            elif condition == "VOLUME_SPIKE":
                df = get_history(alert.symbol, period="2mo", interval="1d")
                if df is None or df.empty:
                    continue
                ratio = volume_ratio(df)
                is_triggered = ratio is not None and ratio > threshold
        except Exception:
            continue

        if is_triggered:
            updated = await db.alert.update(
                where={"id": alert.id},
                data={"status": "TRIGGERED", "triggeredAt": datetime.now(timezone.utc)},
            )
            triggered.append(_alert_dict(updated))

    return triggered
