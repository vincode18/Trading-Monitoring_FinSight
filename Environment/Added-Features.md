# Added Features — Melengkapi Menu Alerts, Portfolio & Settings

> **Versi Dokumen:** 1.0
> **Terkait:** `frontend/components/app/AppSidebarNav.tsx` (ketiga menu ini saat ini berstatus
> `soon: true`, `href: '#'` — belum ada halaman/route sama sekali)
> **Status:** 🔜 Diusulkan — belum diimplementasikan
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 0. Kondisi Saat Ini

Ketiga menu ini sudah muncul di sidebar (`AppSidebarNav.tsx`, baris 33–35) tapi murni **placeholder
visual** — `href: '#'`, badge "Soon", tidak bisa diklik, tidak ada route/halaman/endpoint apa pun
di baliknya. Dokumen ini adalah daftar task pengembangan untuk mengubah ketiganya dari placeholder
menjadi fitur fungsional, disusun per menu dengan pembagian jelas: **Data Model (Prisma)** →
**Backend (FastAPI)** → **Frontend (Next.js)** → **Sidebar Wiring**.

**Prinsip yang dipertahankan dari dokumen-dokumen sebelumnya:**
- Reuse sebanyak mungkin fungsi/endpoint yang sudah ada (`get_quote_snapshot`, `get_multiple_snapshots`,
  `compute_analysis_score`, `detect_ma_cross`, `volume_ratio` dari `technical.py` — semua sudah
  diimplementasikan, lihat `Environment/enhancement-design_DashboardPage_v1.md`).
- Model `User`/`Subscription`/`Payment` di `backend/prisma/schema.prisma` **sudah ada** (dari
  `Environment/Enhancement-system-setup_DatabaseSupabase.md`) — Portfolio & Settings menambah
  model baru di skema yang sama, bukan skema terpisah.
- Semua fitur baru **wajib** dilindungi `get_current_user()` (dependency existing,
  `backend/app/core/deps.py`) — ketiga menu ini per definisi personal/per-akun, beda dari
  data pasar publik (`market/chart/news`) yang sengaja tetap terbuka.
- Disclaimer non-goals tetap berlaku: **Portfolio bukan platform eksekusi order** — murni
  pencatatan manual oleh pengguna, tidak terhubung ke broker/exchange (selaras
  `PRD/Others/PRD.md` §3.1).

---

## 1. Menu Alerts

### 1.1 Tujuan

Pengguna bisa membuat kondisi pemicu (alert) atas simbol di watchlist mereka — misal "beri tahu
saya kalau harga BBCA.JK naik di atas 10.000" atau "beri tahu saya kalau RSI TLKM.JK oversold" —
dan melihat daftar alert yang sudah terpicu.

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
  RSI_OVERBOUGHT   // RSI14 > 70, threshold diabaikan/opsional
  RSI_OVERSOLD     // RSI14 < 30
  GOLDEN_CROSS     // reuse detect_ma_cross()
  DEATH_CROSS
  VOLUME_SPIKE     // reuse volume_ratio() > threshold
}

