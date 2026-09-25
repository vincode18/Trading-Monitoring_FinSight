# Added Features — Completing the Alerts, Portfolio & Settings Menus

> **Document Version:** 1.1 — English translation of `2026-09-21_AddedFeatures_v1.0.md`, with
> representative code snippets added to the backend/frontend task tables that were previously
> prose/table-only
> **File Code:** `2026-09-21_AddedFeatures_v1_1`
> **Related:** `frontend/components/app/AppSidebarNav.tsx` (Alerts / Portfolio / Settings live routes)
> **Status:** ✅ Diimplementasikan
> **Last Updated:** September 22, 2026
> **Audience:** Frontend Developer, Backend Developer

---

## 0. Current State

All three menus already appear in the sidebar (`AppSidebarNav.tsx`, lines 33–35) but are purely
**visual placeholders** — `href: '#'`, a "Soon" badge, not clickable, with no route/page/endpoint
behind them at all. This document is a development task list for turning all three from
placeholders into functional features, organized per menu with a clear breakdown: **Data Model
(Prisma)** → **Backend (FastAPI)** → **Frontend (Next.js)** → **Sidebar Wiring**.

**Principles carried over from previous documents:**
- Reuse as many existing functions/endpoints as possible (`get_quote_snapshot`,
  `get_multiple_snapshots`, `compute_analysis_score`, `detect_ma_cross`, `volume_ratio` from
  `technical.py` — all already implemented, see `Environment/2026-09-06_DashboardPage_v1.0.md`).
- The `User`/`Subscription`/`Payment` models in `backend/prisma/schema.prisma` **already exist**
  (from `Environment/2026-09-06_DatabaseSupabase_v1.1.md`) — Portfolio & Settings add new
  models to the same schema, not a separate one.
- Every new feature **must** be protected by `get_current_user()` (existing dependency,
  `backend/app/core/deps.py`) — these three menus are, by definition, personal/per-account,
  unlike public market data (`market/chart/news`) which is intentionally left open.
- The non-goal disclaimer still applies: **Portfolio is not an order-execution platform** —
  purely manual record-keeping by the user, not connected to any broker/exchange (consistent
  with `PRD/Others/PRD.md` §3.1).

---

## 1. Alerts Menu

### 1.1 Goal

Users can create trigger conditions (alerts) on symbols in their watchlist — e.g. "notify me
if BBCA.JK price goes above 10,000" or "notify me if TLKM.JK's RSI is oversold" — and see a
list of alerts that have already fired.

### 1.2 Data Model — `backend/prisma/schema.prisma`

```prisma
model Alert {
  id          String       @id @default(uuid())
  userId      String       @map("user_id")
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  symbol      String
  condition   AlertCondition
  threshold   Decimal      @db.Decimal(18, 6)
  status      AlertStatus  @default(ACTIVE)
  triggeredAt DateTime?    @map("triggered_at")
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@map("alerts")
}

enum AlertCondition {
  PRICE_ABOVE
  PRICE_BELOW
  CHANGE_PCT_ABOVE
  CHANGE_PCT_BELOW
  RSI_OVERBOUGHT   // RSI14 > 70, threshold is ignored/optional
  RSI_OVERSOLD     // RSI14 < 30
  GOLDEN_CROSS     // reuses detect_ma_cross()
  DEATH_CROSS
  VOLUME_SPIKE     // reuses volume_ratio() > threshold
}

enum AlertStatus {
  ACTIVE
  TRIGGERED
  DISABLED
}
```

Add the `alerts Alert[]` relation to the `User` model.

### 1.3 Backend — Tasks

