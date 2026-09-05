"""
Service layer untuk berita terkait simbol saham.

"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import feedparser
import streamlit as st
import yfinance as yf

from app.config.settings import settings


@dataclass
class NewsItem:
    title: str
    publisher: str
    link: str
    published_at: datetime | None


@st.cache_data(ttl=max(settings.CACHE_TTL_SECONDS, 300), show_spinner=False)
def get_news_for_symbol(symbol: str, max_items: int | None = None) -> list[NewsItem]:
    max_items = max_items or settings.NEWS_MAX_ITEMS
    items: list[NewsItem] = []

    # Sumber utama: yfinance
    try:
        ticker = yf.Ticker(symbol)
        raw_news = ticker.news or []
        for entry in raw_news[:max_items]:
            content = entry.get("content", entry)  # yfinance versi baru bungkus di "content"
            title = content.get("title") or entry.get("title")
            publisher = (
                content.get("provider", {}).get("displayName")
                if isinstance(content.get("provider"), dict)
                else entry.get("publisher")
            ) or "Yahoo Finance"
            link = (
                content.get("canonicalUrl", {}).get("url")
                if isinstance(content.get("canonicalUrl"), dict)
                else entry.get("link")
            )
            pub_date = content.get("pubDate") or entry.get("providerPublishTime")
            published_at = _parse_published(pub_date)
            if title and link:
                items.append(NewsItem(title=title, publisher=publisher, link=link, published_at=published_at))
    except Exception:
        pass

    if items:
        return items

    # Fallback: Google News RSS berdasarkan simbol
    try:
        feed_url = f"https://news.google.com/rss/search?q={symbol}+stock&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:max_items]:
            published_at = None
            if getattr(entry, "published_parsed", None):
                published_at = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            publisher = "Google News"
            source = getattr(entry, "source", None)
            if isinstance(source, dict):
                publisher = source.get("title") or publisher
            elif source is not None:
                publisher = getattr(source, "title", None) or publisher
            title = getattr(entry, "title", None)
            link = getattr(entry, "link", None)
            if title and link:
                items.append(
                    NewsItem(
                        title=title,
                        publisher=publisher,
                        link=link,
                        published_at=published_at,
                    )
                )
    except Exception:
        pass

    return items


def _parse_published(value) -> datetime | None:
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc)
        if isinstance(value, str):
            # Format ISO umum dari yfinance versi baru, contoh: 2026-09-01T10:00:00Z
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None
    return None
