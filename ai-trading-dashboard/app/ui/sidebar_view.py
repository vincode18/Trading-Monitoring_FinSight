"""Komponen UI: sidebar untuk kelola watchlist (tambah/hapus simbol)."""
from __future__ import annotations

import streamlit as st

from app.config.settings import settings
from app.services.market_data import search_symbol


def render_sidebar() -> list[str]:
    st.sidebar.title(f"⚙️ {settings.APP_NAME}")
    st.sidebar.caption("Tahap 1 — Dashboard Lokal (data via Yahoo Finance)")

    if "watchlist" not in st.session_state:
        st.session_state.watchlist = list(settings.DEFAULT_WATCHLIST)

    st.sidebar.subheader("Cari & Tambah Simbol")
    query = st.sidebar.text_input("Cari nama saham/crypto/index...", key="symbol_search")
    if query:
        results = search_symbol(query)
        for r in results:
            label = f"{r['symbol']} — {r['name']} ({r.get('exchange', '-')})"
            if st.sidebar.button(f"➕ {label}", key=f"add_{r['symbol']}"):
                if r["symbol"] not in st.session_state.watchlist:
                    st.session_state.watchlist.append(r["symbol"])
                    st.rerun()

    st.sidebar.subheader("Watchlist Saat Ini")
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
        "Atau ketik simbol manual (contoh: GOTO.JK, ETH-USD)", key="manual_add"
    )
    if st.sidebar.button("Tambah Simbol Manual") and manual_symbol:
        sym = manual_symbol.strip().upper()
        if sym not in st.session_state.watchlist:
            st.session_state.watchlist.append(sym)
            st.rerun()

    st.sidebar.divider()
    st.sidebar.caption(
        "💡 Roadmap: Tahap 2 akan menambahkan backend + database multi-user. "
        "Tahap 3 akan menambahkan login, role Admin/Member, dan billing "
        "(Transfer Bank / Midtrans)."
    )

    return st.session_state.watchlist
