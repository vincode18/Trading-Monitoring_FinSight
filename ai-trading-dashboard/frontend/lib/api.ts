import {
  Alert,
  AnalysisScore,
  ChartData,
  EarningsCalendarItem,
  FearGreed,
  FundamentalCharts,
  FundamentalCriteria,
  FundamentalFitResult,
  FundamentalFreq,
  Fundamentals,
  Holding,
  MACrossAlert,
  MarketSummary,
  NewsItem,
  PortfolioSummary,
  QuoteSnapshot,
  RadarScore,
  SectorPerformance,
  SentimentScore,
  ShareholderAnalysis,
  FundamentalStrategyDetail,
  ScreenResult,
  StrategyCatalogItem,
  StrategyResult,
  SubscriptionInfo,
  SupportResistance,
  SymbolSearchResult,
  UserPreferences,
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
          : `Request failed (${res.status})`;
    throw new ApiError(detail || `Request failed (${res.status})`, res.status);
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

  getFundamentals: (symbol: string) =>
    fetchJson<Fundamentals>(`/api/analysis/fundamental/${encodeURIComponent(symbol)}`),

  getFundamentalCharts: (symbol: string, freq: FundamentalFreq) =>
    fetchJson<FundamentalCharts>(
      `/api/analysis/fundamental-charts/${encodeURIComponent(symbol)}?freq=${freq}`
    ),

  getShareholders: (symbol: string) =>
    fetchJson<ShareholderAnalysis>(`/api/analysis/shareholders/${encodeURIComponent(symbol)}`),

  checkFundamentalFit: (symbol: string, criteria: FundamentalCriteria) =>
    fetchJson<FundamentalFitResult>(
      `/api/analysis/fundamental-fit/${encodeURIComponent(symbol)}`,
      { method: 'POST', body: JSON.stringify(criteria) }
    ),

  listStrategies: () => fetchJson<StrategyCatalogItem[]>('/api/analysis/strategies'),

  getStrategy: (symbol: string, slug: string) =>
    fetchJson<StrategyResult>(
      `/api/analysis/strategy/${encodeURIComponent(symbol)}?slug=${encodeURIComponent(slug)}`
    ),

  listScreenStrategies: () => fetchJson<StrategyCatalogItem[]>('/api/analysis/screen-strategies'),

  screenStrategy: (
    strategy: string,
    symbols: string[],
    opts?: { pool?: 'all'; page?: number; pageSize?: number }
  ) => {
    const params = new URLSearchParams();
    if (opts?.page) params.set('page', String(opts.page));
    if (opts?.pageSize) params.set('page_size', String(opts.pageSize));
    const query = params.toString();
    return fetchJson<ScreenResult>(
      `/api/analysis/screen/${encodeURIComponent(strategy)}${query ? `?${query}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify(opts?.pool === 'all' ? { pool: 'all', symbols: [] } : { symbols }),
      }
    );
  },

  listFundamentalScreens: () =>
    fetchJson<StrategyCatalogItem[]>('/api/analysis/fundamental-screen-strategies'),

  screenFundamental: (
    strategy: string,
    symbols: string[],
    minDividendYield = 2,
    opts?: { pool?: 'all'; page?: number; pageSize?: number }
  ) => {
    const params = new URLSearchParams();
    if (opts?.page) params.set('page', String(opts.page));
    if (opts?.pageSize) params.set('page_size', String(opts.pageSize));
    const query = params.toString();
    return fetchJson<ScreenResult>(
      `/api/analysis/fundamental-screen/${encodeURIComponent(strategy)}${query ? `?${query}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify(
          opts?.pool === 'all'
            ? { pool: 'all', symbols: [], min_dividend_yield: minDividendYield }
            : { symbols, min_dividend_yield: minDividendYield }
        ),
      }
    );
  },

  getFundamentalStrategy: (symbol: string, strategy: string, minDividendYield = 2) =>
    fetchJson<FundamentalStrategyDetail>(
      `/api/analysis/fundamental-strategy/${encodeURIComponent(symbol)}?strategy=${encodeURIComponent(strategy)}&min_dividend_yield=${minDividendYield}`
    ),

  createAlert: (payload: { symbol: string; condition: string; threshold?: number }) =>
    fetchJson<Alert>('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listAlerts: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchJson<Alert[]>(`/api/alerts${q}`);
  },

  toggleAlert: (id: string, status: string) =>
    fetchJson<Alert>(`/api/alerts/${encodeURIComponent(id)}?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    }),

  deleteAlert: (id: string) =>
    fetchJson<{ deleted: boolean }>(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  checkAlerts: () => fetchJson<Alert[]>('/api/alerts/check'),

  addHolding: (payload: {
    symbol: string;
    quantity: number;
    avg_buy_price: number;
    buy_date: string;
    note?: string;
  }) =>
    fetchJson<Holding>('/api/portfolio/holdings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listHoldings: () => fetchJson<Holding[]>('/api/portfolio/holdings'),

  updateHolding: (
    id: string,
    payload: { quantity?: number; avg_buy_price?: number; note?: string }
  ) =>
    fetchJson<Holding>(`/api/portfolio/holdings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteHolding: (id: string) =>
    fetchJson<{ deleted: boolean }>(`/api/portfolio/holdings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getPortfolioSummary: () => fetchJson<PortfolioSummary>('/api/portfolio/summary'),

  updateProfile: (name: string) =>
    fetchJson<AuthUser>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  changePassword: (old_password: string, new_password: string) =>
    fetchJson<{ success: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password }),
    }),

  deleteAccount: () =>
    fetchJson<{ deleted: boolean }>('/api/auth/me', { method: 'DELETE' }),

  getPreferences: () => fetchJson<UserPreferences>('/api/settings/preferences'),

  updatePreferences: (payload: UserPreferences) =>
    fetchJson<UserPreferences>('/api/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getSubscription: () => fetchJson<SubscriptionInfo>('/api/settings/subscription'),
};

export { ApiError };
