# Analysis Strategy Screener

> **Document Version:** 1.0
> **Related:** `Environment/2026-09-21_StrategyTrading_v1.0.md` (source of the 9 technical
> strategy formulas this feature screens against), `Environment/2026-09-06_DashboardPage_v1.0.md`
> §4.2-4.3 (Market tabs / `MARKET_CONFIG` / `moverPoolSymbols` — reused as the screening universe),
> `Environment/2026-09-21_AddedFeatures_v1.0.md` §3 (Settings/Subscription — the countdown timer
> change in §3 of this document lives in the same sidebar area as that work)
> **Source:** Mockup screenshot of the FinSight "Detail Technical" page (Bill Williams
> Alligator/Profitunity strategy view) plus verbal requirements
> **Status:** 🔜 Proposed — not implemented (verified against current `Development` code, see §0)
> **Last Updated:** September 24, 2026
> **Audience:** Frontend Developer, Backend Developer, Product Owner

---

## 0. Verification Against Current Code

The screenshot shows a sidebar with `War Room`, `Alerts`, `Portfolio`, `Settings` all active
(no "Soon" badge), an `Analysis` menu split into `Overview Stocks` / `Technical Analysis` /
`Fundamental Analysis` / `Earnings Calendar`, and a membership countdown showing
`11d 07:48:31`. Checked against the `Development` branch HEAD at time of writing:

| Element in screenshot | Actual code state |
|---|---|
| `War Room`, `Alerts`, `Portfolio`, `Settings` sidebar items | ❌ Not built — `AppSidebarNav.tsx` still has all three as `soon: true, href: '#'` (per `Environment/2026-09-21_AddedFeatures_v1.0.md`, not yet implemented); `War Room` is spec'd in `Environment/2026-09-21_NewFeatures_v1.0.md` §1 but not built |
| `Analysis` split into `Technical Analysis` / `Fundamental Analysis` sub-groups | ❌ Not built — `AppSidebarNav.tsx` still has a flat `Analysis` entry with children `Overview` and `Earnings Calendar` only. There is one single-symbol page today, `frontend/app/(app)/analysis/[symbol]/page.tsx`, showing `ScoreGauge`/`RadarChart`/`SupportResistancePanel`/`IndicatorSignalRow` — this is the closest existing equivalent to "Detail Technical" |
| `Detail Technical` — Bill Williams Alligator strategy dropdown, condition table (BUAYA1-3, PTS1-3, FR1) | ❌ Not built — the Alligator/Profitunity formulas and signal codes are spec'd in `Environment/2026-09-21_StrategyTrading_v1.0.md` §1.1 but no code exists yet |
| `Detail Fundamental` | ❌ Not built — no fundamental-data panel exists anywhere in the codebase yet (ideas only, in `Environment/2026-09-21_NewFeatures_v1.0.md` §4) |
| Membership countdown `11d 07:48:31` | ❌ Not built — no countdown/timer component exists in `AppSidebarNav.tsx` today; the `Subscription` model already exists in `backend/prisma/schema.prisma` but has zero UI (confirmed in `Environment/2026-09-21_AddedFeatures_v1.0.md` §3.1) |
| Per-market pool of stocks (`moverPoolSymbols`) | ✅ **Already exists** — `frontend/lib/marketConfig.ts` + `frontend/lib/sectorBaskets.ts` (`unionSectorSymbols()`) already build a per-market symbol universe, currently consumed by the Dashboard Movers panel. This is directly reusable as the screening universe for this feature (see §4.2) |

**Conclusion:** this document specifies a **target state** that assembles pieces from three
earlier documents (`StrategyTrading` strategy formulas, `AddedFeatures` Alerts/Portfolio/Settings
shell, `NewFeatures` War Room and Analysis ideas) into one coherent screener feature, plus two
small independent changes (renaming, countdown format). None of it is built yet.

---

## 1. Summary of Changes

| # | Change | Category |
|---|---|---|
| 1 | Rename "Detail Technical" → **"Technical Strategy"**, "Detail Fundamental" → **"Fundamental Strategy"** | Rename |
| 2 | Membership countdown shows **days left only** (e.g. `11 days left`), not hours/minutes/seconds | UI simplification |
| 3 | **Technical Strategy** and **Fundamental Strategy** become market-wide **screeners**: pick a Market tab + a strategy → auto-filter every stock in that market against the strategy's criteria → result list → "See Details" opens the Chart pre-loaded with that strategy's overlay, a criteria-fulfillment breakdown, and a suggested trade plan | New feature |

