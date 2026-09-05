"""
Cache in-memory sederhana berbasis TTL, pengganti `st.cache_data` dari Streamlit
yang tidak tersedia di backend FastAPI. Cocok untuk single-instance deployment;
saat backend di-scale ke banyak instance (load balancer), pertimbangkan pindah
ke Redis supaya cache konsisten antar-instance (lihat Documentation-Program.md §7).
"""
from __future__ import annotations

import time
from functools import wraps
from typing import Any, Callable

_cache_store: dict[str, tuple[float, Any]] = {}


def ttl_cache(ttl_seconds: int):
    """Decorator cache sederhana: key dibangun dari nama fungsi + argumen."""

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{func.__module__}.{func.__qualname__}:{args}:{sorted(kwargs.items())}"
            now = time.time()
            if key in _cache_store:
                cached_at, value = _cache_store[key]
                if now - cached_at < ttl_seconds:
                    return value
            result = func(*args, **kwargs)
            _cache_store[key] = (now, result)
            return result

        return wrapper

    return decorator


def clear_cache() -> None:
    """Kosongkan seluruh cache — berguna untuk testing atau force-refresh endpoint."""
    _cache_store.clear()
