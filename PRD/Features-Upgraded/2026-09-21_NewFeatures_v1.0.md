# New Features — Feature Expansion Ideas from yfinance

> **Document Version:** 1.1 — English translation of `2026-09-21_NewFeatures_v1.0.md`, with
> representative code snippets added to sections that were previously prose/table-only
> **File Code:** `2026-09-21_NewFeatures_v1_1`
> **Related:** `Environment/2026-09-06_DashboardPage_v1.0.md`, `Environment/2026-09-07_DashboardPage_v1.1.md`
> (dashboard already implemented — see commit `368ffb4`), `Documentation/Documentation-Program.md`
> §4.1–4.3
> **Source:** `yfinance` API reference — `Ticker` (`ticker.py`), `Sector`/`Industry`/`Market` (domain
> classes), `Screener`/`EquityQuery` — verified directly from source at
> `github.com/ranaroussi/yfinance` (the official docs at `ranaroussi.github.io` were not
> reachable from this environment, so verification was done by reading source code rather than
> the documentation site)
> **Status:** ✅ Mandatory items implemented (War Room, Navbar Logo + Hamburger); yfinance backlog remains idea-only
> **Last Updated:** September 22, 2026
> **Audience:** Product Owner, Frontend Developer, Backend Developer

---

## 0. Selection Principle

Same approach as `2026-09-06_DashboardPage_v1.0.md`: **every idea below uses `yfinance`, which
is already a core dependency** — no new API keys, no new Python dependencies (unless explicitly
noted). Each idea has been checked against the `yfinance` version this project uses
(`>=0.2.54`, `backend/requirements.txt`) by reading the source code directly.

**Surface area of `yfinance` the project has not touched at all yet** (baseline — see the
"Current Code Status" column per idea for detail):

| Class/Domain | Relevant Method/Attribute | Used by Project? |
|---|---|---|
| `Ticker` | `recommendations`, `recommendations_summary`, `upgrades_downgrades` | ❌ Not yet |
| `Ticker` | `analyst_price_targets`, `earnings_estimate`, `revenue_estimate`, `growth_estimates`, `eps_trend`, `eps_revisions` | ❌ Not yet |
| `Ticker` | `major_holders`, `institutional_holders`, `mutualfund_holders`, `insider_transactions`, `insider_purchases`, `insider_roster_holders` | ❌ Not yet |
| `Ticker` | `income_stmt`/`balance_sheet`/`cash_flow` (+ `quarterly_*`/`ttm_*`) | ❌ Not yet |
| `Ticker` | `sustainability` (ESG score) | ❌ Not yet |
| `Ticker` | `options`, `option_chain()` | ❌ Not yet |
| `Ticker` | `dividends`, `splits`, `capital_gains`, `actions` | ❌ Not yet (only used implicitly via `history()` with `auto_adjust`) |
| `Ticker` | `calendar`, `earnings_dates` | 🟡 Partial — `calendar` is already fully used for Earnings Calendar (`get_earnings_calendar()`); `earnings_dates` (a historical DataFrame, different from `calendar`) is not |
| `Sector` / `Industry` (new domain class) | `overview`, `top_companies`, `research_reports`, `top_etfs`, `top_mutual_funds`, `industries` | ❌ Not yet — the project currently uses a **static manual** sector mapping (`frontend/lib/sectorBaskets.ts`, `backend/app/config/sectors.py`), not live data from `yfinance` |
| `Market` (new domain class) | `status` (open/closed hours + timezone per exchange), `summary` (index summary per exchange) | ❌ Not yet — market status (`market_state`) currently comes only from `fast_info` per individual symbol |
| `EquityQuery` + `screen()` (Screener) | Yahoo's built-in screener categories (`day_gainers`, `most_actives`, etc. — exact names need verification at implementation time) | ❌ Not yet — the Movers panel (`/api/market/volume-movers`, `/api/market/top-gainers`) currently **loops manually** over each symbol in the pool, instead of calling Yahoo's screener directly |
| `Ticker` | `sec_filings`, `isin`, `valuation` | ❌ Not yet |
| `WebSocket`/`AsyncWebSocket` | Real-time streaming quotes | ❌ Not yet — **remains a non-goal** (see §7, already explicitly rejected in `2026-09-06_DashboardPage_v1.0.md` §1.1) |

---