| Task | Detail |
|---|---|
| Add the `Alert` model to `schema.prisma`, run `prisma migrate dev --name add_alerts` | Follow the procedure in `Environment/2026-09-06_DatabaseSupabase_v1.1.md` §5 |
| `backend/app/api/schemas.py` — add `AlertCreateRequest`, `AlertResponse` | `AlertCreateRequest`: `symbol`, `condition`, `threshold` (optional for threshold-less conditions like `GOLDEN_CROSS`) |
| `backend/app/api/alerts.py` (new) — `POST /api/alerts` | Create a new alert, scoped to `get_current_user()` |
| `GET /api/alerts` | List the user's alerts (all statuses, or filtered via `?status=ACTIVE`) |
| `PATCH /api/alerts/{id}` | Toggle status (`ACTIVE`/`DISABLED`) — not for editing the condition (delete & recreate is simpler than partial edits) |
| `DELETE /api/alerts/{id}` | Delete an alert |
| `backend/app/services/alert_engine.py` (new) — `evaluate_alerts_for_user(user_id)` | Loop over all of the user's `ACTIVE` alerts, call `get_quote_snapshot()`/`get_history()` + `add_all_indicators()`/`detect_ma_cross()`/`volume_ratio()` (**all existing**) according to `condition`, set `status=TRIGGERED` + `triggeredAt` when the condition is met |
| `GET /api/alerts/check` | Triggers `evaluate_alerts_for_user()` for the currently logged-in user, returns any alerts that just fired — **called from the frontend via SWR polling** (same pattern as the watchlist/dashboard), not a separate cron job (see §1.5 for the architectural note) |

### 1.4 Code Snippet — `alert_engine.py` (Evaluation Logic)

```python
# backend/app/services/alert_engine.py
from datetime import datetime, timezone

from app.core.db import db
from app.indicators.technical import add_all_indicators, detect_ma_cross, volume_ratio
from app.services.market_data import get_history, get_quote_snapshot


async def evaluate_alerts_for_user(user_id: str) -> list[dict]:
    """
    Evaluates every ACTIVE alert belonging to a user, marks matches as TRIGGERED,
    and returns the alerts that fired on this call (not the full active list).
    Reuses existing indicator functions — no new calculation logic required here,
    just wiring condition -> existing function.
    """
    alerts = await db.alert.find_many(where={"userId": user_id, "status": "ACTIVE"})
    triggered = []

    for alert in alerts:
        is_triggered = False

        if alert.condition in ("PRICE_ABOVE", "PRICE_BELOW"):
            quote = get_quote_snapshot(alert.symbol)
            if quote.last_price is None:
                continue
            is_triggered = (
                quote.last_price > float(alert.threshold)
                if alert.condition == "PRICE_ABOVE"
                else quote.last_price < float(alert.threshold)
            )

        elif alert.condition in ("CHANGE_PCT_ABOVE", "CHANGE_PCT_BELOW"):
            quote = get_quote_snapshot(alert.symbol)
            if quote.change_pct is None:
                continue
            is_triggered = (
                quote.change_pct > float(alert.threshold)
                if alert.condition == "CHANGE_PCT_ABOVE"
                else quote.change_pct < float(alert.threshold)
            )

        elif alert.condition in ("RSI_OVERBOUGHT", "RSI_OVERSOLD"):
            df = get_history(alert.symbol, period="3mo", interval="1d")
            if df.empty:
                continue
            df = add_all_indicators(df)
            latest_rsi = df["RSI14"].iloc[-1]
            is_triggered = (
                latest_rsi > 70 if alert.condition == "RSI_OVERBOUGHT" else latest_rsi < 30
            )

        elif alert.condition in ("GOLDEN_CROSS", "DEATH_CROSS"):
            df = get_history(alert.symbol, period="3mo", interval="1d")
            if df.empty:
                continue
            df = add_all_indicators(df)
            cross_result = detect_ma_cross(df)  # existing, from technical.py
            is_triggered = cross_result == alert.condition

        elif alert.condition == "VOLUME_SPIKE":
            df = get_history(alert.symbol, period="2mo", interval="1d")
            if df.empty:
                continue
            ratio = volume_ratio(df)  # existing, from technical.py
            is_triggered = ratio > float(alert.threshold)

        if is_triggered:
            updated = await db.alert.update(
                where={"id": alert.id},
                data={"status": "TRIGGERED", "triggeredAt": datetime.now(timezone.utc)},
            )
            triggered.append(updated)

    return triggered
```

