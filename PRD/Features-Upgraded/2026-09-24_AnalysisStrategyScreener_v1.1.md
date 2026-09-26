# Analysis Strategy Screener — Patch v1.1

> **Document Version:** 1.1 — patch on `Environment/2026-09-24_AnalysisStrategyScreener_v1.0.md`,
> not a rewrite
> **Related:** `Environment/2026-09-24_AnalysisStrategyScreener_v1.0.md` (parent document, §4.2
> Screening Flow, §4.4 "See Details" page)
> **Source:** Review of the Technical Strategy screener list page (screenshot, US Market /
> Alligator-Profitunity filter, 8 of 40 symbols matching) plus a request to align the market
> pool selector with `yfinance`'s own market taxonomy
> **Status:** 🔜 Proposed — not implemented
> **Last Updated:** September 24, 2026
> **Audience:** Frontend Developer, Backend Developer

---

## 0. Summary of Changes

| # | Change | Touches |
|---|---|---|
| 1 | Remove the Global Search box from the Strategy Screener list page | Frontend only |
| 2 | Replace the fixed "Pool: {Dashboard market tab}" label with a selectable **market pool**, aligned to `yfinance`'s 8 official market regions | Frontend + backend (new pool definitions) |
| 3 | "See details" no longer opens the existing Chart → Single Chart page — it opens a **new, dedicated Strategy Detail Analysis page** | Frontend (new route) |
| 4 | That new page's chart does **not** require an RSI panel — minimum is Candlestick + MACD + the selected strategy's own overlay | Frontend (chart component) |
| 5 | That new page adds: Reason, Calculation Detail, Detailed Explanation, Entry Point Recommendation, and 3-level Support/Resistance (S1–S3) | Frontend + backend (S/R extended to 3 levels) |

None of these are implemented yet — verified against `Development` HEAD at time of writing, same
caveat as the parent document's §0 (this whole feature is still at the design stage).

---

## 1. Change #1 — Remove Global Search from the Screener Page

**Reason:** the screener page already narrows the symbol universe by Market + Strategy — a
free-text global search box next to it is redundant on this specific screen (it searches across
everything, not within the filtered result set) and adds visual noise to a page whose only job is
to show one filtered list.

**Scope:** this removes the `Search ⌘K` box **only from the Strategy Screener page**
(`frontend/app/(app)/analysis/screener/page.tsx`, per parent doc §6). It is **not** a request to
remove global search from the rest of the app (Sidebar/Watchlist search, `api.searchSymbol()`,
stays exactly as-is everywhere else).

| Component | Change |
|---|---|
| `frontend/app/(app)/analysis/screener/page.tsx` | Do not render the global search trigger in this page's header |

---

## 2. Change #2 — Market Pool Aligned to `yfinance`'s 8 Market Regions

### 2.1 Current State

The screener (per parent doc §4.3) reuses `MARKET_CONFIG[selectedMarket].moverPoolSymbols`,
which only has 3 entries today: `us`, `indonesia`, `crypto` (`frontend/lib/marketConfig.ts`,
existing). The screenshot's "Pool: US Market · 40 symbols" is exactly this — whichever Dashboard
market tab is active becomes the only pool available to the screener.

### 2.2 `yfinance`'s Own Market Taxonomy

`yfinance` exposes a `Market` domain class (`yfinance.Market(region)`) with a fixed
`MarketRegion` enum of **8 values**, verified directly from the library's source
(`yfinance/domain/market.py`, since the hosted docs site is unreachable from this environment,
same limitation noted in `Environment/2026-09-21_StrategyTrading_v1.0.md` §0):

```
US, GB, ASIA, EUROPE, RATES, COMMODITIES, CURRENCIES, CRYPTOCURRENCIES
```

> ⚠️ **Important nuance — `yfinance.Market` is not a stock screening universe.** This class
> returns **market status and major-index summaries** for a region (is the exchange open, what
> are its headline indices doing) — it does **not** return a list of individual equities to
> screen, the way `moverPoolSymbols` does today. Treating "8 markets" as "8 ready-made stock
> pools" would be inaccurate. This patch therefore uses the 8-region taxonomy as the **selector's
> shape** (what options the user sees), while each region's actual screenable symbol pool still
> needs the same kind of curation `Environment/2026-09-06_DashboardPage_v1.0.md` §5.2 already did
> for Indonesia's sector baskets (`sectorBaskets.ts`).

