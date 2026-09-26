"""Komponen UI: sidebar untuk kelola watchlist (tambah/hapus simbol)."""
from __future__ import annotations

import streamlit as st

from app.config.settings import settings
from app.services.market_data import search_symbol


def render_sidebar() -> list[str]:
    st.sidebar.title(f"⚙️ {settings.APP_NAME}")
    st.sidebar.caption("Stage 1 — Local dashboard (third-party market data)")

    if "watchlist" not in st.session_state:
        st.session_state.watchlist = list(settings.DEFAULT_WATCHLIST)

    st.sidebar.subheader("Search & Add Symbol")
    query = st.sidebar.text_input("Search stock / crypto / index...", key="symbol_search")
    if query:
        results = search_symbol(query)
        for r in results:
            label = f"{r['symbol']} — {r['name']} ({r.get('exchange', '-')})"
            if st.sidebar.button(f"➕ {label}", key=f"add_{r['symbol']}"):
                if r["symbol"] not in st.session_state.watchlist:
                    st.session_state.watchlist.append(r["symbol"])
                    st.rerun()

    st.sidebar.subheader("Current Watchlist")
    to_remove = None
    for sym in st.session_state.watchlist:
        col1, col2 = st.sidebar.columns([3, 1])
        col1.write(sym)
        if col2.button("🗑️", key=f"remove_{sym}"):
            to_remove = sym
    if to_remove:
        st.session_state.watchlist.remove(to_remove)
        st.rerun()

    st.sidebar.divider()
    manual_symbol = st.sidebar.text_input(
        "Or type a symbol manually (e.g. GOTO.JK, ETH-USD)", key="manual_add"
    )
    if st.sidebar.button("Add Symbol Manually") and manual_symbol:
        sym = manual_symbol.strip().upper()
        if sym not in st.session_state.watchlist:
            st.session_state.watchlist.append(sym)
            st.rerun()

    st.sidebar.divider()
    st.sidebar.caption(
        "💡 Roadmap: Stage 2 adds a multi-user backend + database. "
        "Stage 3 adds login, Admin/Member roles, and billing "
        "(bank transfer / Midtrans)."
    )

    return st.session_state.watchlist
