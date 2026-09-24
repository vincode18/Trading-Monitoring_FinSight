# Analysis Strategy Screener — Patch v1.2

> **Document Version:** 1.2 — patch on `Environment/2026-09-24_AnalysisStrategyScreener_v1.1.md`,
> not a rewrite
> **Related:** `Environment/2026-09-24_AnalysisStrategyScreener_v1.0.md` (screening flow),
> `Environment/2026-09-24_AnalysisStrategyScreener_v1.1.md` §2 (per-pool market selector this
> patch extends into a cross-market option)
> **Source:** Review of the Technical Strategy screener list page (screenshot — Alligator /
> Profitunity, Pool: US, 7 of 40 symbols)
> **Status:** 🔜 Proposed — not implemented
> **Last Updated:** September 24, 2026
> **Audience:** Frontend Developer, Backend Developer

---

## 0. Summary of Changes

| # | Change | Touches |
|---|---|---|
| 1 | Add pagination to the screener result list | Frontend only |
| 2 | Add an "All Markets" pool option that searches across every pool at once, so more matching stocks surface than a single-pool search allows | Frontend + backend |
| 3 | Rename the Analysis submenu labels: "Technical Strategy" → **"Screener Technical"**, "Fundamental Strategy" → **"Screener Fundamental"** | Frontend only |

---

## 1. Change #1 — Pagination on the Result List

**Current state:** the screener (per parent doc v1.0 §4.2) returns every matching symbol in one
flat list, sorted by match score. This is fine at "7 of 40" but won't hold up once Change #2
(§2) makes the pool span every market — a strategy with a loose condition could plausibly match
dozens of symbols across combined pools.

**Rule:**
- Page size: 10 rows (consistent with the existing dense-table convention used elsewhere in the
  app, e.g. `TopGainersTable.tsx`'s `limit` default).
- Pagination controls (Previous / page numbers / Next) below the table, same visual weight as
  the existing "Showing the strongest N" caption line — replacing "Showing the strongest 8"
  wording with a real page indicator, e.g. "Page 1 of 3 · 7 matches".
- Sort order (match score, descending — existing) is unchanged; pagination just slices it.

**Where pagination lives:** client-side if the result set is already small (a single pool, ≤ ~50
symbols — cheap to fetch in full and paginate in the browser), server-side once Change #2's "All
Markets" option is in play (a combined pool could be large enough that returning every result in
one response is wasteful). See §2.3 for how the two connect.

| Component | Change |
|---|---|
| `frontend/app/(app)/analysis/screener/page.tsx` | Add pagination state (`page`, `pageSize=10`) and controls; slice the result array client-side for single-pool queries |
| `backend/app/api/analysis.py` — `POST /api/analysis/screen/{strategy_key}` (per v1.0 §5) | Accept optional `?page=&page_size=` query params for the "All Markets" case (§2.3); default behavior (no params) unchanged — returns everything, as today |

---

## 2. Change #2 — Search Across All Markets

**Request:** "more stocks if possible, searched from the entire market matching the screener" —
i.e. don't limit a screen to one pool (US, or Indonesia, or Crypto) at a time; let the user ask
"which symbols **anywhere** satisfy Alligator/Profitunity right now."

### 2.1 UI Change

Add **"All Markets"** as an entry in the Pool dropdown introduced in
`Environment/2026-09-24_AnalysisStrategyScreener_v1.1.md` §2.4, positioned first (default option
is still left as a per-market pool — "All Markets" is opt-in, not the default, to avoid an
expensive combined scan on every page load):

```
[ Strategy: Alligator / Profitunity ▾ ]   [ Pool: All Markets ▾ ]   → 340 symbols
```

### 2.2 Symbol Universe

`All Markets` = the union of every pool already defined across
`Environment/2026-09-24_AnalysisStrategyScreener_v1.1.md` §2.3 (US, Indonesia, Crypto, and
whichever of Asia/Europe/Currencies/Commodities/Rates have been curated by the time this ships —
this patch does not require all 8 to exist first; "All Markets" simply unions whatever pools are
already defined at build time, and grows automatically as more are added).

```python
# backend/app/config/sectors.py (existing module, extended)
def all_markets_pool() -> list[str]:
    """Union of every curated pool, deduplicated. Grows as new pools are added."""
    seen: set[str] = set()
    combined: list[str] = []
    for market_id in MARKET_IDS:  # existing enum/list of pool keys
        for symbol in unionSectorSymbols(market_id):
            if symbol not in seen:
                seen.add(symbol)
                combined.append(symbol)
    return combined
```

### 2.3 Why This Needs Server-Side Pagination