### 2.3 Proposed Pool Mapping

| Screener pool option | Maps to `yfinance` region | Symbol pool source |
|---|---|---|
| **US** | `US` | Existing `moverPoolSymbols.us` — unchanged |
| **Indonesia** | *(not a native `yfinance` region — IDX falls under `ASIA` broadly, but FinSight already treats it as its own market for product reasons, per `Environment/2026-09-06_DashboardPage_v1.0.md` §4.2)* | Existing `moverPoolSymbols.indonesia` — unchanged |
| **Asia (ex-Indonesia)** *(new)* | `ASIA` | New curated pool — needs its own sector-basket-style list (e.g. major Japan/Hong Kong/Singapore/Korea names) — **not yet defined, see §5** |
| **Europe** *(new)* | `EUROPE` / `GB` | New curated pool (e.g. FTSE 100 / DAX / CAC 40 constituents) — **not yet defined, see §5** |
| **Crypto** | `CRYPTOCURRENCIES` | Existing `moverPoolSymbols.crypto` — unchanged |
| **Currencies (Forex)** *(new)* | `CURRENCIES` | Finite, well-known list — reuse the same forex pair tickers already used by `ForexStrip.tsx` (`USDIDR=X`, `EURUSD=X`, etc., per `Environment/2026-09-06_DashboardPage_v1.0.md` §5.4) plus the full `/FX` list already catalogued in `Environment/2026-09-21_StrategyTrading_v1.0.md` (`EURCHF`, `GBPUSD`, `XAUUSD`, etc.) |
| **Commodities** *(new)* | `COMMODITIES` | Finite list of commodity futures tickers `yfinance` supports (e.g. `GC=F` gold, `CL=F` crude oil, `SI=F` silver) — **not yet defined, see §5** |
| **Rates** *(new)* | `RATES` | Finite list of bond/yield tickers (e.g. `^TNX` 10-Year Treasury Yield) — **not yet defined, see §5** |

**Why not a 1:1 mapping:** Indonesia stays as its own option (it's the product's primary market
and already has a curated pool) rather than being folded into "Asia," and 3 of the 8 regions
(Currencies, Commodities, Rates) are naturally **small finite instrument lists** rather than
"stocks to screen" — the same strategies (Alligator, Turtle, etc.) still apply to them since the
formulas only need OHLCV data, whatever the underlying instrument is.

### 2.4 UI Change

Replace the static "Pool: US Market · 40 symbols" text with a dropdown (same visual pattern as
the existing Strategy dropdown next to it), defaulting to whatever market tab is currently
selected elsewhere in the app, but independently changeable on this page:

```
[ Strategy: Alligator / Profitunity ▾ ]   [ Pool: US ▾ ]   → 8 of 40 symbols meet Alligator/Profitunity.
```

