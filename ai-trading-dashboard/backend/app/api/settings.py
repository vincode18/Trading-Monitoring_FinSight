"""Account preferences & subscription readout."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from prisma.models import User

from app.api.schemas import SubscriptionResponse, UpdatePreferencesRequest
from app.core.db import db
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _require_db():
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")


@router.get("/preferences")
async def get_preferences(user: User = Depends(get_current_user)):
    _require_db()
    return user.preferences or {}


@router.patch("/preferences")
async def update_preferences(
    payload: UpdatePreferencesRequest, user: User = Depends(get_current_user)
):
    _require_db()
    current = user.preferences if isinstance(user.preferences, dict) else {}
    merged = {**current, **payload.model_dump(exclude_none=True)}
    updated = await db.user.update(where={"id": user.id}, data={"preferences": merged})
    return updated.preferences or {}


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(user: User = Depends(get_current_user)):
    _require_db()
    subscription = await db.subscription.find_first(where={"userId": user.id})
    if subscription is None:
        return SubscriptionResponse(tier="FREE", status="ACTIVE", has_billing_record=False, end_date=None)
    end = getattr(subscription, "endDate", None)
    return SubscriptionResponse(
        tier=str(subscription.tier),
        status=str(subscription.status),
        has_billing_record=True,
        end_date=end.isoformat() if end is not None else None,
    )
