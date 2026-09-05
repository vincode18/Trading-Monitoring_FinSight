"""Komponen UI: candlestick chart + indikator teknikal (Plotly)."""
from __future__ import annotations

import streamlit as st
from plotly.subplots import make_subplots
import plotly.graph_objects as go

from app.indicators.technical import add_all_indicators, simple_signal
from app.services.market_data import get_history


def render_chart(symbol: str) -> None:
    st.subheader(f"📈 Grafik & Indikator — {symbol}")

    col1, col2, col3 = st.columns(3)
    with col1:
        period = st.selectbox(
            "Periode", ["1mo", "3mo", "6mo", "1y", "2y", "5y"], index=2, key="chart_period"
        )
    with col2:
        interval = st.selectbox(
            "Interval", ["1d", "1wk", "1h", "30m", "15m"], index=0, key="chart_interval"
        )
    with col3:
        show_bb = st.checkbox("Tampilkan Bollinger Bands", value=False, key="chart_show_bb")

    with st.spinner("Memuat data historis..."):
        try:
            df = get_history(symbol, period=period, interval=interval)
        except Exception as exc:
            st.error(f"Gagal memuat data historis: {exc}")
            return

    if df is None or df.empty or "Close" not in df.columns:
        st.warning(
            "Data tidak tersedia untuk kombinasi periode/interval ini. "
            "Coba periode lebih pendek untuk interval menit/jam."
        )
        return

    try:
        df = add_all_indicators(df)
    except Exception as exc:
        st.error(f"Gagal menghitung indikator: {exc}")
        return

    fig = make_subplots(
        rows=3,
        cols=1,
        shared_xaxes=True,
        row_heights=[0.55, 0.2, 0.25],
        vertical_spacing=0.03,
        subplot_titles=("Harga", "RSI (14)", "MACD"),
    )

    x_axis = df["Date"] if "Date" in df.columns else df.index

    # --- Panel 1: Candlestick + MA + Bollinger ---
    fig.add_trace(
        go.Candlestick(
            x=x_axis,
            open=df["Open"],
            high=df["High"],
            low=df["Low"],
            close=df["Close"],
            name="Harga",
        ),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(x=x_axis, y=df["MA20"], name="MA20", line=dict(width=1.3)),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(x=x_axis, y=df["MA50"], name="MA50", line=dict(width=1.3)),
        row=1,
        col=1,
    )
    if show_bb:
        fig.add_trace(
            go.Scatter(
                x=x_axis, y=df["BB_Upper"], name="BB Upper",
                line=dict(width=1, dash="dot"), opacity=0.6,
            ),
            row=1, col=1,
        )
        fig.add_trace(
            go.Scatter(
                x=x_axis, y=df["BB_Lower"], name="BB Lower",
                line=dict(width=1, dash="dot"), opacity=0.6,
                fill="tonexty",
            ),
            row=1, col=1,
        )

    # --- Panel 2: RSI ---
    fig.add_trace(
        go.Scatter(x=x_axis, y=df["RSI14"], name="RSI14", line=dict(width=1.5)),
        row=2, col=1,
    )
    fig.add_hline(y=70, line=dict(color="red", dash="dash", width=1), row=2, col=1)
    fig.add_hline(y=30, line=dict(color="green", dash="dash", width=1), row=2, col=1)

    # --- Panel 3: MACD ---
    fig.add_trace(
        go.Bar(x=x_axis, y=df["MACD_Hist"], name="Histogram", marker_color="gray", opacity=0.5),
        row=3, col=1,
    )
    fig.add_trace(
        go.Scatter(x=x_axis, y=df["MACD"], name="MACD", line=dict(width=1.3)),
        row=3, col=1,
    )
    fig.add_trace(
        go.Scatter(x=x_axis, y=df["MACD_Signal"], name="Signal", line=dict(width=1.3)),
        row=3, col=1,
    )

    fig.update_layout(
        height=800,
        xaxis_rangeslider_visible=False,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=10, r=10, t=40, b=10),
    )

    st.plotly_chart(fig, use_container_width=True)

    st.caption(
        "⚠️ Ringkasan kondisi teknikal berbasis aturan sederhana — "
        "ini BUKAN rekomendasi beli/jual, hanya bantuan baca indikator."
    )
    st.info(f"**Kondisi teknikal terkini:** {simple_signal(df)}")
