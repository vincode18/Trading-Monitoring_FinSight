// Client layer terpusat untuk semua panggilan ke backend API.
// Komponen UI tidak pernah panggil fetch() langsung — selalu lewat sini,
// supaya base URL, error handling, dan format request konsisten di satu tempat.

import {
  ChartData,
  NewsItem,
  QuoteSnapshot,
  SymbolSearchResult,
} from '@/types/market';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || `Request gagal (${res.status})`, res.status);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getQuote: (symbol: string) => fetchJson<QuoteSnapshot>(`/api/market/quote/${symbol}`),

  getWatchlistQuotes: (symbols: string[]) =>
    fetchJson<QuoteSnapshot[]>('/api/market/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  searchSymbol: (query: string) =>
    fetchJson<SymbolSearchResult[]>(`/api/market/search?q=${encodeURIComponent(query)}`),

  getChart: (symbol: string, period: string, interval: string) =>
    fetchJson<ChartData>(`/api/chart/${symbol}?period=${period}&interval=${interval}`),

  getNews: (symbol: string) => fetchJson<NewsItem[]>(`/api/news/${symbol}`),
};

export { ApiError };
