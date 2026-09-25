"""UI component: news list for a symbol."""
from __future__ import annotations

import streamlit as st

from app.services.news_data import get_news_for_symbol


def render_news(symbol: str) -> None:
    st.subheader(f"📰 Related News — {symbol}")

    with st.spinner("Fetching news..."):
        try:
            news_items = get_news_for_symbol(symbol)
        except Exception as exc:
            st.error(f"Failed to fetch news: {exc}")
            return

    if not news_items:
        st.info("No news found for this symbol right now.")
        return

    for item in news_items:
        published = (
            item.published_at.strftime("%d %b %Y, %H:%M UTC")
            if item.published_at
            else "Date unknown"
        )
        title = item.title or "(Untitled)"
        link = item.link or "#"
        publisher = item.publisher or "Unknown source"
        st.markdown(
            f"**[{title}]({link})**  \n"
            f"<span style='color:gray;font-size:0.85em'>{publisher} · {published}</span>",
            unsafe_allow_html=True,
        )
        st.divider()
