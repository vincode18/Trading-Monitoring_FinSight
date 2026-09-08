"""Watchlist per-user — tersimpan di Supabase via Prisma WatchlistItem."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from prisma.models import User
from pydantic import BaseModel

from app.core.db import db
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/user/watchlist", tags=["user-watchlist"])


class WatchlistSymbolsResponse(BaseModel):
    symbols: List[str]


class WatchlistSymbolRequest(BaseModel):
    symbol: str


class WatchlistReplaceRequest(BaseModel):
    symbols: List[str]


@router.get("", response_model=WatchlistSymbolsResponse)
async def get_watchlist(current_user: User = Depends(get_current_user)):
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")
    items = await db.watchlistitem.find_many(
        where={"userId": current_user.id},
        order={"addedAt": "asc"},
    )
    return WatchlistSymbolsResponse(symbols=[i.symbol for i in items])


@router.put("", response_model=WatchlistSymbolsResponse)
async def replace_watchlist(
    payload: WatchlistReplaceRequest,
    current_user: User = Depends(get_current_user),
):
    """Ganti seluruh watchlist user (dipakai saat migrasi dari localStorage)."""
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")

    symbols = []
    seen = set()
    for raw in payload.symbols:
        s = raw.strip().upper()
        if not s or s in seen:
            continue
        seen.add(s)
        symbols.append(s)

    await db.watchlistitem.delete_many(where={"userId": current_user.id})
    for s in symbols:
        await db.watchlistitem.create(data={"userId": current_user.id, "symbol": s})

    return WatchlistSymbolsResponse(symbols=symbols)


@router.post("", response_model=WatchlistSymbolsResponse, status_code=status.HTTP_201_CREATED)
async def add_symbol(
    payload: WatchlistSymbolRequest,
    current_user: User = Depends(get_current_user),
):
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")

    symbol = payload.symbol.strip().upper()
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol wajib diisi")

    existing = await db.watchlistitem.find_unique(
        where={"userId_symbol": {"userId": current_user.id, "symbol": symbol}}
    )
    if not existing:
        await db.watchlistitem.create(data={"userId": current_user.id, "symbol": symbol})

    items = await db.watchlistitem.find_many(
        where={"userId": current_user.id},
        order={"addedAt": "asc"},
    )
    return WatchlistSymbolsResponse(symbols=[i.symbol for i in items])


@router.delete("/{symbol}", response_model=WatchlistSymbolsResponse)
async def remove_symbol(symbol: str, current_user: User = Depends(get_current_user)):
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")

    await db.watchlistitem.delete_many(
        where={"userId": current_user.id, "symbol": symbol.strip().upper()}
    )
    items = await db.watchlistitem.find_many(
        where={"userId": current_user.id},
        order={"addedAt": "asc"},
    )
    return WatchlistSymbolsResponse(symbols=[i.symbol for i in items])
