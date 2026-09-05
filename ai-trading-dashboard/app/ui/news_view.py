"""Komponen UI: daftar berita terkait simbol."""
from __future__ import annotations

import streamlit as st

from app.services.news_data import get_news_for_symbol


def render_news(symbol: str) -> None:
    st.subheader(f"📰 Berita Terkait — {symbol}")

    with st.spinner("Mengambil berita..."):
        try:
            news_items = get_news_for_symbol(symbol)
        except Exception as exc:
            st.error(f"Gagal mengambil berita: {exc}")
            return

    if not news_items:
        st.info("Tidak ada berita ditemukan untuk simbol ini saat ini.")
        return

    for item in news_items:
        published = (
            item.published_at.strftime("%d %b %Y, %H:%M UTC")
            if item.published_at
            else "Tanggal tidak diketahui"
        )
        title = item.title or "(Tanpa judul)"
        link = item.link or "#"
        publisher = item.publisher or "Sumber tidak diketahui"
        st.markdown(
            f"**[{title}]({link})**  \n"
            f"<span style='color:gray;font-size:0.85em'>{publisher} · {published}</span>",
            unsafe_allow_html=True,
        )
        st.divider()
