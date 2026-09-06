import {
  AnalysisScore,
  ChartData,
  FearGreed,
  MarketSummary,
  NewsItem,
  QuoteSnapshot,
  RadarScore,
  SupportResistance,
  SymbolSearchResult,
} from '@/types/market';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'trading-dashboard-token';

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

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (init?.auth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const { auth: _auth, ...rest } = init || {};
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
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

  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, name: string, password: string) =>
    fetchJson<AuthUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),

  login: (email: string, password: string) =>
    fetchJson<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => fetchJson<AuthUser>('/api/auth/me', { auth: true }),

  getQuote: (symbol: string) => fetchJson<QuoteSnapshot>(`/api/market/quote/${symbol}`),

  getWatchlistQuotes: (symbols: string[]) =>
    fetchJson<QuoteSnapshot[]>('/api/market/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  searchSymbol: (query: string) =>
    fetchJson<SymbolSearchResult[]>(`/api/market/search?q=${encodeURIComponent(query)}`),

  getOverview: () => fetchJson<QuoteSnapshot[]>('/api/market/overview'),

  getTopGainers: (symbols: string[], limit = 5) =>
    fetchJson<QuoteSnapshot[]>(`/api/market/top-gainers?limit=${limit}`, {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    }),

  getMarketSummary: () => fetchJson<MarketSummary>('/api/market/summary'),

  getFearGreed: () => fetchJson<FearGreed>('/api/market/fear-greed'),

  getChart: (symbol: string, period: string, interval: string) =>
    fetchJson<ChartData>(`/api/chart/${symbol}?period=${period}&interval=${interval}`),

  getNews: (symbol: string) => fetchJson<NewsItem[]>(`/api/news/${symbol}`),

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
