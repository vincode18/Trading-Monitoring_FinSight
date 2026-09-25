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
        st.info("Watchlist is empty. Add symbols in the sidebar.")
        return None

    with st.spinner("Fetching latest data..."):
        snapshots = get_multiple_snapshots(symbols)

    rows = []
    for s in snapshots:
        rows.append(
            {
                "Symbol": s.symbol,
                "Name": s.name,
                "Price": s.last_price,
                "Change": s.change,
                "Change %": s.change_pct,
                "Currency": s.currency or "-",
                "Market Status": s.market_state or "-",
            }
        )

    df = pd.DataFrame(rows)
    # Ensure numeric columns are float (None -> NaN) so formatting does not error
    for col in ("Price", "Change", "Change %"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    missing = int(df["Price"].isna().sum())
    if missing == len(df):
        st.warning(
            "Price data is not available from market data providers right now. "
            "Try refreshing in a few seconds, or check your internet connection."
        )
    elif missing:
        st.caption(f"{missing} symbols still have no price data.")

    def _color_change(val):
        if pd.isna(val):
            return ""
        color = "#16a34a" if val >= 0 else "#dc2626"
        return f"color: {color}; font-weight: 600"

    try:
        styled = df.style.map(_color_change, subset=["Change", "Change %"]).format(
            {
                "Price": "{:,.2f}",
                "Change": "{:+,.2f}",
                "Change %": "{:+,.2f}%",
            },
            na_rep="-",
        )
        st.dataframe(styled, use_container_width=True, hide_index=True)
    except Exception:
        # Safe fallback if Styler fails in some environments
        display = df.copy()
        display["Price"] = display["Price"].map(lambda v: f"{v:,.2f}" if pd.notna(v) else "-")
        display["Change"] = display["Change"].map(lambda v: f"{v:+,.2f}" if pd.notna(v) else "-")
        display["Change %"] = display["Change %"].map(lambda v: f"{v:+,.2f}%" if pd.notna(v) else "-")
        st.dataframe(display, use_container_width=True, hide_index=True)

    selected = st.selectbox(
        "View symbol detail:",
        options=symbols,
        format_func=lambda s: s,
        key="watchlist_select_detail",
    )
    return selected