---

## 2. Change #1 — Rename "Detail Technical" / "Detail Fundamental"

Purely a label change, but it reflects a real shift in what the page **is**: today's page shows
one fixed scoring view for one symbol (`compute_analysis_score()`, existing). Once Change #3
lands, the same page becomes strategy-aware (the user picks *which* strategy's view they're
looking at — Alligator, Turtle, Minervini, etc.), so "Strategy" is the more accurate name than
"Detail".

| Where | Before | After |
|---|---|---|
| `AppSidebarNav.tsx` — Analysis submenu label | `Detail Technical` | `Technical Strategy` |
| `AppSidebarNav.tsx` — Analysis submenu label | `Detail Fundamental` | `Fundamental Strategy` |
| Page `<h1>` on `frontend/app/(app)/analysis/[symbol]/page.tsx` | *(currently just "Analysis")* | `Technical Strategy` |
| New page `frontend/app/(app)/analysis/fundamental/[symbol]/page.tsx` | *(does not exist)* | `Fundamental Strategy` |

No backend change — this is a frontend-only rename plus the route restructuring described in
§4.1.

---

## 3. Change #2 — Membership Countdown: Days Left Only

**Current state:** no such component exists (§0). This spec applies to whichever component ends
up rendering it (likely a small addition to the sidebar footer in `AppSidebarNav.tsx`, next to
the existing user avatar/role block).

**Rule:** compute `daysLeft = ceil((subscriptionEndDate - now) / 86400000)` and render only the
day count — no hours, minutes, or seconds, and no live-ticking clock (a per-second re-render in
a persistent sidebar element is wasted work for information that only changes once a day).

```tsx
// Before (what the screenshot shows — not in code, described for contrast)
// "11d 07:48:31" — re-renders every second

// After
function daysLeft(endDate: string): number {
  const diffMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// Render: "11 days left" — recomputed on mount / SWR refresh (e.g. every few minutes),
// never on a per-second timer.
```