Scanning a combined pool (potentially 150-300+ symbols once several regions are curated) means
150-300+ sequential `get_history()` + strategy-function calls per screen request — a heavier
version of the same fan-out pattern already accepted for the Volume Movers endpoint (per
`Environment/2026-09-06_DashboardPage_v1.0.md` §6.1), but large enough that returning the full
result in one response starts to matter for payload size and render cost. The screen endpoint
computes matches for the *entire* pool server-side (so sorting by match score stays correct
across the whole set), but returns only one page of results plus a total count:

```
POST /api/analysis/screen/alligator?page=1&page_size=10
Body: { "pool": "all" }   // or { "symbols": [...] } for a specific pool, unchanged from v1.0

Response:
{
  "total_matches": 34,
  "page": 1,
  "page_size": 10,
  "results": [ { "symbol": "AAPL", "match_score": 0.29, ... }, ... ]
}
```

**Caching note:** this reuses the existing `ttl_cache` on `get_history()` (existing) exactly as
noted in v1.1 §2 — a combined-pool scan is expensive on a cache miss but cheap on repeat views
within the TTL window, same tradeoff already accepted elsewhere in the app.

### 2.4 Code Changes

| Component | Change |
|---|---|
| `backend/app/config/sectors.py` | Add `all_markets_pool()` (§2.2) |
| `backend/app/api/schemas.py` | `StrategyScreenResult` (existing, per v1.0 §5) wrapped in a new `PaginatedScreenResponse` (`total_matches`, `page`, `page_size`, `results`) |
| `backend/app/api/analysis.py` — screen endpoint | Accept `pool: "all" | MarketId`, plus `page`/`page_size`; when `pool == "all"`, use `all_markets_pool()` instead of a single market's `moverPoolSymbols` |
| `frontend/lib/marketConfig.ts` or `SCREENER_POOLS` (per v1.1 §2.4 open question) | Add `"all"` as a pool option, labeled "All Markets" |
| `frontend/app/(app)/analysis/screener/page.tsx` | Wire pagination controls to the paginated response when pool is `"all"`; keep the existing client-side full-fetch behavior for single-market pools (§1) |

---

## 3. Change #3 — Sidebar Label Rename

| Where | Before | After |
|---|---|---|
| `AppSidebarNav.tsx` — Analysis submenu, under Technical Analysis | `Technical Strategy` (renamed from "Detail Technical" in v1.0 §2) | **`Screener Technical`** |
| `AppSidebarNav.tsx` — Analysis submenu, under Fundamental Analysis | `Fundamental Strategy` (renamed from "Detail Fundamental" in v1.0 §2) | **`Screener Fundamental`** |
| Page `<h1>` on the screener list pages | `Technical Strategy` / `Fundamental Strategy` | `Screener Technical` / `Screener Fundamental` |

This is the second rename of the same menu item across this document's revisions (v1.0 §2 already
renamed it once, from "Detail Technical"/"Detail Fundamental"). No functional change — purely
reflects that the page's core job, as of v1.0's own §4, is screening a market for matches, not
showing "detail" for one symbol (that job moved to the dedicated Strategy Detail Analysis page in
v1.1 §3). "Screener" names what the page actually does.

> Note: the per-symbol Strategy Detail Analysis page introduced in v1.1 §3
> (`analysis/strategy-detail/[strategy]/[symbol]`) is **not** renamed by this change — only the
> market-wide list page's label changes.

---

## 4. Open Questions

- [ ] **Page size (§1):** 10 rows assumed here for consistency with existing dense-table
      conventions — confirm, or adjust if the product wants a different default.
- [ ] **"All Markets" default:** confirmed opt-in (not the default pool) in §2.1 to avoid an
      expensive scan on first page load — confirm this tradeoff is acceptable, versus always
      defaulting to "All Markets" for maximum result coverage at the cost of a slower first load.
- [ ] **Combined-pool scan latency:** no numbers exist yet for how slow a 150-300 symbol scan
      actually is in practice (depends on `yfinance` response times, which are outside this
      project's control) — worth a rough timing test once even 2-3 non-US/Indonesia pools exist,
      to confirm server-side pagination alone is enough or if the endpoint also needs an async
      job pattern (out of scope for this patch either way).

---

## 5. Related Documents

- `Environment/2026-09-24_AnalysisStrategyScreener_v1.0.md` — screening flow, strategy list,
  screen endpoint (base shape this patch extends with pagination)
- `Environment/2026-09-24_AnalysisStrategyScreener_v1.1.md` §2 — per-pool market selector this
  patch adds an "All Markets" option to
- `Environment/2026-09-06_DashboardPage_v1.0.md` §6.1 — existing fan-out pattern (Volume Movers)
  this patch's combined-pool scan follows
