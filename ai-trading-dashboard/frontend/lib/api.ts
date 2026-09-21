import {
  AnalysisScore,
  ChartData,
  EarningsCalendarItem,
  FearGreed,
  MACrossAlert,
  MarketSummary,
  NewsItem,
  QuoteSnapshot,
  RadarScore,
  SectorPerformance,
  SentimentScore,
  SupportResistance,
  SymbolSearchResult,
  VolumeMover,
} from '@/types/market';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser | null;
}

export interface WatchlistSymbols {
  symbols: string[];
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body.detail === 'string'
        ? body.detail
        : Array.isArray(body.detail)
          ? body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
          : `Request gagal (${res.status})`;
    throw new ApiError(detail || `Request gagal (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, name: string, password: string) =>
    fetchJson<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),

  login: (email: string, password: string) =>
    fetchJson<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => fetchJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => fetchJson<AuthUser>('/api/auth/me'),

  getUserWatchlist: () => fetchJson<WatchlistSymbols>('/api/user/watchlist'),

  replaceUserWatchlist: (symbols: string[]) =>
    fetchJson<WatchlistSymbols>('/api/user/watchlist', {
      method: 'PUT',
      body: JSON.stringify({ symbols }),
    }),

  addUserWatchlistSymbol: (symbol: string) =>
    fetchJson<WatchlistSymbols>('/api/user/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    }),

  removeUserWatchlistSymbol: (symbol: string) =>
    fetchJson<WatchlistSymbols>(`/api/user/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    }),

  getQuote: (symbol: string) => fetchJson<QuoteSnapshot>(`/api/market/quote/${symbol}`),

  getWatchlistQuotes: (symbols: string[]) =>
    fetchJson<QuoteSnapshot[]>('/api/market/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  searchSymbol: (query: string) =>
    fetchJson<SymbolSearchResult[]>(`/api/market/search?q=${encodeURIComponent(query)}`),

  getOverview: (symbols?: string[]) => {
    const q =
      symbols && symbols.length
        ? `?symbols=${encodeURIComponent(symbols.join(','))}`
        : '';
    return fetchJson<QuoteSnapshot[]>(`/api/market/overview${q}`);
  },

  getTopGainers: (symbols: string[], limit = 5, order: 'asc' | 'desc' = 'desc') =>
    fetchJson<QuoteSnapshot[]>(`/api/market/top-gainers?limit=${limit}&order=${order}`, {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  getVolumeMovers: (symbols: string[], limit = 10) =>
    fetchJson<VolumeMover[]>('/api/market/volume-movers?limit=' + limit, {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  getSentiment: (symbol: string) =>
    fetchJson<SentimentScore>(`/api/market/sentiment/${encodeURIComponent(symbol)}`),

  getSectors: (market: string) =>
    fetchJson<SectorPerformance>(`/api/market/sectors/${encodeURIComponent(market)}`),

  getMACrossAlerts: (symbols: string[]) =>
    fetchJson<MACrossAlert[]>('/api/market/ma-cross-alerts', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  getEarningsCalendar: (symbols: string[], days = 7) =>
    fetchJson<EarningsCalendarItem[]>(`/api/market/earnings-calendar?days=${days}`, {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  getMarketEarningsCalendar: (opts: {
    market: string;
    daysAhead?: number;
    limit?: number;
    onlyUnreported?: boolean;
    start?: string;
    end?: string;
    watchlist?: string[];
  }) => {
    const params = new URLSearchParams({
      market: opts.market,
      days_ahead: String(opts.daysAhead ?? 7),
      limit: String(opts.limit ?? 50),
      only_unreported: String(opts.onlyUnreported ?? true),
    });
    if (opts.start) params.set('start', opts.start);
    if (opts.end) params.set('end', opts.end);
    if (opts.watchlist?.length) params.set('watchlist', opts.watchlist.join(','));
    return fetchJson<EarningsCalendarItem[]>(`/api/market/earnings-calendar?${params}`);
  },

  getMarketSummary: () => fetchJson<MarketSummary>('/api/market/summary'),

  getFearGreed: () => fetchJson<FearGreed>('/api/market/fear-greed'),

  getChart: (symbol: string, period: string, interval: string) =>
    fetchJson<ChartData>(`/api/chart/${symbol}?period=${period}&interval=${interval}`),

  getNews: (symbol: string) => fetchJson<NewsItem[]>(`/api/news/${symbol}`),

  getMarketNews: (market: string, limit = 8) =>
    fetchJson<NewsItem[]>(`/api/news/market/${encodeURIComponent(market)}?limit=${limit}`),

  getAnalysisScore: (symbol: string) =>
    fetchJson<AnalysisScore>(`/api/analysis/score/${encodeURIComponent(symbol)}`),

  getRadar: (symbol: string) =>
    fetchJson<RadarScore>(`/api/analysis/radar/${encodeURIComponent(symbol)}`),

  getSupportResistance: (symbol: string) =>
    fetchJson<SupportResistance>(
      `/api/analysis/support-resistance/${encodeURIComponent(symbol)}`
    ),
};

export { ApiError };
