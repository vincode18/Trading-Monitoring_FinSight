"""
Entry point Dashboard AI Trading — Tahap 1 (lokal, single-user).

Cara jalankan:
    streamlit run app/main.py

Struktur ini sengaja dipisah per layer (config / services / indicators / ui)
supaya saat naik ke Tahap 2 (web app + backend API) dan Tahap 3
(auth + billing/subscription), bagian yang perlu diubah jelas dan minim
risiko merusak bagian lain:
    - app/services/  -> nanti bisa diganti sumber data (API berbayar, DB cache)
    - app/ui/         -> nanti komponennya bisa dipindah ke frontend React,
                         logic-nya (services + indicators) tetap reusable
    - app/config/     -> nanti tempat baca konfigurasi DB, JWT, Midtrans, dll
"""
from __future__ import annotations

import streamlit as st

from app.config.settings import settings
from app.ui.chart_view import render_chart
from app.ui.news_view import render_news
from app.ui.sidebar_view import render_sidebar
from app.ui.watchlist_view import render_watchlist

st.set_page_config(
    page_title=settings.APP_NAME,
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


def main() -> None:
    watchlist = render_sidebar()

    st.title(f"📊 {settings.APP_NAME}")
    st.caption(
        "Data harga & berita bersumber dari Yahoo Finance (via `yfinance`). "
        "Data bisa tertunda beberapa menit tergantung jenis aset — bukan feed "
        "eksekusi order, hanya untuk riset/pemantauan."
    )

    selected_symbol = render_watchlist(watchlist)

    if selected_symbol:
        st.divider()
        tab_chart, tab_news = st.tabs(["📈 Grafik & Indikator", "📰 Berita"])
        with tab_chart:
            render_chart(selected_symbol)
        with tab_news:
            render_news(selected_symbol)

    st.divider()
    st.caption(
        "⚠️ Disclaimer: Dashboard ini adalah alat bantu riset, bukan nasihat "
        "keuangan. Keputusan trading sepenuhnya tanggung jawab pengguna."
    )


if __name__ == "__main__":
    main()