## 1. Chart — War Room (Multi-Symbol Monitor) ⭐ Mandatory

### 1.1 Goal

A new view inside the **Chart** page that lets users monitor **up to 6 symbols at once** in a
single grid — for traders who need to compare several stocks/assets side by side, instead of
one at a time like the current detail chart.

### 1.2 Current State

`frontend/app/(app)/chart/[symbol]/page.tsx` only supports **one symbol at a time** — picking
another symbol via the dropdown replaces the whole page (re-fetches chart, RSI, MACD for the
new symbol) instead of adding a new panel alongside it.

### 1.3 Structure — War Room

**New route:** `frontend/app/(app)/chart/war-room/page.tsx`, reached via a new button on
`ChartPage` (e.g. `⊞ War Room` next to the existing symbol-picker dropdown).

**Responsive grid layout** — follows the number of symbols selected:

| Number of Symbols | Grid |
|---|---|
| 1–2 | `1 column` (vertical stack) or `2 columns` |
| 3–4 | `2 columns × 2 rows` |
| 5–6 | `3 columns × 2 rows` |

- Each grid cell holds a **mini candlestick chart** (not the full 3-panel chart like the detail
  page — price panel only, so all 6 charts fit on one screen without excessive scrolling) plus
  a compact header (symbol, current price, `change_pct`, `positive`/`negative` color).
- Clicking any cell → navigates to `chart/{symbol}` (the full 3-panel detail chart) for deeper
  single-symbol analysis.
- A **global** timeframe control sits above the grid (one `TimeframeToolbar.tsx`, existing,
  reused from the Chart page) — changing the period/interval applies to **all 6 charts at
  once**, so comparisons stay apples-to-apples.
- Symbol picker: multi-select from the user's watchlist (`useWatchlist()` context, existing) +
  manual search (reuses `api.searchSymbol()`, existing) — capped at 6 selected symbols, the add
  button disables once the 6th is picked.
- The War Room symbol selection is persisted to `localStorage` (new key, e.g.
  `finsight-warroom-symbols`) — following the same persistence pattern already used for the
  watchlist in `lib/watchlist-context.tsx`.

### 1.4 Data Source & Performance

- **No new endpoint needed** — each panel calls `api.getChart(symbol, period, interval)`
  (existing, `GET /api/chart/{symbol}`) in parallel, one request per symbol (max 6 concurrent
  requests, reasonable for the 30-second polling pattern already used across the project).
- Mini charts are rendered with `lightweight-charts` (already a dependency in
  `frontend/package.json`), a **lightweight** version of the existing `CandlestickChart.tsx` —
  only `addCandlestickSeries()`, no separate MA/Bollinger/RSI/MACD overlays, so rendering 6
  charts at once stays performant.
- Rate limiting: the `/api/chart/{symbol}` endpoint is already TTL-cached on the backend
  (`ttl_cache`, existing) — 6 different symbols still means 6 separate cache keys, no new
  problem there, but it's worth checking against the `slowapi` limit (`30/minute` per IP,
  `backend/app/core/rate_limit.py`) — 6 concurrent requests every 30 seconds works out to 12
  requests/minute from War Room alone, still under the limit as long as no other requests to
  the same endpoint stack up from the same user.

### 1.5 Code Changes

| Component | Change |
|---|---|
| `frontend/app/(app)/chart/war-room/page.tsx` (new) | War Room page, responsive grid (§1.3) |
| `frontend/components/chart/MiniCandlestickChart.tsx` (new) | Lightweight version of `CandlestickChart.tsx`, price panel only |
| `frontend/components/chart/WarRoomSymbolPicker.tsx` (new) | Multi-select symbol picker, max 6, reuses `api.searchSymbol()` |
| `frontend/app/(app)/chart/[symbol]/page.tsx` | Add `⊞ War Room` button to the header (existing file) |
| `frontend/lib/warroom-context.tsx` (new, optional) | State for the 6 selected symbols + `localStorage` sync, or a local `useState` on the War Room page alone if it doesn't need to be shared across pages |

### 1.6 Code Snippet — `MiniCandlestickChart.tsx` (Lightweight Price-Only Panel)

A trimmed-down version of the existing `CandlestickChart.tsx` — only the candlestick series,
no MA/Bollinger/RSI/MACD overlays, so it stays cheap to render six at once.