### 1.5 Code Snippet — `alerts.py` (API Routes)

```python
# backend/app/api/alerts.py
from fastapi import APIRouter, Depends

from app.api.schemas import AlertCreateRequest, AlertResponse
from app.core.db import db
from app.core.deps import get_current_user
from app.services.alert_engine import evaluate_alerts_for_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("", response_model=AlertResponse)
async def create_alert(payload: AlertCreateRequest, user=Depends(get_current_user)):
    alert = await db.alert.create(
        data={
            "userId": user.id,
            "symbol": payload.symbol.upper(),
            "condition": payload.condition,
            "threshold": payload.threshold or 0,
        }
    )
    return alert


@router.get("", response_model=list[AlertResponse])
async def list_alerts(status: str | None = None, user=Depends(get_current_user)):
    where = {"userId": user.id}
    if status:
        where["status"] = status
    return await db.alert.find_many(where=where, order={"createdAt": "desc"})


@router.patch("/{alert_id}", response_model=AlertResponse)
async def toggle_alert(alert_id: str, status: str, user=Depends(get_current_user)):
    # Ownership check: only update if the alert belongs to this user
    return await db.alert.update(
        where={"id": alert_id, "userId": user.id},
        data={"status": status},
    )


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, user=Depends(get_current_user)):
    await db.alert.delete(where={"id": alert_id, "userId": user.id})
    return {"deleted": True}


@router.get("/check", response_model=list[AlertResponse])
async def check_alerts(user=Depends(get_current_user)):
    """Called by AlertBadge.tsx via SWR polling — see §1.7 architecture note."""
    return await evaluate_alerts_for_user(user.id)
```

### 1.6 Frontend — Tasks

| Task | Detail |
|---|---|
| `frontend/app/(app)/alerts/page.tsx` (new) | Main page: new-alert form + alert list (`Active`/`Triggered`/`Disabled` tabs) |
| `frontend/components/alerts/AlertForm.tsx` (new) | Pick a symbol (from the watchlist, reuses `useWatchlist()`), pick `condition` (dropdown), `threshold` input (hidden/disabled for threshold-less conditions) |
| `frontend/components/alerts/AlertsList.tsx` (new) | Alert table/list, color-coded status badge (`positive` for Triggered, `text-muted` for Disabled) |
| `frontend/components/app/AlertBadge.tsx` (new) | Small notification badge on the "Alerts" sidebar item (count of unseen `TRIGGERED` alerts) — lightweight SWR polling (`refreshInterval` 60 seconds) |
| `frontend/lib/api.ts` | Add `api.createAlert()`, `api.listAlerts()`, `api.toggleAlert()`, `api.deleteAlert()`, `api.checkAlerts()` |
| `frontend/types/market.ts` | Add `Alert`, `AlertCondition` interfaces |

### 1.7 Code Snippet — `AlertBadge.tsx` (Sidebar Notification Badge)

```tsx
// frontend/components/app/AlertBadge.tsx
'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export function AlertBadge() {
  const { data: triggeredAlerts } = useSWR(
    'alerts-check',
    () => api.checkAlerts(),
    { refreshInterval: 60_000 } // lazy check while the app is open — see §1.9 caveat
  );

  const count = triggeredAlerts?.length ?? 0;
  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-semibold text-canvas">
      {count > 9 ? '9+' : count}
    </span>
  );
}
```

### 1.8 Code Snippet — `AlertForm.tsx` (Create Form, Condition-Dependent Threshold)