enum AlertStatus {
  ACTIVE
  TRIGGERED
  DISABLED
}
```

Tambah relasi `alerts Alert[]` di model `User`.

### 1.3 Backend — Task

| Task | Detail |
|---|---|
| Tambah model `Alert` ke `schema.prisma`, jalankan `prisma migrate dev --name add_alerts` | Ikuti prosedur di `Environment/Enhancement-system-setup_DatabaseSupabase.md` §5 |
| `backend/app/api/schemas.py` — tambah `AlertCreateRequest`, `AlertResponse` | `AlertCreateRequest`: `symbol`, `condition`, `threshold` (opsional untuk kondisi tanpa angka seperti `GOLDEN_CROSS`) |
| `backend/app/api/alerts.py` (baru) — `POST /api/alerts` | Buat alert baru, terikat ke `get_current_user()` |
| `GET /api/alerts` | List alert milik user (semua status, atau filter `?status=ACTIVE`) |
| `PATCH /api/alerts/{id}` | Toggle status (`ACTIVE`/`DISABLED`), tidak untuk edit kondisi (hapus & buat baru lebih sederhana daripada edit parsial) |
| `DELETE /api/alerts/{id}` | Hapus alert |
| `backend/app/services/alert_engine.py` (baru) — `evaluate_alerts_for_user(user_id)` | Loop semua alert `ACTIVE` milik user, panggil `get_quote_snapshot()`/`get_history()` + `add_all_indicators()`/`detect_ma_cross()`/`volume_ratio()` (**semua existing**) sesuai `condition`, set `status=TRIGGERED` + `triggeredAt` kalau kondisi terpenuhi |
| `GET /api/alerts/check` | Trigger `evaluate_alerts_for_user()` untuk user yang sedang login, return alert yang baru saja triggered — **dipanggil dari frontend via polling SWR** (pola sama seperti watchlist/dashboard), bukan cron job terpisah (lihat §1.5 catatan arsitektur) |

### 1.4 Frontend — Task

| Task | Detail |
|---|---|
| `frontend/app/(app)/alerts/page.tsx` (baru) | Halaman utama: form buat alert baru + daftar alert (tab `Aktif`/`Terpicu`/`Nonaktif`) |
| `frontend/components/alerts/AlertForm.tsx` (baru) | Pilih simbol (dari watchlist, reuse `useWatchlist()`), pilih `condition` (dropdown), input `threshold` (disembunyikan/disabled untuk kondisi tanpa angka) |
| `frontend/components/alerts/AlertsList.tsx` (baru) | Tabel/list alert, badge warna per status (`positive` untuk Triggered, `text-muted` untuk Disabled) |
| `frontend/components/app/AlertBadge.tsx` (baru) | Badge notifikasi kecil di item sidebar "Alerts" (jumlah alert `TRIGGERED` belum dilihat) — polling ringan via SWR (`refreshInterval` 60 detik) |
| `frontend/lib/api.ts` | Tambah `api.createAlert()`, `api.listAlerts()`, `api.toggleAlert()`, `api.deleteAlert()`, `api.checkAlerts()` |
| `frontend/types/market.ts` | Tambah interface `Alert`, `AlertCondition` |

### 1.5 Catatan Arsitektur — Evaluasi Alert Tanpa Background Job

Project ini **tidak punya infrastruktur job scheduler/cron** (backend FastAPI murni request-response,
sesuai `Documentation/Documentation-Program.md` §7). Alih-alih membangun scheduler baru (perubahan
arsitektur besar), evaluasi alert dilakukan **lazy** — dipicu tiap kali `AlertBadge.tsx` polling
`GET /api/alerts/check` (SWR, interval 60 detik) selama user sedang membuka aplikasi. Ini konsisten
dengan pola polling yang sudah dipakai di seluruh dashboard, tapi punya batasan jelas:

> ⚠️ Alert **tidak** akan terdeteksi kalau user sedang tidak membuka aplikasi sama sekali
> (tidak ada tab browser terbuka). Ini cukup untuk kebutuhan "cek saat saya buka app", **belum**
> memenuhi ekspektasi "beri tahu saya meski saya sedang tidak online" (butuh notifikasi
> push/email + background worker — di luar scope v1, dicatat di §4 Pertanyaan Terbuka).

### 1.6 Sidebar Wiring

`AppSidebarNav.tsx` — ganti entri:
```ts
{ href: '#', label: 'Alerts', short: 'Al', soon: true },
```
menjadi:
```ts
{ href: '/alerts', label: 'Alerts', short: 'Al' },
```
(hapus flag `soon`, hapus `href: '#'`).

---

## 2. Menu Portfolio

### 2.1 Tujuan

Pencatatan manual kepemilikan saham/crypto pengguna (jumlah lot/unit + harga beli) untuk melihat
nilai portofolio & untung/rugi belum terealisasi (*unrealized P&L*) secara real-time berdasarkan
harga pasar terkini. **Bukan** eksekusi order — murni tracker, sesuai non-goal produk yang sudah
ditegaskan berulang (`PRD/Others/PRD.md` §3.1, `Documentation/Documentation-Business.md`).

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

Tambah relasi `portfolioHoldings PortfolioHolding[]` di model `User`. Tidak perlu `@@unique` di
`[userId, symbol]` — pengguna boleh mencatat beberapa entri pembelian untuk simbol yang sama
(harga beli beda-beda tanggal), mirip pencatatan lot riil.

### 2.3 Backend — Task

| Task | Detail |
|---|---|
| Tambah model `PortfolioHolding`, migrasi (`prisma migrate dev --name add_portfolio`) | — |
| `backend/app/api/schemas.py` — `HoldingCreateRequest`, `HoldingResponse`, `PortfolioSummaryResponse` | `PortfolioSummaryResponse`: `total_value`, `total_cost`, `total_unrealized_pnl`, `total_unrealized_pnl_pct`, `holdings: list[HoldingResponse]` (tiap holding sudah termasuk `current_price`, `market_value`, `unrealized_pnl`) |
| `backend/app/api/portfolio.py` (baru) — `POST /api/portfolio/holdings` | Tambah holding baru |
| `GET /api/portfolio/holdings` | List holding milik user, **join** dengan `get_multiple_snapshots()` (existing) untuk harga terkini tiap simbol unik → hitung P&L per baris |
| `PATCH /api/portfolio/holdings/{id}` | Edit `quantity`/`avgBuyPrice`/`note` |
| `DELETE /api/portfolio/holdings/{id}` | Hapus holding |
| `GET /api/portfolio/summary` | Agregat semua holding → `PortfolioSummaryResponse` (total value/cost/P&L) |

**Formula P&L** (murni matematis, tidak butuh sumber data baru):
```
market_value      = quantity × current_price          (current_price dari get_quote_snapshot(), existing)
cost_basis         = quantity × avg_buy_price
unrealized_pnl     = market_value − cost_basis
unrealized_pnl_pct = (unrealized_pnl / cost_basis) × 100
```

### 2.4 Frontend — Task

| Task | Detail |
|---|---|
| `frontend/app/(app)/portfolio/page.tsx` (baru) | Ringkasan (`PortfolioSummaryCards`) + tabel holding + tombol tambah |
| `frontend/components/portfolio/AddHoldingModal.tsx` (baru) | Form: simbol (reuse `api.searchSymbol()`), jumlah, harga beli, tanggal beli |
| `frontend/components/portfolio/HoldingsTable.tsx` (baru) | Tabel dense — simbol, jumlah, avg buy, harga sekarang, P&L (warna `positive`/`negative`, pola sama `WatchlistTable.tsx`) |
| `frontend/components/portfolio/PortfolioSummaryCards.tsx` (baru) | 3–4 card metrik: Total Value, Total Cost, Unrealized P&L (nominal + %) — pola visual sama `MetricsStrip.tsx` (dashboard, existing) |
| `frontend/components/portfolio/AllocationChart.tsx` (baru, opsional fase 2) | Donut/pie breakdown alokasi per simbol atau per market (reuse kategori dari `CategoryTabs.tsx`/`sectorBaskets.ts` kalau ingin breakdown per sektor) |
| `frontend/lib/api.ts` | Tambah `api.addHolding()`, `api.listHoldings()`, `api.updateHolding()`, `api.deleteHolding()`, `api.getPortfolioSummary()` |
| `frontend/types/market.ts` | Tambah interface `Holding`, `PortfolioSummary` |

### 2.5 Disclaimer Wajib

Halaman Portfolio **wajib** menampilkan disclaimer eksplisit (pola sama seperti disclaimer di
Dashboard/Chart existing):

> *"Portfolio adalah pencatatan manual — bukan terhubung ke broker/exchange sungguhan. Harga &
> nilai portofolio bersifat estimasi untuk riset pribadi, bukan catatan transaksi resmi."*

### 2.6 Sidebar Wiring

```ts
{ href: '/portfolio', label: 'Portfolio', short: 'Pf' },   // hapus soon: true, href: '#'
```

---

## 3. Menu Settings

### 3.1 Tujuan

Satu halaman terpusat untuk pengaturan akun & preferensi tampilan — saat ini pengguna tidak punya
cara mengubah nama/password, melihat status subscription (model `Subscription` **sudah ada** di
skema tapi belum ada UI-nya sama sekali), atau mengatur preferensi default (market tab, watchlist
default).

### 3.2 Data Model

**Tidak perlu model baru untuk sebagian besar Settings** — `User` dan `Subscription` sudah ada.
Untuk preferensi tampilan (bukan data sensitif), tambah satu field JSON di `User` supaya tidak
perlu tabel terpisah untuk sesuatu yang sederhana:

```prisma
model User {
  // ...field existing tidak berubah...
  preferences Json? @map("preferences")
  // contoh isi: { "defaultMarket": "indonesia", "defaultChartPeriod": "6mo" }
}
```

### 3.3 Backend — Task

| Task | Detail |
|---|---|
| Migrasi tambah kolom `preferences` (`Json?`) ke `User` | `prisma migrate dev --name add_user_preferences` |
| `backend/app/api/schemas.py` — `UpdateProfileRequest`, `ChangePasswordRequest`, `UpdatePreferencesRequest`, `SubscriptionResponse` | — |
| `backend/app/api/auth.py` (existing, diperluas) — `PATCH /api/auth/me` | Update `name` (email **tidak** bisa diubah lewat sini — perubahan email butuh alur verifikasi terpisah, di luar scope v1) |
| `POST /api/auth/change-password` | Verifikasi password lama (`verify_password()`, existing di `core/security.py`) sebelum set password baru (`hash_password()`, existing) |
| `backend/app/api/settings.py` (baru) — `GET/PATCH /api/settings/preferences` | Baca/tulis kolom `preferences` di `User` |
| `GET /api/settings/subscription` | Baca `Subscription` milik user (model **sudah ada**, endpoint baru) — return tier `FREE`/`PRO`/`PREMIUM` + status. Kalau user belum punya row `Subscription` (kemungkinan besar untuk user existing yang dibuat sebelum fitur ini), **default tampilkan `FREE`** tanpa membuat row otomatis (biar tidak diam-diam membuat data billing) |

### 3.4 Frontend — Task

Halaman dengan **tab/section**, bukan satu form panjang (pola dense yang konsisten dengan desain
project):

| Section | Isi | Task |
|---|---|---|
| **Profile** | Nama, email (read-only), tombol ubah password | `frontend/components/settings/ProfileSection.tsx` (baru) |
| **Preferences** | Default market tab (US/Indonesia/Crypto), default periode chart | `frontend/components/settings/PreferencesSection.tsx` (baru) — simpan lewat `PATCH /api/settings/preferences`, baca saat `MarketTabs.tsx`/`ChartControls` mount untuk isi default (opsional, fase 2) |
| **Subscription** | Tampilkan tier aktif (`FREE`/`PRO`/`PREMIUM`), badge status | `frontend/components/settings/SubscriptionSection.tsx` (baru) — **read-only** di v1, tombol upgrade nonaktif dengan label "Segera Hadir" (billing/Midtrans masih Tahap 3, belum diimplementasikan — lihat `Documentation/Documentation-Business.md` §6) |
| **Data & Privasi** | Tombol hapus akun (dengan konfirmasi eksplisit) | `frontend/components/settings/DangerZoneSection.tsx` (baru) — endpoint `DELETE /api/auth/me` perlu ditambah di backend, hapus cascade `WatchlistItem`/`Alert`/`PortfolioHolding` (semua sudah `onDelete: Cascade` di skema) |

| Task Tambahan | Detail |
|---|---|
| `frontend/app/(app)/settings/page.tsx` (baru) | Layout tab, merangkai 4 section di atas |
| `frontend/lib/api.ts` | Tambah `api.updateProfile()`, `api.changePassword()`, `api.getPreferences()`, `api.updatePreferences()`, `api.getSubscription()`, `api.deleteAccount()` |

### 3.5 Sidebar Wiring

```ts
{ href: '/settings', label: 'Settings', short: 'St' },   // hapus soon: true, href: '#'
```

---

## 4. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] **Alerts:** Apakah butuh notifikasi push/email untuk alert yang terpicu saat user offline?
      (Butuh background worker + layanan email — perubahan arsitektur besar, di luar scope v1
      yang murni in-app/lazy-check, lihat §1.5.)
- [ ] **Alerts:** Berapa limit maksimal alert aktif per user per tier (`FREE`/`PRO`/`PREMIUM`)?
      Relevan begitu §3 Subscription mulai ditegakkan (enforcement), bukan sekadar ditampilkan.
- [ ] **Portfolio:** Apakah butuh riwayat P&L historis (grafik nilai portofolio dari waktu ke
      waktu), atau cukup snapshot real-time seperti yang dispesifikasikan di v1?
- [ ] **Portfolio:** Mata uang tampilan — kalau user punya campuran saham IDX (IDR) dan saham US
      (USD) di satu portofolio, apakah perlu konversi ke satu mata uang dasar untuk Total Value?
      (`yfinance` tidak menyediakan kurs real-time selain lewat pair forex `XXXYYY=X`, bisa reuse
      pola `ForexStrip.tsx` existing untuk konversi kasar.)
- [ ] **Settings:** Perubahan email — butuh alur verifikasi (kirim email konfirmasi) yang belum
      ada infrastrukturnya (belum ada layanan email project ini) — didaftarkan sebagai batasan v1
      (email read-only dulu), bukan diimplementasikan sekarang.

---

## 5. Dokumen Terkait

- `Environment/Enhancement-system-setup_DatabaseSupabase.md` — prosedur migrasi Prisma yang
  dipakai ulang untuk model `Alert`/`PortfolioHolding` di dokumen ini
- `Environment/enhancement-system_JWTAuth.md` — `get_current_user()`/`core/security.py` yang jadi
  basis proteksi endpoint ketiga menu ini
- `Environment/New-Features.md` — ide fitur terpisah untuk Dashboard/Watchlist/Chart/Analysis/News
  (dari `yfinance`), tidak tumpang tindih dengan dokumen ini
- `Documentation/Documentation-Business.md` §4, §6 — role Admin/Member & roadmap Subscription
  Tahap 3 yang jadi konteks section Subscription di Settings