```tsx
// frontend/components/chart/MiniCandlestickChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { ChartData } from '@/types/market';

interface MiniCandlestickChartProps {
  data: ChartData;
  height?: number;
}

const CHART_COLORS = {
  background: '#0E1117',
  grid: '#1F252E',
  text: '#8B949E',
  positive: '#00E676',
  negative: '#FF5252',
};

export function MiniCandlestickChart({ data, height = 180 }: MiniCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current?.remove();

    const chart = createChart(containerRef.current, {
      height,
      width: containerRef.current.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      timeScale: { borderColor: CHART_COLORS.grid, visible: false },
      rightPriceScale: { borderColor: CHART_COLORS.grid },
      handleScroll: false, // War Room grid cells are read-only, no independent pan
      handleScale: false,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.positive,
      downColor: CHART_COLORS.negative,
      borderVisible: false,
      wickUpColor: CHART_COLORS.positive,
      wickDownColor: CHART_COLORS.negative,
    });

    candleSeries.setData(
      data.candles.map((c) => ({
        time: c.date.split('T')[0],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return <div ref={containerRef} className="w-full" />;
}
```

### 1.7 Code Snippet — War Room Grid Cell (Parallel Fetch Pattern)

Illustrates how each grid cell independently fetches its own chart data via SWR, so the 6
requests run in parallel rather than sequentially blocking each other.

```tsx
// Excerpt from frontend/app/(app)/chart/war-room/page.tsx
import useSWR from 'swr';
import { api } from '@/lib/api';
import { MiniCandlestickChart } from '@/components/chart/MiniCandlestickChart';
import { formatPrice, formatPercent, isPositive } from '@/lib/format';

function WarRoomCell({ symbol, period, interval }: { symbol: string; period: string; interval: string }) {
  const { data: chartData, isLoading } = useSWR(
    ['war-room-chart', symbol, period, interval],
    () => api.getChart(symbol, period, interval),
    { refreshInterval: 30_000 } // same 30s polling pattern as the rest of the dashboard
  );

  const { data: quote } = useSWR(
    ['war-room-quote', symbol],
    () => api.getQuote(symbol),
    { refreshInterval: 30_000 }
  );

  return (
    <div className="rounded border border-border bg-panel p-2">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-xs font-semibold text-text-primary">{symbol}</span>
        {quote && (
          <span className={`font-mono text-xs ${isPositive(quote.change) ? 'text-positive' : 'text-negative'}`}>
            {formatPrice(quote.last_price)} ({formatPercent(quote.change_pct)})
          </span>
        )}
      </div>
      {isLoading && <div className="flex h-[180px] items-center justify-center text-xs text-text-muted">Loading...</div>}
      {chartData && <MiniCandlestickChart data={chartData} />}
    </div>
  );
}
```

---

## 2. Navbar/Sidebar — Logo on Collapse + Hamburger Icon ⭐ Mandatory

### 2.1 Current State

`frontend/components/app/AppSidebarNav.tsx`:
- When collapsed (`collapsed === true`), the header shows a **text abbreviation** `"FS"` (line
  154), not a graphical logo mark.
- The collapse-toggle button uses `ChevronIcon` (lines 45–64) — a `<` arrow that rotates 180°
  on toggle, not a hamburger icon (☰).

### 2.2 Changes

1. **Logo when collapsed:** Replace the `"FS"` text (`<div className="text-xs font-bold ...">FS</div>`)
   with a **graphical logo mark** (inline SVG or a small `<img>`, 24×24px) — consistent with the
   FinSight brand. Since there's no final logo asset in the repo yet, use a simple SVG monogram
   (a candlestick/geometric mark in `positive` color over `panel`) as a placeholder until the
   real asset is available — the same pattern as the `placehold.co` placeholders in
   `Environment/2026-09-06_OnboardingLoginPage_v2.0.md` §3, but because this is a small,
   frequently-rendered UI element (not page content), an inline SVG in code is preferable to an
   external fetch.
2. **Hamburger icon for the toggle:** Replace `ChevronIcon` with a 3-line hamburger icon (☰) for
   **both** states (collapsed and expanded) — the hamburger convention is more universally
   recognized as a "toggle menu" than an arrow, and doesn't need a rotation animation (state can
   be conveyed via `aria-expanded`/tooltip alone, not by the icon visually changing direction).