| Component | Change |
|---|---|
| `frontend/lib/marketConfig.ts` | Extend `MARKET_CONFIG` with the new pool entries from §2.3 (or a separate `SCREENER_POOLS` map, if keeping Dashboard's 3-tab config untouched is preferred — see §5 open question) |
| `frontend/app/(app)/analysis/screener/page.tsx` | Add a Pool `<select>`, independent from the global Market tab, defaulting to it |
| `backend/app/config/sectors.py` (existing, per `Environment/2026-09-06_DashboardPage_v1.0.md` §5.2) | Extend with the new region pools (Asia, Europe, Commodities, Rates) once symbol lists are confirmed (§5) |

---

## 3. Change #3 — "See Details" Opens a Dedicated Strategy Detail Analysis Page

### 3.1 Reason for the Change

Parent doc §4.2 step 7 originally proposed navigating to the existing
`/analysis/[symbol]?strategy=...` page (an extension of the existing single-symbol Analysis
page). This patch replaces that with a **new, purpose-built page**, decoupled from
**Chart → Single Chart** (`frontend/app/(app)/chart/[symbol]/page.tsx`, existing) entirely — the
existing Single Chart page keeps its current general-purpose role (any symbol, generic
indicators), while this new page's only job is showing **one symbol through the lens of one
selected strategy**, with the strategy-specific narrative content (§3.3) that a generic chart
page has no place for.

### 3.2 Route

```
frontend/app/(app)/analysis/strategy-detail/[strategy]/[symbol]/page.tsx   (new)
```

Reached from the screener's "See details" link (§0 change #3), or directly from the per-symbol
Technical Strategy page (parent doc §4.1) when a strategy is already selected there.

### 3.3 Page Content (Top to Bottom)

1. **Header** — shows which Technical Strategy is active for this view (the trailing request in
   the review, "Technical Analysis yang dipilih" / "the Technical Analysis that was selected") —
   e.g. `Alligator / Profitunity — AAPL`.

2. **Chart** — see §4 below for panel composition. Strategy overlay per the table already defined
   in parent doc §4.4 point 1 (Alligator's 3 lines, Turtle's channel, etc.) — unchanged, just
   relocated to this new page instead of the generic Single Chart page.

3. **Reason** — a short, symbol-specific statement of *why* this symbol matched (or didn't), e.g.
   "Lips crossed above Teeth 2 bars ago; AO crossed above zero on the latest bar." Derived
   directly from which of the strategy's conditions are currently `true` (same data as the
   Fulfillment table, parent doc §4.4 point 3, rephrased as one sentence instead of a table row).

4. **Calculation Detail** — the actual computed values behind the strategy's formula for this
   symbol right now, e.g. for Alligator: `Lips (MA5) = 2.566e+04`, `Teeth (MA8) = 2.566e+04`,
   `Jaw (MA13) = 2.505e+04`, `Awesome Oscillator = 37.28` — this is exactly the 4-card row
   already shown at the top of the existing Technical Strategy page in the reference screenshot;
   this patch keeps that card row but moves it onto this new dedicated page instead of leaving it
   embedded in the strategy list page.

5. **Detailed Explanation** — the strategy's rule description (parent doc §4.4 point 2, reused
   verbatim from `Environment/2026-09-21_StrategyTrading_v1.0.md` §1's formula write-ups).

6. **Entry Point Recommendation** — same descriptive, rule-derived (not prescriptive) format
   already specified in parent doc §4.4 point 4 ("Trade Plan Suggestion"), renamed here to match
   the requested label. Same compliance requirement applies without exception: this restates the
   strategy's own published entry condition, it does not tell the user to buy or sell (parent doc
   §4.4's disclaimer requirement, sourced from `Documentation/Documentation-Business.md` §5,
   carries over unchanged).

7. **Support & Resistance (S1–S3)** — the latest 3 support and 3 resistance levels for this
   symbol. **Backend change required:** `compute_support_resistance()` (existing, in
   `backend/app/indicators/technical.py`) currently returns only **2** levels each
   (`support: [s1, s2]`, `resistance: [r1, r2]`, per `Environment/2026-09-06_DashboardPage_v1.0.md`
   §5's original spec). This patch extends it to return **3** levels each, using the same local
   min/max extrema logic already in place — just extending the existing sort/slice from
   `[:2]` to `[:3]` and widening the fallback logic accordingly.

### 3.4 Code Changes

| Component | Change |
|---|---|
| `frontend/app/(app)/analysis/strategy-detail/[strategy]/[symbol]/page.tsx` (new) | Assembles chart (§4) + the 6 content sections above |
| `frontend/components/analysis/StrategyReason.tsx` (new) | Renders §3.3 point 3 |
| `frontend/components/analysis/CalculationDetail.tsx` (new) | Renders §3.3 point 4 (the 4-metric card row, relocated from the screener list page) |
| `frontend/components/analysis/StrategyExplanation.tsx` (per parent doc §6, unchanged) | Renders §3.3 point 5 |
| `frontend/components/analysis/EntryPointRecommendation.tsx` (renamed from `TradePlanSuggestion.tsx` in parent doc §6) | Renders §3.3 point 6 |
| `frontend/components/analysis/SupportResistancePanel.tsx` (existing, extended) | Render 3 rows (S1–S3, R1–R3) instead of 2 |
| `backend/app/indicators/technical.py` | `compute_support_resistance()` — extend from 2 to 3 levels each |
| `backend/app/api/schemas.py` | `SupportResistanceResponse` — `support`/`resistance` fields widen from `list[float | None]` (length 2) to length 3 |
| Screener list page (`.../screener/page.tsx`) | "See details" link target changes to the new route in §3.2 |

---

## 4. Change #4 — Chart Panel Requirements: MACD Minimum, RSI Optional

### 4.1 Current State

`CandlestickChart.tsx` (existing) always renders 3 panels: Price, RSI, MACD — RSI is not
currently optional anywhere in the app.

### 4.2 New Rule (Strategy Detail Analysis Page Only)

On the new page from §3, the chart must show, at minimum:
- **Panel 1:** Candlestick + the selected strategy's overlay (per parent doc §4.4 point 1 table)
- **Panel 2:** MACD — always shown, non-optional

**RSI panel is optional** — not required to be present. This keeps the chart focused on the
selected strategy's own signals (most of the 9 strategies in
`Environment/2026-09-21_StrategyTrading_v1.0.md` §1 don't use RSI at all — Alligator, Ichimoku,
Turtle, Guppy, SuperTrend, Heikin Ashi are all RSI-independent) instead of always forcing a
generic 3-panel layout regardless of which strategy is being viewed.