| Component | Change |
|---|---|
| `AppSidebarNav.tsx` (or new `frontend/components/settings/MembershipBadge.tsx`) | Render `{daysLeft} days left` sourced from `GET /api/settings/subscription` (endpoint already spec'd in `Environment/2026-09-21_AddedFeatures_v1.0.md` §3.3) — no `setInterval`/per-second timer |
| Backend | No change — `Subscription.endDate` (existing Prisma field) is already the source of truth |

> **Note:** the screenshot's label "FREE PLAN" next to a countdown is a slightly confusing
> combination — a `FREE` tier conceptually shouldn't expire the way a paid tier does. This is
> flagged as an open question in §7, not decided here.

---

## 4. Change #3 — Technical Strategy / Fundamental Strategy as Market-Wide Screeners

This is the core of the document. Today, `Environment/2026-09-21_StrategyTrading_v1.0.md` defines
9 self-contained strategies (Alligator/Profitunity, Ichimoku, Minervini Trend Template, Guppy
MMA, Turtle System, Camarilla Pivots, SuperTrend, Heikin Ashi Trend, Candlestick Patterns) as
**per-symbol** analysis sub-menus. This change adds a **screening layer** on top: instead of only
being able to check "does symbol X satisfy the Alligator strategy right now," the user can ask
"which symbols in the Indonesia market satisfy the Alligator strategy right now."

### 4.1 Navigation Structure (Target State)

```
Analysis
├── Overview Stocks              (existing /analysis, unchanged — per-symbol ScoreGauge/RadarChart)
├── Technical Analysis
│   └── Technical Strategy       (NEW screener UI, renamed from "Detail Technical")
├── Fundamental Analysis
│   └── Fundamental Strategy     (NEW screener UI, renamed from "Detail Fundamental")
└── Earnings Calendar            (existing, unchanged)
```

### 4.2 Screening Flow

```
1. User is on Technical Strategy (or Fundamental Strategy) page
2. Market tab already selected globally (existing MarketContext, e.g. "Indonesia")
        │
        ▼
3. User picks a Strategy from a dropdown:
   Technical Strategy options  → Alligator/Profitunity, Ichimoku, Minervini (technical criteria
                                  only — see §4.5), Guppy MMA, Turtle System, SuperTrend,
                                  Heikin Ashi Trend, Candlestick Patterns
                                  (Camarilla is support/resistance levels, not a pass/fail
                                  screen — excluded from the dropdown, see §7)
   Fundamental Strategy options → defined in §4.6 (new — no formulas existed before this doc)
        │
        ▼
4. Screener runs the strategy's fulfillment rule against every symbol in
   MARKET_CONFIG[selectedMarket].moverPoolSymbols (existing, reused — see §4.3)
        │
        ▼
5. Result list: symbols that currently satisfy the strategy's BUY/bullish condition,
   ranked by match strength (e.g. how many of a multi-condition strategy's sub-signals
   are true — reusing the "score = fraction of conditions met" pattern already used by
   compute_analysis_score(), existing)
        │
        ▼
6. User clicks "See Details" on a row
        │
        ▼
7. Navigates to /analysis/[symbol]?strategy=alligator (or similar)
   → Chart pre-loaded with THIS strategy's overlay (Alligator's 3 lines, Turtle's channel,
     Minervini's MA150/200, etc. — reusing CandlestickChart.tsx, existing)
   → Below the chart: Strategy Explanation + Fulfillment Status table + Trade Plan Suggestion
     (see §4.4)
```

### 4.3 Screening Universe — Reuse, No New Data Source

The screening pool is **not** a new concept — `frontend/lib/marketConfig.ts` and
`frontend/lib/sectorBaskets.ts` (`unionSectorSymbols()`, already shipped per §0) already compute
`moverPoolSymbols` per market, currently consumed by the Dashboard Movers panel
(`Environment/2026-09-06_DashboardPage_v1.0.md` §5.3). The screener reuses the exact same pool —
no new symbol list to define, no new data source.

### 4.4 "See Details" Page — Chart + Explanation + Fulfillment + Trade Plan

This is an extension of the existing per-symbol Technical Strategy page (§4.1), entered either
directly (pick a strategy for one symbol you already have open) or via a screener result row
(§4.2 step 7). Layout, top to bottom:

1. **Chart with strategy overlay** — `CandlestickChart.tsx` (existing) extended to accept a
   `strategyOverlay` prop that adds the specific series each strategy needs:

   | Strategy | Overlay series added to the existing chart |
   |---|---|
   | Alligator/Profitunity | 3 lines (Jaw/Teeth/Lips) + fractal markers + AO/AC sub-panel |
   | Ichimoku | 5 lines + kumo (cloud) fill area |
   | Minervini | MA50/MA150/MA200 lines (reuses `MA100`/`MA200` already in `add_all_indicators()`) |
   | Guppy MMA | 12 EMA lines, color-grouped short vs. long |
   | Turtle System | 2 Donchian channel lines (20-day upper, 10-day lower) |
   | SuperTrend | 1 line, color-switching red/green by trend state |
   | Heikin Ashi Trend | Candles replaced with synthetic HA candles + 4-state color strip below |
   | Candlestick Patterns | Markers on the bars where a named pattern was detected |

2. **Strategy Explanation** — a short static description of the strategy's rule (the formula
   text already written in `Environment/2026-09-21_StrategyTrading_v1.0.md` §1 for each of the 9
   strategies — reused verbatim as page copy, not re-derived).

3. **Fulfillment Status** — a table of the strategy's individual sub-conditions with a per-row
   pass/fail badge, matching the exact layout already shown in the screenshot (`BUAYA1`, `BUAYA2`,
   `BUAYA3`, `PTS1`, `PTS2`, `PTS3`, `FR1`, condition text, "No"/"Yes" status) — this reuses the
   row pattern already established by `IndicatorSignalRow.tsx` (existing component), just fed
   with strategy-specific rows instead of the generic RSI/MACD/MA rows it renders today.