```tsx
// Replaces ChevronIcon in AppSidebarNav.tsx
function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

### 2.3 Code Snippet — Placeholder `LogoMark.tsx` (SVG Monogram)

A minimal placeholder mark referenced in §2.2 point 1 — swap for the real brand asset once
available, without changing the call sites that render `<LogoMark />`.

```tsx
// frontend/components/app/LogoMark.tsx
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="FinSight">
      <rect width="24" height="24" rx="6" fill="#161B22" />
      {/* Simple candlestick monogram placeholder — replace with final brand asset */}
      <rect x="7" y="9" width="3" height="8" rx="1" fill="#00E676" />
      <line x1="8.5" y1="6" x2="8.5" y2="9" stroke="#00E676" strokeWidth="1.5" />
      <line x1="8.5" y1="17" x2="8.5" y2="19" stroke="#00E676" strokeWidth="1.5" />
      <rect x="14" y="6" width="3" height="6" rx="1" fill="#00E676" opacity="0.6" />
      <line x1="15.5" y1="4" x2="15.5" y2="6" stroke="#00E676" strokeWidth="1.5" opacity="0.6" />
      <line x1="15.5" y1="12" x2="15.5" y2="14" stroke="#00E676" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
```

### 2.4 Code Changes

| Component | Change |
|---|---|
| `AppSidebarNav.tsx` — `<Link href="/dashboard">` block (lines ~148–161) | Replace the collapsed `"FS"` text render with `<LogoMark />` (new SVG component, §2.3) |
| `AppSidebarNav.tsx` — `ChevronIcon` function (lines 45–64) | Replaced/supplemented with `HamburgerIcon` (§2.2), used on the toggle button (line ~170) |
| `frontend/components/app/LogoMark.tsx` (new, optionally split out) | Reusable SVG logo mark component — could also be reused in `Navbar.tsx` (marketing) and `AuthCard.tsx` for further consistency (outside the mandatory scope right now) |

---

## 3. Watchlist — Ideas from `yfinance`

| Idea | `yfinance` Source | Code Status | Notes |
|---|---|---|---|
| Compact **Analyst Rating** badge per row (e.g. "Buy · 24 analysts") | `Ticker.recommendations_summary` | ❌ Not yet | Dense table — one small badge is enough, not a full panel (that's covered under the Analysis idea in §4) |
| **Dividend Yield** column | `Ticker.info` (`dividendYield`) or `Ticker.dividends` (historical) | ❌ Not yet | Relevant for dividend-stock watchlists (many IDX symbols have high dividend yields) |
| Asset-type filter on search results (`Equity`/`ETF`/`Crypto`/`Index`/`Currency`) | `search_symbol()` (existing) already gets the `type` field from `yf.Search`, **just not used for UI filtering yet** | 🟡 Partial | Pure UI fix — `SymbolSearchResult.type` is already in the response, just needs a filter dropdown added to `Sidebar`/watchlist search |

### 3.1 Code Snippet — Analyst Rating Badge (Backend Helper)

```python
# backend/app/services/market_data.py — new function
def get_analyst_rating_summary(symbol: str) -> dict | None:
    """
    Compact analyst consensus for a watchlist-row badge (e.g. "Buy · 24 analysts").
    Wraps Ticker.recommendations_summary — column names below are a first guess and
    MUST be verified against a live yfinance response before shipping (same caveat
    pattern as yfinance.Calendars in 2026-09-07_DashboardPage_v1.3.md §2.3).
    """
    ticker = yf.Ticker(symbol)
    try:
        df = ticker.recommendations_summary
    except Exception:
        return None

    if df is None or df.empty:
        return None

    latest = df.iloc[0]  # most recent period, typically "0m"
    total_analysts = sum(
        latest.get(col, 0) or 0
        for col in ("strongBuy", "buy", "hold", "sell", "strongSell")
    )
    if total_analysts == 0:
        return None

    # Simple majority-vote label — real UI badge text, not a recommendation to act on
    counts = {
        "Strong Buy": latest.get("strongBuy", 0) or 0,
        "Buy": latest.get("buy", 0) or 0,
        "Hold": latest.get("hold", 0) or 0,
        "Sell": latest.get("sell", 0) or 0,
        "Strong Sell": latest.get("strongSell", 0) or 0,
    }
    consensus_label = max(counts, key=counts.get)

    return {
        "symbol": symbol,
        "consensus": consensus_label,
        "analyst_count": int(total_analysts),
    }
