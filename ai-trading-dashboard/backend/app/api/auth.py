"""Auth endpoints: register, login, me."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.enums import Role
from prisma.models import User

from app.api.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.config.settings import settings
from app.core.db import db
from app.core.deps import get_current_user
from app.core.rate_limit import DEFAULT_LIMIT, limiter
from app.core.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=str(user.role),
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(DEFAULT_LIMIT)
async def register(request: Request, payload: RegisterRequest):
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")

    email = payload.email.strip().lower()
    existing = await db.user.find_unique(where={"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")

    user = await db.user.create(
        data={
            "email": email,
            "name": payload.name.strip(),
            "passwordHash": hash_password(payload.password),
            "role": Role.MEMBER,
        }
    )
    return _to_user_response(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(DEFAULT_LIMIT)
async def login(request: Request, payload: LoginRequest):
    if not db.is_connected():
        raise HTTPException(status_code=503, detail="Database belum terhubung")

    email = payload.email.strip().lower()
    user = await db.user.find_unique(where={"email": email})
    if user is None or not verify_password(payload.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token(
        {"sub": user.id, "role": str(user.role), "email": user.email}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        user=_to_user_response(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return _to_user_response(current_user)
