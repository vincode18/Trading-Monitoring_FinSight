"""Manual portfolio holdings tracker — not broker-connected."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from prisma.models import User

from app.api.schemas import (
    HoldingCreateRequest,
    HoldingResponse,
    HoldingUpdateRequest,
    PortfolioSummaryResponse,
)
from app.core.db import db
from app.core.deps import get_current_user
from app.services.market_data import get_multiple_snapshots

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


def _require_db():
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")


def _to_holding_response(holding, current_price: float | None) -> HoldingResponse:
    quantity = float(holding.quantity)
    avg_buy_price = float(holding.avgBuyPrice)
    cost_basis = quantity * avg_buy_price
    market_value = quantity * current_price if current_price is not None else None
    unrealized_pnl = (market_value - cost_basis) if market_value is not None else None
    unrealized_pnl_pct = (
        (unrealized_pnl / cost_basis * 100)
        if unrealized_pnl is not None and cost_basis > 0
        else None
    )
    return HoldingResponse(
        id=holding.id,
        symbol=holding.symbol,
        quantity=quantity,
        avg_buy_price=avg_buy_price,
        buy_date=holding.buyDate.isoformat() if holding.buyDate else None,
        note=holding.note,
        current_price=current_price,
        market_value=market_value,
        unrealized_pnl=unrealized_pnl,
        unrealized_pnl_pct=unrealized_pnl_pct,
    )


@router.post("/holdings", response_model=HoldingResponse)
async def add_holding(payload: HoldingCreateRequest, user: User = Depends(get_current_user)):
    _require_db()
    try:
        buy_date = datetime.fromisoformat(payload.buy_date.replace("Z", "+00:00"))
    except Exception:
        buy_date = datetime.utcnow()
    holding = await db.portfolioholding.create(
        data={
            "userId": user.id,
            "symbol": payload.symbol.strip().upper(),
            "quantity": payload.quantity,
            "avgBuyPrice": payload.avg_buy_price,
            "buyDate": buy_date,
            "note": payload.note,
        }
    )
    return _to_holding_response(holding, current_price=payload.avg_buy_price)


@router.get("/holdings", response_model=list[HoldingResponse])
async def list_holdings(user: User = Depends(get_current_user)):
    _require_db()
    holdings = await db.portfolioholding.find_many(
        where={"userId": user.id}, order={"createdAt": "desc"}
    )
    if not holdings:
        return []
    unique_symbols = list({h.symbol for h in holdings})
    snapshots = get_multiple_snapshots(unique_symbols)
    price_map = {s.symbol: s.last_price for s in snapshots}
    return [_to_holding_response(h, price_map.get(h.symbol)) for h in holdings]


@router.patch("/holdings/{holding_id}", response_model=HoldingResponse)
async def update_holding(
    holding_id: str,
    payload: HoldingUpdateRequest,
    user: User = Depends(get_current_user),
):
    _require_db()
    existing = await db.portfolioholding.find_first(
        where={"id": holding_id, "userId": user.id}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Holding tidak ditemukan")
    data = {}
    if payload.quantity is not None:
        data["quantity"] = payload.quantity
    if payload.avg_buy_price is not None:
        data["avgBuyPrice"] = payload.avg_buy_price
    if payload.note is not None:
        data["note"] = payload.note
    updated = await db.portfolioholding.update(where={"id": holding_id}, data=data)
    snaps = get_multiple_snapshots([updated.symbol])
    price = snaps[0].last_price if snaps else None
    return _to_holding_response(updated, price)


@router.delete("/holdings/{holding_id}")
async def delete_holding(holding_id: str, user: User = Depends(get_current_user)):
    _require_db()
    existing = await db.portfolioholding.find_first(
        where={"id": holding_id, "userId": user.id}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Holding tidak ditemukan")
    await db.portfolioholding.delete(where={"id": holding_id})
    return {"deleted": True}


@router.get("/summary", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary(user: User = Depends(get_current_user)):
    holdings = await list_holdings(user=user)
    total_value = sum(h.market_value or 0 for h in holdings)
    total_cost = sum(h.quantity * h.avg_buy_price for h in holdings)
    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0.0
    return PortfolioSummaryResponse(
        total_value=total_value,
        total_cost=total_cost,
        total_unrealized_pnl=total_pnl,
        total_unrealized_pnl_pct=total_pnl_pct,
        holdings=holdings,
    )