> **Scope check:** this rule applies specifically to the new Strategy Detail Analysis page (§3).
> The existing Chart → Single Chart page (`frontend/app/(app)/chart/[symbol]/page.tsx`) and its
> `CandlestickChart.tsx` component are **unchanged** — RSI still shows there as today, since that
> page is general-purpose, not strategy-specific.

### 4.3 Code Changes

| Component | Change |
|---|---|
| `frontend/components/analysis/StrategyChart.tsx` (new — a strategy-aware sibling of `CandlestickChart.tsx`, not a modification of it) | Renders Candlestick + strategy overlay + MACD; accepts an optional `showRsi` prop, default `false` |
| `frontend/app/(app)/analysis/strategy-detail/[strategy]/[symbol]/page.tsx` (new, per §3.2) | Uses `StrategyChart.tsx`, not `CandlestickChart.tsx` |

---

## 5. Open Questions

- [ ] **New pool symbol lists (§2.3):** Asia (ex-Indonesia), Europe, Commodities, and Rates pools
      have no curated symbol list yet — needs the same kind of sector-basket definition work
      already done for Indonesia (`Environment/2026-09-06_DashboardPage_v1.0.md` §5.2), which was
      itself flagged as a separate, non-trivial task there. This patch defines the selector shape,
      not the final lists.
  - [ ] **How much scope to launch with:** all 8 regions and once, or start with US + Indonesia +
        Crypto (already have pools) and add the other 5 incrementally?
- [ ] **`MARKET_CONFIG` vs. a separate `SCREENER_POOLS` map (§2.4):** should the screener's pool
      selector share the same config object as the Dashboard's market tabs (risking scope creep
      into Dashboard, which only ever needed 3 tabs), or should it be its own, screener-specific
      config? Leaning toward separate, but needs a decision before implementation.
- [ ] **3-level Support/Resistance (§3.3 point 7):** confirm 3 levels (not more) is the intended
      final count, and confirm the local-extrema method (existing) is acceptable, versus adding
      Camarilla pivots (`Environment/2026-09-21_StrategyTrading_v1.0.md` §1.6) as an alternative
      3-level method later.

---

## 6. Related Documents

- `Environment/2026-09-24_AnalysisStrategyScreener_v1.0.md` — parent document (screening flow,
  strategy list, backend screening endpoint — all unchanged by this patch)
- `Environment/2026-09-21_StrategyTrading_v1.0.md` §0, §1 — `yfinance` verification methodology
  reused in §2.2; strategy formulas reused in §3.3 points 3-5
- `Environment/2026-09-06_DashboardPage_v1.0.md` §4.2, §5.2, §5.4 — existing `MARKET_CONFIG` /
  sector-basket pattern this patch extends (§2), and `ForexStrip.tsx` pool reused for the new
  Currencies pool
- `Documentation/Documentation-Business.md` §5 — disclaimer requirement carried over unchanged
  to the renamed Entry Point Recommendation section (§3.3 point 6)