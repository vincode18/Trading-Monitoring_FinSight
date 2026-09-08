"""Rate limiter bersama (slowapi) — diimport oleh main.py dan router API."""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# 30 req/menit per IP untuk endpoint berat (search/chart/watchlist/news)
DEFAULT_LIMIT = "30/minute"

limiter = Limiter(key_func=get_remote_address, default_limits=[])
