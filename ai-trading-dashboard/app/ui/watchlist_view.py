"""Komponen UI: tabel watchlist / ringkasan portfolio banyak simbol."""
from __future__ import annotations

import pandas as pd
import streamlit as st

from app.services.market_data import get_multiple_snapshots


def render_watchlist(symbols: list[str]) -> str | None:
    """
    Render tabel watchlist dengan harga & perubahan harian.
    Mengembalikan simbol yang dipilih user (untuk lihat detail), atau None.
    """
    st.subheader("📋 Watchlist")

    if not symbols:
        st.info("Watchlist kosong. Tambahkan simbol di sidebar.")
        return None

    with st.spinner("Mengambil data terkini..."):
        snapshots = get_multiple_snapshots(symbols)

    rows = []
    for s in snapshots:
        rows.append(
            {
                "Simbol": s.symbol,
                "Nama": s.name,
                "Harga": s.last_price,
                "Perubahan": s.change,
                "Perubahan %": s.change_pct,
                "Mata Uang": s.currency or "-",
                "Status Pasar": s.market_state or "-",
            }
        )

    df = pd.DataFrame(rows)
    # Pastikan kolom numerik bertipe float (None -> NaN) supaya format tidak error
    for col in ("Harga", "Perubahan", "Perubahan %"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    missing = int(df["Harga"].isna().sum())
    if missing == len(df):
        st.warning(
            "Data harga belum tersedia dari Yahoo Finance saat ini. "
            "Coba refresh beberapa detik lagi, atau cek koneksi internet."
        )
    elif missing:
        st.caption(f"{missing} simbol belum punya data harga.")

    def _color_change(val):
        if pd.isna(val):
            return ""
        color = "#16a34a" if val >= 0 else "#dc2626"
        return f"color: {color}; font-weight: 600"

    try:
        styled = df.style.map(_color_change, subset=["Perubahan", "Perubahan %"]).format(
            {
                "Harga": "{:,.2f}",
                "Perubahan": "{:+,.2f}",
                "Perubahan %": "{:+,.2f}%",
            },
            na_rep="-",
        )
        st.dataframe(styled, use_container_width=True, hide_index=True)
    except Exception:
        # Fallback aman jika Styler gagal di environment tertentu
        display = df.copy()
        display["Harga"] = display["Harga"].map(lambda v: f"{v:,.2f}" if pd.notna(v) else "-")
        display["Perubahan"] = display["Perubahan"].map(lambda v: f"{v:+,.2f}" if pd.notna(v) else "-")
        display["Perubahan %"] = display["Perubahan %"].map(lambda v: f"{v:+,.2f}%" if pd.notna(v) else "-")
        st.dataframe(display, use_container_width=True, hide_index=True)

    selected = st.selectbox(
        "Lihat detail simbol:",
        options=symbols,
        format_func=lambda s: s,
        key="watchlist_select_detail",
    )
    return selected
