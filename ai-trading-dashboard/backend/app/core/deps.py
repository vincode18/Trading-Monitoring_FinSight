"""FastAPI dependencies untuk autentikasi."""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from prisma.models import User

from app.core.db import db
from app.core.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization Bearer token wajib",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kadaluarsa",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = str(payload["sub"])
    if not db.is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database belum terhubung",
        )

    user = await db.user.find_unique(where={"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