4. **Trade Plan Suggestion** — a compliance-safe, descriptive (not prescriptive) summary derived
   mechanically from the strategy's own rules, never a "BUY now" instruction:

   | Field | How it's derived (example: Turtle System) |
   |---|---|
   | Entry reference | "Above the 20-day upper channel (current: {value})" — the strategy's own breakout level, not a recommendation |
   | Stop reference | "Below the 10-day lower channel (current: {value})" — the strategy's own exit rule |
   | Target reference | *(only if the strategy defines one — most of the 9 don't; omit the field rather than inventing one)* |
   | Status | "Condition met" / "Condition not met" / "Approaching" (reuses the 3-state pattern already spec'd for Turtle in `StrategyTrading` §1.5: `BREAKOUT_BUY` / `APPROACHING` / `NEUTRAL`) |

   > **Compliance (unchanged from every prior document in this repo):** this panel states what
   > the strategy's own published rule says, sourced from the same disclaimer requirement as
   > `Documentation/Documentation-Business.md` §5 — it is not a recommendation, and must carry
   > the same "not financial advice" disclaimer already used across `compute_analysis_score()`
   > and Golden/Death Cross alerts.

### 4.5 Technical Strategy List (from `StrategyTrading` §1, Technical-Only)

Reuses the 9 systems already spec'd, minus Camarilla (a support/resistance reference, not a
pass/fail screen) and Candlestick Patterns (per-symbol pattern detection, doesn't reduce to one
clean "does this stock currently satisfy X" screen the same way the others do — still shown on
the per-symbol page as a table, but excluded from the market-wide screener dropdown for now):

`Alligator/Profitunity`, `Ichimoku`, `Minervini Trend Template`, `Guppy MMA`, `Turtle System`,
`SuperTrend`, `Heikin Ashi Trend`.

### 4.6 Fundamental Strategy List (New — No Prior Formulas Existed)

`StrategyTrading` §1 was deliberately technical-only (OHLCV-based). Fundamental Strategy needs
its own formula set, sourced from `yfinance` `Ticker` fundamentals data already catalogued as
ideas (not yet implemented) in `Environment/2026-09-21_NewFeatures_v1.0.md` §4:

| Strategy | Rule (draft — needs Product Owner sign-off before implementation, see §7) | Data source |
|---|---|---|
| **Minervini Fundamentals** *(the `MVF` variant noted but out-of-scope in `StrategyTrading` §1.3)* | Earnings growth + revenue growth above a threshold over recent quarters | `Ticker.quarterly_income_stmt` |
| **Graham Number Value** *(referenced in the PDF extraction, `/VAL`, `i121`)* | Current price at or below `√(22.5 × EPS × Book Value per Share)` | `Ticker.info` (EPS, book value) |
| **Dividend Yield Screener** | Annualized dividend yield above a user-set threshold | `Ticker.info` (`dividendYield`) or `Ticker.dividends` |
| **Analyst Consensus** *(from `NewFeatures` §4)* | Majority analyst rating is Buy/Strong Buy | `Ticker.recommendations_summary` |

> This list is intentionally short and marked draft — unlike the Technical Strategy list (which
> reuses formulas already fully specified in `StrategyTrading`), these fundamental rules are
> being proposed for the first time in this document and need explicit confirmation (see §7)
> before backend work starts.

---

## 5. Backend Changes

| Component | Change |
|---|---|
| `backend/app/indicators/technical.py` | The 7 strategy functions already spec'd in `StrategyTrading` §1.1-1.8 (`alligator()`, `ichimoku()`, `minervini_trend_template()`, `guppy_mma()`, `donchian_channel()`/Turtle, `supertrend()`, `heikin_ashi()`) — this document adds nothing new here, it's the prerequisite |
| `backend/app/api/analysis.py` | **New generic endpoint** `POST /api/analysis/screen/{strategy_key}` — body `{symbols: string[]}`, loops the pool (§4.3), runs the matching strategy function from `technical.py`, returns only symbols where the strategy's primary bullish condition is true, each with a match-strength score |
| `backend/app/api/schemas.py` | `StrategyScreenResult` (`symbol`, `match_score`, `conditions: list[{code, label, met}]`) |
| `backend/app/services/fundamentals.py` (new) | Wraps the `yfinance` fundamentals calls needed for §4.6 (income statement growth calc, Graham Number calc, dividend yield, recommendations summary) |
| `backend/app/api/fundamentals.py` (new) | `POST /api/fundamentals/screen/{strategy_key}` — same shape as the technical screener endpoint |

**Performance note:** screening an entire market pool (potentially 30+ symbols for Indonesia,
per `Environment/2026-09-06_DashboardPage_v1.0.md` §5.3's own estimate) means N sequential
`get_history()` + strategy-function calls per screen request. This reuses the existing
`ttl_cache` on `get_history()` (existing), so repeated screens within the cache TTL are cheap,
but the **first** screen for a strategy after cache expiry is an N-symbol fan-out — the same
performance shape already accepted for the Movers panel and Volume Movers endpoint (both already
shipped), so no new architectural risk, just a heavier version of a pattern already in production.

## 6. Frontend Changes

| Component | Change |
|---|---|
| `AppSidebarNav.tsx` | Restructure `Analysis` submenu per §4.1; apply renames from §2; add days-left membership badge per §3 |
| `frontend/app/(app)/analysis/[symbol]/page.tsx` | Add strategy-picker dropdown + read `?strategy=` query param; render overlay/explanation/fulfillment/trade-plan sections per §4.4 |
| `frontend/app/(app)/analysis/screener/page.tsx` (new) | Market-wide screener UI: strategy dropdown + result list + "See Details" links (per §4.2) |
| `frontend/app/(app)/analysis/fundamental/[symbol]/page.tsx` (new) | Fundamental Strategy per-symbol page, same layout pattern as Technical Strategy |
| `frontend/app/(app)/analysis/fundamental/screener/page.tsx` (new) | Fundamental screener UI, same pattern as the technical screener |
| `frontend/components/CandlestickChart.tsx` | Extend to accept a `strategyOverlay` prop (§4.4 table) |
| `frontend/components/analysis/StrategyExplanation.tsx` (new) | Static copy block per strategy |
| `frontend/components/analysis/FulfillmentTable.tsx` (new) | Reuses `IndicatorSignalRow.tsx` row pattern, strategy-specific rows |
| `frontend/components/analysis/TradePlanSuggestion.tsx` (new) | Renders §4.4 point 4, with disclaimer |
| `frontend/lib/api.ts` | Add `api.screenStrategy(strategyKey, symbols)`, `api.screenFundamental(strategyKey, symbols)` |

---

## 7. Open Questions

- [ ] **Fundamental Strategy formulas (§4.6):** these are proposed for the first time in this
      document, unlike the technical strategies which were already fully specified — needs
      explicit Product Owner confirmation before backend work starts, including exact thresholds
      (e.g. what dividend yield % counts as a "match").
- [ ] **"FREE PLAN" + countdown together (§3):** does a Free tier actually expire, or is the
      countdown only meant to show for paid (`PRO`/`PREMIUM`) tiers? Affects whether the badge
      should render at all for Free-tier users.
- [ ] **Screener result cap:** should the result list be capped (e.g. top 20 by match score) to
      keep the UI dense, given some markets' pools could return many matches on a loose
      condition like "MA20 above MA50"?
- [ ] **Camarilla and Candlestick Patterns in the screener (§4.5):** confirmed excluded from the
      dropdown for now (they don't reduce to a single pass/fail condition the same way) — confirm
      this is acceptable, or decide how to adapt them (e.g. Candlestick Patterns screener = "any
      bullish pattern detected today").
- [ ] **Trade Plan Suggestion wording:** needs legal/compliance review before shipping, same as
      every other signal-producing panel in this project (`Documentation/Documentation-Business.md`
      §5) — this document defines the mechanical derivation, not the final approved copy.

---

## 8. Related Documents

- `Environment/2026-09-21_StrategyTrading_v1.0.md` — source of the 9 technical strategy formulas
  this screener runs
- `Environment/2026-09-06_DashboardPage_v1.0.md` §4.2-4.3, §5.3 — `MARKET_CONFIG` /
  `moverPoolSymbols` reused as the screening universe (§4.3)
- `Environment/2026-09-21_AddedFeatures_v1.0.md` §3 — Settings/Subscription backend this
  document's countdown badge (§3) reads from
- `Environment/2026-09-21_NewFeatures_v1.0.md` §1, §4 — War Room (sidebar item shown in the same
  screenshot, spec'd separately) and the fundamentals data ideas this document's §4.6 builds on
- `Documentation/Documentation-Business.md` §5 — disclaimer requirements applying to the Trade
  Plan Suggestion panel (§4.4)