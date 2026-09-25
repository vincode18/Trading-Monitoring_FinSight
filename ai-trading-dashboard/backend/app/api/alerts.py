"""User price/indicator alerts — protected by auth."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from prisma.models import User

from app.api.schemas import AlertCreateRequest, AlertResponse
from app.core.db import db
from app.core.deps import get_current_user
from app.services.alert_engine import _alert_dict, evaluate_alerts_for_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

VALID_CONDITIONS = {
    "PRICE_ABOVE",
    "PRICE_BELOW",
    "CHANGE_PCT_ABOVE",
    "CHANGE_PCT_BELOW",
    "RSI_OVERBOUGHT",
    "RSI_OVERSOLD",
    "GOLDEN_CROSS",
    "DEATH_CROSS",
    "VOLUME_SPIKE",
}
NO_THRESHOLD = {"RSI_OVERBOUGHT", "RSI_OVERSOLD", "GOLDEN_CROSS", "DEATH_CROSS"}


def _require_db():
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")


@router.post("", response_model=AlertResponse)
async def create_alert(payload: AlertCreateRequest, user: User = Depends(get_current_user)):
    _require_db()
    condition = payload.condition.upper().strip()
    if condition not in VALID_CONDITIONS:
        raise HTTPException(status_code=400, detail="Condition tidak valid")
    threshold = 0.0 if condition in NO_THRESHOLD else float(payload.threshold or 0)
    alert = await db.alert.create(
        data={
            "userId": user.id,
            "symbol": payload.symbol.strip().upper(),
            "condition": condition,
            "threshold": threshold,
        }
    )
    return AlertResponse(**_alert_dict(alert))


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    status: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    _require_db()
    where: dict = {"userId": user.id}
    if status:
        where["status"] = status.upper()
    alerts = await db.alert.find_many(where=where, order={"createdAt": "desc"})
    return [AlertResponse(**_alert_dict(a)) for a in alerts]


@router.patch("/{alert_id}", response_model=AlertResponse)
async def toggle_alert(
    alert_id: str,
    status: str = Query(...),
    user: User = Depends(get_current_user),
):
    _require_db()
    status_u = status.upper()
    if status_u not in {"ACTIVE", "DISABLED", "TRIGGERED"}:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    existing = await db.alert.find_first(where={"id": alert_id, "userId": user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Alert tidak ditemukan")
    updated = await db.alert.update(where={"id": alert_id}, data={"status": status_u})
    return AlertResponse(**_alert_dict(updated))


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, user: User = Depends(get_current_user)):
    _require_db()
    existing = await db.alert.find_first(where={"id": alert_id, "userId": user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Alert tidak ditemukan")
    await db.alert.delete(where={"id": alert_id})
    return {"deleted": True}


@router.get("/check", response_model=list[AlertResponse])
async def check_alerts(user: User = Depends(get_current_user)):
    """Evaluate ACTIVE alerts; return all TRIGGERED for badge count."""
    _require_db()
    await evaluate_alerts_for_user(user.id)
    triggered = await db.alert.find_many(
        where={"userId": user.id, "status": "TRIGGERED"},
        order={"triggeredAt": "desc"},
    )
    return [AlertResponse(**_alert_dict(a)) for a in triggered]
