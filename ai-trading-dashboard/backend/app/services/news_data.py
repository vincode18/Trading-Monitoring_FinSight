"""Service layer untuk berita terkait simbol saham — versi backend."""
from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone

import feedparser
import yfinance as yf

from app.config.settings import settings
from app.core.cache import ttl_cache


@dataclass
class NewsItem:
    title: str
    publisher: str
    link: str
    published_at: datetime | None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["published_at"] = self.published_at.isoformat() if self.published_at else None
        return d


@ttl_cache(ttl_seconds=max(300, 60))
def get_news_for_symbol(symbol: str, max_items: int | None = None) -> list[NewsItem]:
    max_items = max_items or settings.NEWS_MAX_ITEMS
    items: list[NewsItem] = []

    try:
        ticker = yf.Ticker(symbol)
        raw_news = ticker.news or []
        for entry in raw_news[:max_items]:
            content = entry.get("content", entry)
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

    try:
        feed_url = f"https://news.google.com/rss/search?q={symbol}+stock&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:max_items]:
            published_at = None
            if getattr(entry, "published_parsed", None):
                published_at = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            items.append(
                NewsItem(
                    title=entry.title,
                    publisher=getattr(entry, "source", {}).get("title", "Google News")
                    if hasattr(entry, "source")
                    else "Google News",
                    link=entry.link,
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
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None
    return None
