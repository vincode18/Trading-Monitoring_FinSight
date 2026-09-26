"""Helper Set-Cookie / clear untuk JWT httpOnly session."""
from fastapi import Response

from app.config.settings import settings

AUTH_COOKIE_NAME = "access_token"


def _cookie_secure() -> bool:
    # Secure=True butuh HTTPS; local (http://localhost) harus False
    return settings.APP_ENV not in ("local", "development", "dev", "test")


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=_cookie_secure(),
        httponly=True,
        samesite="lax",
    )