```tsx
// frontend/components/alerts/AlertForm.tsx (excerpt)
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';

const CONDITIONS_WITHOUT_THRESHOLD = new Set(['RSI_OVERBOUGHT', 'RSI_OVERSOLD', 'GOLDEN_CROSS', 'DEATH_CROSS']);

const CONDITION_LABELS: Record<string, string> = {
  PRICE_ABOVE: 'Price rises above',
  PRICE_BELOW: 'Price falls below',
  CHANGE_PCT_ABOVE: 'Daily change % rises above',
  CHANGE_PCT_BELOW: 'Daily change % falls below',
  RSI_OVERBOUGHT: 'RSI turns overbought (>70)',
  RSI_OVERSOLD: 'RSI turns oversold (<30)',
  GOLDEN_CROSS: 'MA20 crosses above MA50 (Golden Cross)',
  DEATH_CROSS: 'MA20 crosses below MA50 (Death Cross)',
  VOLUME_SPIKE: 'Volume ratio exceeds',
};

export function AlertForm({ onCreated }: { onCreated: () => void }) {
  const { watchlist } = useWatchlist();
  const [symbol, setSymbol] = useState(watchlist[0] ?? '');
  const [condition, setCondition] = useState('PRICE_ABOVE');
  const [threshold, setThreshold] = useState('');
  const needsThreshold = !CONDITIONS_WITHOUT_THRESHOLD.has(condition);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.createAlert({
      symbol,
      condition,
      threshold: needsThreshold ? Number(threshold) : undefined,
    });
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
        {watchlist.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={condition} onChange={(e) => setCondition(e.target.value)}>
        {Object.entries(CONDITION_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      {needsThreshold && (
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder={condition === 'VOLUME_SPIKE' ? 'e.g. 2.0 (= 2x average)' : 'Threshold value'}
        />
      )}
      <button type="submit">Create Alert</button>
    </form>
  );
}
```

### 1.9 Architecture Note — Evaluating Alerts Without a Background Job

This project **has no job-scheduler/cron infrastructure** (the FastAPI backend is purely
request-response, per `Documentation/Documentation-Program.md` §7). Rather than building a new
scheduler (a major architectural change), alerts are evaluated **lazily** — triggered every time
`AlertBadge.tsx` polls `GET /api/alerts/check` (SWR, 60-second interval) while the user has the
app open. This is consistent with the polling pattern already used throughout the dashboard, but
has a clear limitation:

> ⚠️ Alerts will **not** be detected if the user isn't currently using the app at all (no
> browser tab open). This is sufficient for a "check when I open the app" use case, but does
> **not** meet the expectation of "notify me even when I'm offline" (which needs push/email
> notifications + a background worker — outside v1's scope, noted in §4 Open Questions).

### 1.10 Sidebar Wiring

`AppSidebarNav.tsx` — replace the entry:
```ts
{ href: '#', label: 'Alerts', short: 'Al', soon: true },
```
with:
```ts
{ href: '/alerts', label: 'Alerts', short: 'Al' },
```
(remove the `soon` flag, remove `href: '#'`).

---

## 2. Portfolio Menu

### 2.1 Goal

Manual record-keeping of a user's stock/crypto holdings (lot/unit count + purchase price) to
view portfolio value & unrealized profit/loss (*unrealized P&L*) in near-real-time based on
current market prices. **Not** order execution — purely a tracker, per the non-goal already
stated repeatedly for this product (`PRD/Others/PRD.md` §3.1,
`Documentation/Documentation-Business.md`).

### 2.2 Data Model — `backend/prisma/schema.prisma`

```prisma
model PortfolioHolding {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  symbol       String
  quantity     Decimal  @db.Decimal(18, 6)
  avgBuyPrice  Decimal  @db.Decimal(18, 6) @map("avg_buy_price")
  buyDate      DateTime @map("buy_date")
  note         String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("portfolio_holdings")
}
```

Add the `portfolioHoldings PortfolioHolding[]` relation to the `User` model. No `@@unique` is
needed on `[userId, symbol]` — a user may record several purchase entries for the same symbol
(different purchase prices on different dates), mirroring how real lot record-keeping works.

### 2.3 Backend — Tasks

| Task | Detail |
|---|---|
| Add the `PortfolioHolding` model, migrate (`prisma migrate dev --name add_portfolio`) | — |
| `backend/app/api/schemas.py` — `HoldingCreateRequest`, `HoldingResponse`, `PortfolioSummaryResponse` | `PortfolioSummaryResponse`: `total_value`, `total_cost`, `total_unrealized_pnl`, `total_unrealized_pnl_pct`, `holdings: list[HoldingResponse]` (each holding already includes `current_price`, `market_value`, `unrealized_pnl`) |
| `backend/app/api/portfolio.py` (new) — `POST /api/portfolio/holdings` | Add a new holding |
| `GET /api/portfolio/holdings` | List the user's holdings, **joined** with `get_multiple_snapshots()` (existing) for each unique symbol's current price → compute per-row P&L |
| `PATCH /api/portfolio/holdings/{id}` | Edit `quantity`/`avgBuyPrice`/`note` |
| `DELETE /api/portfolio/holdings/{id}` | Delete a holding |
| `GET /api/portfolio/summary` | Aggregate all holdings → `PortfolioSummaryResponse` (total value/cost/P&L) |

**P&L formula** (purely arithmetic, no new data source needed):
```
market_value       = quantity × current_price          (current_price from get_quote_snapshot(), existing)
cost_basis          = quantity × avg_buy_price
unrealized_pnl      = market_value − cost_basis
unrealized_pnl_pct  = (unrealized_pnl / cost_basis) × 100
```

### 2.4 Code Snippet — `portfolio.py` (API Routes, Including P&L Calculation)

```python
# backend/app/api/portfolio.py
from fastapi import APIRouter, Depends

from app.api.schemas import HoldingCreateRequest, HoldingResponse, PortfolioSummaryResponse
from app.core.db import db
from app.core.deps import get_current_user
from app.services.market_data import get_multiple_snapshots

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.post("/holdings", response_model=HoldingResponse)
async def add_holding(payload: HoldingCreateRequest, user=Depends(get_current_user)):
    holding = await db.portfolioholding.create(
        data={
            "userId": user.id,
            "symbol": payload.symbol.upper(),
            "quantity": payload.quantity,
            "avgBuyPrice": payload.avg_buy_price,
            "buyDate": payload.buy_date,
            "note": payload.note,
        }
    )
    return _to_holding_response(holding, current_price=payload.avg_buy_price)


@router.get("/holdings", response_model=list[HoldingResponse])
async def list_holdings(user=Depends(get_current_user)):
    holdings = await db.portfolioholding.find_many(where={"userId": user.id})
    if not holdings:
        return []

    unique_symbols = list({h.symbol for h in holdings})
    snapshots = get_multiple_snapshots(unique_symbols)  # existing, one call for all symbols
    price_map = {s.symbol: s.last_price for s in snapshots}

    return [
        _to_holding_response(h, current_price=price_map.get(h.symbol))
        for h in holdings
    ]


@router.get("/summary", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary(user=Depends(get_current_user)):
    holdings = await list_holdings(user=user)  # reuses the joined-price logic above

    total_value = sum(h.market_value or 0 for h in holdings)
    total_cost = sum(float(h.quantity) * float(h.avg_buy_price) for h in holdings)
    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0

    return PortfolioSummaryResponse(
        total_value=total_value,
        total_cost=total_cost,
        total_unrealized_pnl=total_pnl,
        total_unrealized_pnl_pct=total_pnl_pct,
        holdings=holdings,
    )


def _to_holding_response(holding, current_price: float | None) -> HoldingResponse:
    """Applies the P&L formula from §2.3 to a single holding row."""
    quantity = float(holding.quantity)
    avg_buy_price = float(holding.avgBuyPrice)
    cost_basis = quantity * avg_buy_price

    market_value = quantity * current_price if current_price is not None else None
    unrealized_pnl = (market_value - cost_basis) if market_value is not None else None
    unrealized_pnl_pct = (
        (unrealized_pnl / cost_basis * 100) if unrealized_pnl is not None and cost_basis > 0 else None
    )

    return HoldingResponse(
        id=holding.id,
        symbol=holding.symbol,
        quantity=quantity,
        avg_buy_price=avg_buy_price,
        current_price=current_price,
        market_value=market_value,
        unrealized_pnl=unrealized_pnl,
        unrealized_pnl_pct=unrealized_pnl_pct,
        note=holding.note,
    )
```

### 2.5 Frontend — Tasks

| Task | Detail |
|---|---|
| `frontend/app/(app)/portfolio/page.tsx` (new) | Summary (`PortfolioSummaryCards`) + holdings table + add button |
| `frontend/components/portfolio/AddHoldingModal.tsx` (new) | Form: symbol (reuses `api.searchSymbol()`), quantity, buy price, buy date |
| `frontend/components/portfolio/HoldingsTable.tsx` (new) | Dense table — symbol, quantity, avg buy, current price, P&L (`positive`/`negative` color, same pattern as `WatchlistTable.tsx`) |
| `frontend/components/portfolio/PortfolioSummaryCards.tsx` (new) | 3–4 metric cards: Total Value, Total Cost, Unrealized P&L (amount + %) — same visual pattern as `MetricsStrip.tsx` (dashboard, existing) |
| `frontend/components/portfolio/AllocationChart.tsx` (new, optional phase 2) | Donut/pie breakdown of allocation by symbol or by market (reuse categories from `CategoryTabs.tsx`/`sectorBaskets.ts` for a sector breakdown, if desired) |
| `frontend/lib/api.ts` | Add `api.addHolding()`, `api.listHoldings()`, `api.updateHolding()`, `api.deleteHolding()`, `api.getPortfolioSummary()` |
| `frontend/types/market.ts` | Add `Holding`, `PortfolioSummary` interfaces |

### 2.6 Code Snippet — `PortfolioSummaryCards.tsx`

```tsx
// frontend/components/portfolio/PortfolioSummaryCards.tsx
'use client';

import { PortfolioSummary } from '@/types/market';
import { formatPrice, formatPercent, isPositive } from '@/lib/format';

export function PortfolioSummaryCards({ summary }: { summary: PortfolioSummary }) {
  const positive = isPositive(summary.total_unrealized_pnl);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded border border-border bg-panel p-3">
        <div className="text-xs text-text-muted">Total Value</div>
        <div className="mt-1 font-mono text-lg font-semibold text-text-primary">
          {formatPrice(summary.total_value)}
        </div>
      </div>
      <div className="rounded border border-border bg-panel p-3">
        <div className="text-xs text-text-muted">Total Cost</div>
        <div className="mt-1 font-mono text-lg font-semibold text-text-primary">
          {formatPrice(summary.total_cost)}
        </div>
      </div>
      <div className="rounded border border-border bg-panel p-3">
        <div className="text-xs text-text-muted">Unrealized P&amp;L</div>
        <div className={`mt-1 font-mono text-lg font-semibold ${positive ? 'text-positive' : 'text-negative'}`}>
          {formatPrice(summary.total_unrealized_pnl)} ({formatPercent(summary.total_unrealized_pnl_pct)})
        </div>
      </div>
    </div>
  );
}
```

### 2.7 Required Disclaimer

The Portfolio page **must** display an explicit disclaimer (same pattern as the existing
Dashboard/Chart disclaimers):

> *"Portfolio is manual record-keeping — it is not connected to any real broker/exchange.
> Prices and portfolio value are estimates for personal research, not an official transaction
> record."*

### 2.8 Sidebar Wiring

```ts
{ href: '/portfolio', label: 'Portfolio', short: 'Pf' },   // remove soon: true, href: '#'
```

---

## 3. Settings Menu

### 3.1 Goal

One centralized page for account & display preferences — currently users have no way to change
their name/password, view subscription status (the `Subscription` model **already exists** in
the schema but has no UI at all), or set default preferences (default market tab, default
watchlist).

### 3.2 Data Model

**No new model is needed for most of Settings** — `User` and `Subscription` already exist. For
display preferences (not sensitive data), add a single JSON field to `User` instead of a
separate table for something this simple:

```prisma
model User {
  // ...existing fields unchanged...
  preferences Json? @map("preferences")
  // example contents: { "defaultMarket": "indonesia", "defaultChartPeriod": "6mo" }
}
```

### 3.3 Backend — Tasks

| Task | Detail |
|---|---|
| Migration adding the `preferences` column (`Json?`) to `User` | `prisma migrate dev --name add_user_preferences` |
| `backend/app/api/schemas.py` — `UpdateProfileRequest`, `ChangePasswordRequest`, `UpdatePreferencesRequest`, `SubscriptionResponse` | — |
| `backend/app/api/auth.py` (existing, extended) — `PATCH /api/auth/me` | Updates `name` (email **cannot** be changed here — changing email needs a separate verification flow, outside v1's scope) |
| `POST /api/auth/change-password` | Verify the old password (`verify_password()`, existing in `core/security.py`) before setting the new one (`hash_password()`, existing) |
| `backend/app/api/settings.py` (new) — `GET/PATCH /api/settings/preferences` | Read/write the `preferences` column on `User` |
| `GET /api/settings/subscription` | Reads the user's `Subscription` (model **already exists**, new endpoint) — returns tier `FREE`/`PRO`/`PREMIUM` + status. If the user doesn't have a `Subscription` row yet (likely for existing users created before this feature), **default to displaying `FREE`** without silently creating a row (to avoid quietly generating billing data) |

### 3.4 Code Snippet — `settings.py` (Preferences & Subscription Routes)

```python
# backend/app/api/settings.py
from fastapi import APIRouter, Depends

from app.api.schemas import SubscriptionResponse, UpdatePreferencesRequest
from app.core.db import db
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/preferences")
async def get_preferences(user=Depends(get_current_user)):
    return user.preferences or {}


@router.patch("/preferences")
async def update_preferences(payload: UpdatePreferencesRequest, user=Depends(get_current_user)):
    # Merge rather than overwrite, so partial updates don't wipe unrelated keys
    current = user.preferences or {}
    merged = {**current, **payload.model_dump(exclude_none=True)}
    updated = await db.user.update(where={"id": user.id}, data={"preferences": merged})
    return updated.preferences


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(user=Depends(get_current_user)):
    subscription = await db.subscription.find_first(where={"userId": user.id})
    if subscription is None:
        # No row created automatically — see task table note in §3.3
        return SubscriptionResponse(tier="FREE", status="ACTIVE", has_billing_record=False)

    return SubscriptionResponse(
        tier=subscription.tier,
        status=subscription.status,
        has_billing_record=True,
    )
```

### 3.5 Code Snippet — `change-password` Route (Password Verification Flow)

```python
# Excerpt from backend/app/api/auth.py (existing file, extended)
from app.core.security import hash_password, verify_password

@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, user=Depends(get_current_user)):
    full_user = await db.user.find_unique(where={"id": user.id})

    if not verify_password(payload.old_password, full_user.passwordHash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(payload.new_password)
    await db.user.update(where={"id": user.id}, data={"passwordHash": new_hash})
    return {"success": True}
```

### 3.6 Frontend — Tasks

The page uses **tabs/sections**, not a single long form (consistent with the project's dense
design pattern):

| Section | Contents | Task |
|---|---|---|
| **Profile** | Name, email (read-only), change-password button | `frontend/components/settings/ProfileSection.tsx` (new) |
| **Preferences** | Default market tab (US/Indonesia/Crypto), default chart period | `frontend/components/settings/PreferencesSection.tsx` (new) — saved via `PATCH /api/settings/preferences`, read on `MarketTabs.tsx`/`ChartControls` mount to fill in the default (optional, phase 2) |
| **Subscription** | Shows the active tier (`FREE`/`PRO`/`PREMIUM`), status badge | `frontend/components/settings/SubscriptionSection.tsx` (new) — **read-only** in v1, upgrade button disabled with a "Coming Soon" label (billing/Midtrans is still Phase 3, not yet implemented — see `Documentation/Documentation-Business.md` §6) |
| **Data & Privacy** | Delete-account button (with explicit confirmation) | `frontend/components/settings/DangerZoneSection.tsx` (new) — needs a new `DELETE /api/auth/me` backend endpoint, cascading delete of `WatchlistItem`/`Alert`/`PortfolioHolding` (all already `onDelete: Cascade` in the schema) |

| Additional Task | Detail |
|---|---|
| `frontend/app/(app)/settings/page.tsx` (new) | Tab layout, assembles the 4 sections above |
| `frontend/lib/api.ts` | Add `api.updateProfile()`, `api.changePassword()`, `api.getPreferences()`, `api.updatePreferences()`, `api.getSubscription()`, `api.deleteAccount()` |

### 3.7 Code Snippet — `SubscriptionSection.tsx`

```tsx
// frontend/components/settings/SubscriptionSection.tsx
'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  PREMIUM: 'Premium',
};

export function SubscriptionSection() {
  const { data: subscription, isLoading } = useSWR('subscription', () => api.getSubscription());

  if (isLoading) return <div className="text-sm text-text-muted">Loading...</div>;

  return (
    <div className="rounded border border-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">Current Plan</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">
            {TIER_LABELS[subscription?.tier ?? 'FREE']}
          </div>
        </div>
        <button
          disabled
          title="Billing is coming in a future release"
          className="cursor-not-allowed rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted"
        >
          Upgrade — Coming Soon
        </button>
      </div>
    </div>
  );
}
```

### 3.8 Sidebar Wiring

```ts
{ href: '/settings', label: 'Settings', short: 'St' },   // remove soon: true, href: '#'
```

---

## 4. Open Questions (Needs Further Confirmation)

- [ ] **Alerts:** Is push/email notification needed for alerts that fire while the user is
      offline? (Requires a background worker + an email service — a major architectural change,
      outside v1's scope, which is purely in-app/lazy-check, see §1.9.)
- [ ] **Alerts:** What's the maximum number of active alerts per user per tier
      (`FREE`/`PRO`/`PREMIUM`)? Relevant once §3's Subscription is actually enforced, not just
      displayed.
- [ ] **Portfolio:** Is historical P&L (a chart of portfolio value over time) needed, or is a
      real-time snapshot — as specified in v1 — sufficient?
- [ ] **Portfolio:** Display currency — if a user holds a mix of IDX stocks (IDR) and US stocks
      (USD) in one portfolio, does Total Value need conversion to a single base currency?
      (`yfinance` doesn't provide a real-time exchange rate outside of forex pairs like
      `XXXYYY=X` — the existing `ForexStrip.tsx` pattern could be reused for a rough conversion.)
- [ ] **Settings:** Changing email — needs a verification flow (sending a confirmation email)
      that has no infrastructure yet (no email service exists in this project) — noted as a v1
      limitation (email stays read-only for now), not something to implement right away.

---

## 5. Related Documents

- `Environment/2026-09-06_DatabaseSupabase_v1.1.md` — the Prisma migration procedure reused for
  the `Alert`/`PortfolioHolding` models in this document
- `Environment/2026-09-06_JWTAuth_v1.0.md` — `get_current_user()`/`core/security.py`, the basis
  for protecting the endpoints in all three menus
- `Environment/2026-09-21_NewFeatures_v1.1.md` — separate feature ideas for
  Dashboard/Watchlist/Chart/Analysis/News (from `yfinance`), not overlapping with this document
- `Documentation/Documentation-Business.md` §4, §6 — Admin/Member roles & the Phase 3
  Subscription roadmap that provides context for the Subscription section in Settings