```

### 3.2 Code Snippet — Asset-Type Filter (Frontend, Client-Side)

```tsx
// Excerpt from Sidebar.tsx search results rendering
const ASSET_TYPE_LABELS: Record<string, string> = {
  EQUITY: 'Stocks',
  ETF: 'ETFs',
  CRYPTOCURRENCY: 'Crypto',
  INDEX: 'Indices',
  CURRENCY: 'Currency',
};

const [assetTypeFilter, setAssetTypeFilter] = useState<string | null>(null);

const filteredResults = assetTypeFilter
  ? searchResults.filter((r) => r.type === assetTypeFilter)
  : searchResults;

// Filter chips rendered above the results list:
<div className="flex gap-1">
  {Object.entries(ASSET_TYPE_LABELS).map(([type, label]) => (
    <button
      key={type}
      onClick={() => setAssetTypeFilter(assetTypeFilter === type ? null : type)}
      className={`rounded-sm px-2 py-0.5 text-xs ${
        assetTypeFilter === type ? 'bg-positive text-canvas' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

---

## 4. Analysis (Overview & Detail) — Ideas from `yfinance`

The Analysis page (`/analysis/[symbol]`, already has `ScoreGauge`, `RadarChart`,
`SupportResistancePanel`, existing) is the most natural home for fundamental/research data the
project hasn't touched at all yet:

| Idea | `yfinance` Source | Code Status | Suggested Priority |
|---|---|---|---|
| **Analyst Ratings & Price Target panel** — Buy/Hold/Sell consensus, analyst count, price target (low/mean/high) | `recommendations`, `recommendations_summary`, `analyst_price_targets`, `upgrades_downgrades` (rating change history) | ❌ Not yet | High — complements `ScoreGauge` (internal score) with external analyst opinion, clearly a different source (disclaimer needs to state this is third-party opinion, not a FinSight score) |
| **Fundamentals Snapshot panel** — revenue, net income, total assets/liabilities from the last 4 quarters | `income_stmt`, `balance_sheet`, `cash_flow` (+ `quarterly_*`) | ❌ Not yet | Medium — useful for stocks (not crypto/index), needs UI logic to auto-hide for non-equity symbols |
| **Ownership & Insider Activity panel** — institutional/insider ownership, recent insider transactions | `major_holders`, `institutional_holders`, `insider_transactions` | ❌ Not yet | Medium — this data is often sparse/incomplete for IDX stocks (a data-source limitation, same caveat noted for Earnings Calendar in `PRD-S-002_Enhancement-system_EarningCalendar.md`) |
| **Growth & Estimates panel** — analyst EPS/revenue projections for upcoming quarters | `earnings_estimate`, `revenue_estimate`, `growth_estimates`, `eps_trend`, `eps_revisions` | ❌ Not yet | Low — nice-to-have, complex analyst projection data to summarize concisely |
| **ESG/Sustainability score badge** | `sustainability` | ❌ Not yet | Low — limited coverage (mostly US large-cap), relevance to the IDX target market needs validation first |
| **Options Chain tab** — strike prices, open interest, implied volatility for symbols with listed options | `options` (list of expiry dates) + `option_chain(date)` (`.calls`/`.puts`) | ❌ Not yet | Low — only relevant for large US stocks (options aren't common on IDX), large scope (needs a new options-table UI) |
| **Dividend & Stock Split overlay** on the chart (vertical markers on ex-dividend/split dates) | `dividends`, `splits` (both Series are already available via the `Ticker` object, just need exposing) | ❌ Not yet | Medium — a natural complement to the existing chart, `lightweight-charts` supports markers (`setMarkers()`) |

### 4.1 Code Snippet — Fundamentals Snapshot (Backend)

```python
# backend/app/services/market_data.py — new function
def get_fundamentals_snapshot(symbol: str) -> dict | None:
    """
    Last-4-quarters revenue/net income/assets/liabilities snapshot.
    Row labels below (e.g. "Total Revenue", "Net Income") are a first guess based on
    yfinance's typical naming convention — MUST be verified against a live response
    before shipping (see §7 verification checklist pattern from
    2026-09-07_DashboardPage_v1.3.md §2.3, same caveat applies here).
    """
    ticker = yf.Ticker(symbol)
    try:
        income = ticker.quarterly_income_stmt
        balance = ticker.quarterly_balance_sheet
    except Exception:
        return None

    if income is None or income.empty:
        return None

    quarters = income.columns[:4]  # most recent 4 quarters
    result = {"symbol": symbol, "quarters": []}

    for q in quarters:
        entry = {
            "period_end": str(q.date()) if hasattr(q, "date") else str(q),
            "revenue": _safe_get(income, "Total Revenue", q),
            "net_income": _safe_get(income, "Net Income", q),
        }
        if balance is not None and not balance.empty and q in balance.columns:
            entry["total_assets"] = _safe_get(balance, "Total Assets", q)
            entry["total_liabilities"] = _safe_get(balance, "Total Liabilities Net Minority Interest", q)
        result["quarters"].append(entry)

    return result


def _safe_get(df, row_label: str, col) -> float | None:
    try:
        value = df.loc[row_label, col]
        return float(value) if value is not None else None
    except (KeyError, ValueError, TypeError):
        return None
```

### 4.2 Code Snippet — Dividend/Split Chart Markers (Frontend)

```tsx
// Excerpt from CandlestickChart.tsx — adds vertical markers for dividend/split events
import { createSeriesMarkers } from 'lightweight-charts';

function addCorporateActionMarkers(
  candleSeries: ISeriesApi<'Candlestick'>,
  dividends: { date: string; amount: number }[],
  splits: { date: string; ratio: string }[]
) {
  const markers = [
    ...dividends.map((d) => ({
      time: d.date.split('T')[0],
      position: 'aboveBar' as const,
      color: '#00E676',
      shape: 'circle' as const,
      text: `Div ${d.amount}`,
    })),
    ...splits.map((s) => ({
      time: s.date.split('T')[0],
      position: 'aboveBar' as const,
      color: '#5EA1FF',
      shape: 'square' as const,
      text: `Split ${s.ratio}`,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  createSeriesMarkers(candleSeries, markers);
}
```

---

## 5. Dashboard — Ideas from `yfinance` (New Domain Classes)

The dashboard is already complete per `2026-09-06_DashboardPage_v1.0.md` (Market Overview,
Sector Heatmap, Movers, Sentiment Gauge, Forex, MA Cross Alerts, Earnings Calendar — all
implemented). The ideas below use **`yfinance` domain classes the project has never touched**
(`Sector`, `Industry`, `Market`, `EquityQuery`/`screen()`):

| Idea | `yfinance` Source | Code Status | Notes |
|---|---|---|---|
| **Live sector data** replacing/supplementing the static mapping | `yf.Sector(key).overview`, `.top_companies`, `.research_reports` | ❌ Not yet — `SectorHeatmap.tsx` currently uses a **hardcoded manual** symbol basket (`sectorBaskets.ts`) | Could reduce maintenance (no manual updates to the per-sector symbol list needed), but `yf.Sector` is US-focused (GICS) — the Indonesia tab would still need a manual basket, so this is a **supplement** for the US tab, not a full replacement |
| **Market Status widget** (open/closed + exchange hours) | `yf.Market(region).status` | ❌ Not yet | Market status currently comes only from per-symbol `market_state` inference (`fast_info`) — this widget could become a global indicator in `TickerBar.tsx` ("NYSE: Open · IDX: Closed"), more accurate than per-symbol inference |
| **Movers via Yahoo Screener** as an alternative to the current movers panel | `yf.screen()` + `EquityQuery`/built-in categories (`day_gainers`, `most_actives`, etc.) | ❌ Not yet — the existing Movers panel (`MoversPanel.tsx`) **loops manually** over each symbol in the pool | Potentially more efficient (1 screener request vs. N per-symbol requests) **for the US market**; for IDX, the screener's coverage of the Indonesian exchange needs verification before it's treated as a replacement — a strong candidate for further research, not a direct swap of the existing implementation |

### 5.1 Code Snippet — Market Status Widget (Backend)

```python
# backend/app/services/market_data.py — new function
def get_market_status(region: str = "US") -> dict | None:
    """
    Open/closed status + exchange hours for a region, via yfinance's Market domain class.
    Field names are a first guess — verify against a live response before shipping.
    """
    try:
        market = yf.Market(region)
        status = market.status
    except Exception:
        return None

    if not status:
        return None

    return {
        "region": region,
        "is_open": status.get("isMarketOpen") or status.get("is_open"),
        "exchange": status.get("exchange"),
        "timezone": status.get("timezone"),
    }
```

### 5.2 Code Snippet — Screener-Based Movers (Proof of Concept, US Only)

```python
# backend/app/services/market_data.py — candidate replacement for the manual-loop
# movers implementation, US market only until IDX coverage is verified (see notes above)
def get_movers_via_screener(category: str = "day_gainers", limit: int = 10) -> list[dict]:
    """
    Fetch movers via Yahoo's built-in screener instead of looping the mover pool.
    `category` must match one of yfinance's predefined query names — verify the exact
    list against the installed yfinance version before relying on this in production.
    """
    try:
        results = yf.screen(category, count=limit)
    except Exception:
        return []

    quotes = results.get("quotes", [])
    return [
        {
            "symbol": q.get("symbol"),
            "name": q.get("shortName") or q.get("longName"),
            "last_price": q.get("regularMarketPrice"),
            "change_pct": q.get("regularMarketChangePercent"),
        }
        for q in quotes
    ]
```

---

## 6. News — Ideas from `yfinance`

| Idea | `yfinance` Source | Code Status | Notes |
|---|---|---|---|
| **SEC Filings** links related to a symbol (US stocks only) | `Ticker.sec_filings` | ❌ Not yet | Only relevant for the US tab — needs to auto-hide for IDX/crypto symbols that don't have this data |

### 6.1 Code Snippet — SEC Filings Panel (Backend)

```python
# backend/app/services/news_data.py — new function
def get_sec_filings(symbol: str, limit: int = 5) -> list[dict]:
    """
    Recent SEC filings for a US-listed symbol. Returns an empty list (not an error)
    for symbols without filings data (IDX stocks, crypto, indices) — the frontend
    should treat an empty list as "hide this panel", not as an error state.
    """
    ticker = yf.Ticker(symbol)
    try:
        filings = ticker.sec_filings
    except Exception:
        return []

    if not filings:
        return []

    return [
        {
            "type": f.get("type"),
            "title": f.get("title"),
            "date": f.get("date"),
            "url": f.get("edgarUrl") or f.get("exhibitUrl"),
        }
        for f in filings[:limit]
    ]
```

---

## 7. Ideas Deliberately Not Prioritized (Noted, Not Rejected)

| Idea | `yfinance` Source | Reason Not Prioritized |
|---|---|---|
| Real-time streaming quotes | `yf.WebSocket`/`AsyncWebSocket` | Remains an explicit non-goal — the SWR polling architecture already used throughout the project is sufficient for research use cases (not order execution); moving to WebSocket is a major architectural change outside this document's scope |
| `funds_data`, `valuation`, `isin` | `Ticker.funds_data`, `.valuation`, `.isin` | Usefulness for the product context (researching individual stocks/crypto/indices) isn't clear yet — noted for reference, not actively proposed |

---

## 8. Priority Summary

| Priority | Item |
|---|---|
| ⭐ Mandatory (explicit requirement) | War Room (§1), Navbar Logo + Hamburger (§2) |
| High | Analyst Ratings & Price Target panel (§4) |
| Medium | Fundamentals Snapshot, Ownership & Insider Activity, Dividend/Split overlay (§4); Market Status widget (§5) |
| Low | Growth & Estimates, ESG Badge, Options Chain (§4); Live sector data, Movers via Screener (§5, needs further IDX-coverage research) |
| Noted, not prioritized | Real-time streaming, `funds_data`/`valuation`/`isin` (§7) |

---

## 9. Related Documents

- `Environment/2026-09-06_DashboardPage_v1.0.md` / `Environment/2026-09-07_DashboardPage_v1.1.md`
  — dashboard spec that's already implemented (the basis for the "Current Code Status" column
  in this document)
- `PRD/Enhancement-System/PRD-S-002_Enhancement-system_EarningCalendar.md` — Earnings Calendar
  implementation (reference for the successful `yfinance.Ticker().calendar` integration
  pattern, used as a style guide for the fundamental/ownership ideas in §4)
- `Environment/2026-09-21_AddedFeatures_v1.1.md` — Alerts/Portfolio/Settings dev tasks (separate
  from this document)
- `Documentation/Documentation-Program.md` §4.1, §4.3 — the `market_data.py`/`technical.py`
  modules this document builds on