# Enhancement — Redesign UI/UX (Bagian 2: Teknis & Implementasi)

> **Versi Dokumen:** 1.0
> **Terkait:** `PRD/Documentation-Program.md` §7 (Arsitektur Frontend+Backend Tahap 2)
> **Dokumen pasangan:** `Enhancement-Design-1-UXVisual.md` (desain visual & business)
> **Status:** ✅ Diimplementasikan (rilis pertama — routing + AppShell + API baru)
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Frontend/Backend Developer, AI agent yang melanjutkan implementasi

---

## 1. Ringkasan Perubahan Teknis

Redesign ini **tidak mengubah** layer data/indikator (`backend/app/services/*`,
`backend/app/indicators/technical.py`) — perubahan terbatas pada:

1. **Frontend:** struktur routing baru (multi-halaman, bukan single-page seperti sekarang),
   token desain (font `Plus Jakarta Sans`), komponen baru per layar.
2. **Backend:** beberapa endpoint baru untuk data yang belum diekspos (index global, top gainers,
   market cap/dominance, fear & greed, skor analisis 0–100, radar chart).
3. **Tidak ada perubahan** pada `backend/prisma/schema.prisma` — model `User/WatchlistItem/
   Subscription/Payment` yang sudah dibuat di `Environment/Enhancement-system-setup_DatabaseSupabase.md`
   tetap dipakai apa adanya untuk Login/Sign Up saat auth diimplementasikan (di luar cakupan
   dokumen ini).

---

## 2. Perubahan Struktur Frontend (Next.js App Router)

### 2.1 Routing Baru

Implementasi saat ini hanya punya satu route (`frontend/app/page.tsx`). Redesign butuh App Router
multi-halaman:

```
frontend/app/
├── (marketing)/
│   ├── page.tsx                 # Landing Page (layar 2) — publik, tanpa sidebar app-shell
│   └── layout.tsx               # Navbar publik (Features/Markets/Pricing/...)
├── onboarding/
│   └── page.tsx                 # Onboarding 3-slide (layar 1) — hanya tampil sekali (localStorage flag)
├── login/
│   └── page.tsx                 # Login (layar 3)
├── signup/
│   └── page.tsx                 # Sign Up (layar 3)
├── (app)/                       # Route group untuk halaman ber-sidebar (app-shell)
│   ├── layout.tsx               # AppShell: sidebar nav + ticker bar index global
│   ├── dashboard/page.tsx       # Dashboard ringkasan pasar (layar 4)
│   ├── watchlist/page.tsx       # Watchlist dengan tab kategori (layar 6)
│   ├── chart/[symbol]/page.tsx  # Chart + toolbar timeframe (layar 7) — dynamic route per simbol
│   ├── news/page.tsx            # News dengan tab filter (layar 8)
│   ├── analysis/page.tsx        # Sub-menu Analysis Overview (layar 5)
│   └── analysis/[symbol]/page.tsx  # Analysis Detail (layar 9)
├── layout.tsx                   # Root layout (font, metadata) — tetap ada
└── globals.css
```

**Migrasi dari kondisi sekarang:** logic yang ada di `app/page.tsx` (state watchlist, SWR fetch,
localStorage sync) dipecah — bagian watchlist pindah ke `(app)/watchlist/page.tsx`, bagian
chart+news pindah ke `(app)/chart/[symbol]/page.tsx` dan `(app)/news/page.tsx`. State watchlist
global (dipakai di banyak halaman) dipindah ke React Context (`WatchlistProvider`) di
`(app)/layout.tsx`, bukan `useState` lokal per halaman seperti sekarang.

### 2.2 Perubahan Tipografi

`frontend/app/globals.css` dan `frontend/tailwind.config.js` perlu diupdate:

```css
/* globals.css — ganti import font */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

```js
// tailwind.config.js
fontFamily: {
  sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'], // sebelumnya: ['Inter', ...]
  mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'], // tidak berubah
},
```

Tidak ada perubahan pada token warna (`colors: {...}`) — palet di `tailwind.config.js` saat ini
**sudah match** dengan brief desain (`canvas #0E1117`, `panel #161B22`, `positive #00E676`, dst.),
jadi bagian ini reusable langsung tanpa modifikasi.

### 2.3 Komponen Baru yang Perlu Dibuat

| Komponen | Halaman | Catatan Implementasi |
|---|---|---|
| `components/onboarding/OnboardingCarousel.tsx` | Onboarding | State slide index lokal, dot indicator, tombol Next/Get Started, flag `onboarding_seen` di `localStorage` |
| `components/marketing/Navbar.tsx`, `Hero.tsx`, `StatsStrip.tsx` | Landing Page | Statis, tidak perlu SWR — data stats bisa hardcode/CMS sederhana |
| `components/auth/AuthCard.tsx` | Login/Sign Up | Form terkontrol, validasi client-side dasar (format email, panjang password) — submit handler placeholder (`TODO: wire ke /api/auth` saat backend siap) |
| `components/app/AppShell.tsx` | Semua halaman `(app)/*` | Sidebar nav + slot konten; menggantikan `Sidebar.tsx` lama yang isinya watchlist (dipecah jadi `AppSidebarNav` navigasi + `WatchlistPanel` terpisah) |
| `components/app/TickerBar.tsx` | AppShell | Index global (`S&P 500, DOW 30, NASDAQ, BTCUSD`), polling SWR 30–60 detik |
| `components/dashboard/MarketOverviewChart.tsx` | Dashboard | Mini line chart 1 index, dropdown periode |
| `components/dashboard/TopGainersTable.tsx`, `MetricsStrip.tsx`, `CryptoSnapshotTable.tsx` | Dashboard | Lihat kebutuhan API baru di §3 |
| `components/analysis/ScoreGauge.tsx` | Analysis Overview | Radial gauge SVG (0–100), warna interpolasi merah→kuning→hijau |
| `components/analysis/IndicatorSignalRow.tsx` | Analysis Overview/Detail | Baris `Indicator | Value | Badge Signal` reusable |
| `components/analysis/SupportResistancePanel.tsx` | Analysis Overview | Statis dari 4 angka (support1/2, resistance1/2) |
| `components/analysis/RadarChart.tsx` | Analysis Detail | 5 sumbu (Price Action/Volume/Momentum/Trend/Volatility) — bisa pakai SVG manual (ringan) daripada menambah dependency chart baru |
| `components/watchlist/CategoryTabs.tsx` | Watchlist | Tab `My Watchlist/Tech Stocks/Crypto/Forex` — kategori disimpan sebagai metadata per simbol di state watchlist (bukan dari backend) |
| `components/news/NewsTabs.tsx`, `NewsCard.tsx` (dengan thumbnail) | News | `NewsCard` ganti dari `<a>` link sederhana ke card dengan `<img>` (fallback ke ikon publisher jika tidak ada thumbnail) |
| `components/chart/TimeframeToolbar.tsx`, `IndicatorDropdown.tsx` | Chart | Menggantikan `ChartControls.tsx` (button group besar) dengan toolbar compact di atas chart |

**Dipertahankan tanpa perubahan besar:** `CandlestickChart.tsx` (logic 3-panel lightweight-charts),
`lib/api.ts` (base client, tinggal tambah fungsi baru), `lib/format.ts`, `types/market.ts` (tinggal
tambah interface baru).

---

## 3. Endpoint Backend Baru yang Dibutuhkan

Semua endpoint baru mengikuti pola yang sudah ada (`backend/app/api/*.py`, cache via `ttl_cache`,
schema di `backend/app/api/schemas.py`). **Tidak ada endpoint lama yang berubah/breaking.**

| Endpoint | Fungsi | Sumber Data | Catatan |
|---|---|---|---|
| `GET /api/market/overview` | Snapshot index global (`^GSPC`, `^DJI`, `^IXIC`) + `BTC-USD` | `yfinance` (simbol index sudah didukung `get_quote_snapshot()`, tinggal endpoint baru yang panggil untuk list simbol tetap) | Reuse penuh `get_multiple_snapshots()` yang sudah ada |
| `GET /api/market/top-gainers?limit=5` | Top N simbol dengan `change_pct` tertinggi dari watchlist yang dikirim, atau dari daftar indeks acuan | Hitung di backend dari `get_multiple_snapshots()` | Sederhana — tidak butuh sumber data baru, hanya sorting |
| `GET /api/market/summary` | `Market Cap`, `24h Volume`, `BTC Dominance` (agregat crypto) | `yfinance` per simbol crypto utama (`BTC-USD`, `ETH-USD`, dst.), dijumlahkan | Market cap total pasar saham **tidak realistis** dari `yfinance` gratis — batasi ke crypto atau tandai sebagai estimasi/placeholder di UI |
| `GET /api/market/fear-greed` | Indeks Fear & Greed | **Tidak tersedia di `yfinance`** — perlu sumber eksternal (mis. alternative.me API untuk crypto Fear&Greed) atau dihitung proksi sederhana dari volatilitas + momentum RSI rata-rata watchlist | ⚠️ Butuh keputusan produk: pakai API pihak ketiga (dependency baru) vs. proksi internal (kurang akurat tapi tanpa dependency) |
| `GET /api/analysis/score/{symbol}` | Skor 0–100 (dipakai `ScoreGauge`) + label (Strong Buy/Buy/Neutral/Sell/Strong Sell) | Turunan dari indikator existing: bobot RSI, MACD, posisi MA20 vs MA50 | Perluasan `simple_signal()` — ubah dari string ke skor numerik. **Tetap harus disertai disclaimer**, lihat §4.5/4.9 di `Enhancement-Design-1-UXVisual.md` |
| `GET /api/analysis/radar/{symbol}` | 5 skor sumbu: Price Action, Volume, Momentum, Trend, Volatility | Perhitungan baru di `technical.py` (mis. Volatility dari stdev return, Volume dari rata-rata vs rata-rata historis, dst.) | Fungsi baru murni matematis, ikuti pola `add_all_indicators()` — taruh di `technical.py` supaya tetap reusable Streamlit/FastAPI |
| `GET /api/market/support-resistance/{symbol}` | 2 level support + 2 level resistance | Bisa dihitung sederhana dari local min/max N hari terakhir, atau titik pivot standar | Fungsi baru di `technical.py` |

**Perluasan `add_all_indicators()`:** tambahkan `MA100`, `MA200` (dipakai layar Analysis Detail §4.9)
— perubahan aditif, tidak mengubah kolom yang sudah ada, aman untuk Streamlit maupun FastAPI karena
modul ini dipakai identik di kedua tempat (lihat `Documentation-Program.md` §4.3).

**Perluasan `QuoteSnapshot` / `search_symbol()`:** tambahkan field `market_cap` (dari
`ticker.get_info()["marketCap"]`) untuk kolom baru di tabel Watchlist (layar 6). Field opsional
(`float | None`), tidak breaking untuk consumer lama karena `QuoteSnapshotResponse` di
`schemas.py` menambah field baru dengan default `None`.

---

## 4. Sinkronisasi Tipe Frontend ↔ Backend

`frontend/types/market.ts` di-mirror manual dari `backend/app/api/schemas.py` (belum ada codegen
otomatis — batasan yang sudah dicatat di `Documentation-Program.md` §7.4). Untuk setiap endpoint
baru di §3, tambahkan interface sepadan, contoh:

```ts
// types/market.ts — tambahan
export interface MarketOverviewItem extends QuoteSnapshot {}

export interface AnalysisScore {
  symbol: string;
  score: number;          // 0-100
  label: string;          // "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell"
}

export interface RadarScore {
  symbol: string;
  price_action: number;
  volume: number;
  momentum: number;
  trend: number;
  volatility: number;
}

export interface SupportResistance {
  symbol: string;
  support: [number, number];
  resistance: [number, number];
}
```

Tambahkan fungsi sepadan di `lib/api.ts` mengikuti pola `fetchJson<T>()` yang sudah ada — tidak
perlu klien HTTP baru.

---

## 5. Fitur yang Sengaja Ditunda (Out of Scope Rilis Pertama)

| Fitur di mockup | Alasan ditunda |
|---|---|
| Toolbar alat gambar di Chart (garis trend manual, dll.) | `lightweight-charts` v4 butuh custom plugin untuk drawing tools — effort tinggi, bukan blocker untuk redesign visual utama |
| Login via Google/Apple/Microsoft (OAuth) | Bergantung penyediaan auth backend (JWT/Supabase Auth) — di luar cakupan redesign UI, ikuti roadmap `Documentation-Program.md` §7.5 |
| Fear & Greed index akurat | Butuh keputusan sumber data pihak ketiga (lihat §3) — rilis pertama bisa tampilkan placeholder "Coming Soon" atau sembunyikan panel ini dulu |
| Portfolio & Alerts (item sidebar di mockup) | Belum ada spesifikasi fitur — item menu bisa ditampilkan dengan badge "Segera Hadir", bukan halaman fungsional |

---

## 6. Urutan Implementasi yang Disarankan

1. **Design tokens & font** — update `tailwind.config.js` (font) + `globals.css` (import font).
   Tidak berisiko, bisa langsung deploy tanpa mengubah fungsi apa pun.
2. **AppShell + routing** — pecah `app/page.tsx` jadi struktur `(app)/*` di §2.1, pindahkan state
   watchlist ke Context. Verifikasi watchlist/chart/news di halaman baru berfungsi identik dengan
   versi lama sebelum lanjut.
3. **Dashboard ringkasan** — endpoint `overview`, `top-gainers`, `summary` (§3) + komponen dashboard
   (§2.3). Fear & Greed bisa disembunyikan/placeholder dulu (lihat §5).
4. **Analysis Overview + Detail** — endpoint `score`, `radar`, `support-resistance` + komponen
   `ScoreGauge`/`RadarChart`. **Wajib review copy/disclaimer sebelum rilis** (lihat §4.5 & §4.9 di
   dokumen desain).
5. **Onboarding, Landing, Login/Sign Up** — halaman statis/UI-shell, tidak bergantung data baru,
   bisa dikerjakan paralel dengan langkah 3–4.
6. **Watchlist kategori + kolom Market Cap, News tab + thumbnail** — polish terakhir, dependency
   minim ke langkah lain.

---

## 7. Risiko Teknis

| Risiko | Mitigasi |
|---|---|
| Endpoint baru (`fear-greed`, `market cap total`) mengandalkan data yang `yfinance` tidak sediakan langsung | Batasi scope ke data yang realistis diambil (crypto-only untuk market cap/dominance), atau tandai eksplisit sebagai estimasi di UI |
| Refactor routing single-page → multi-page berisiko regresi state watchlist yang sudah jalan | Migrasi bertahap (§6 langkah 2), pastikan `localStorage` key `trading-dashboard-watchlist` tetap dibaca sama supaya watchlist existing user tidak hilang |
| Skor gauge/radar chart berisiko dibaca sebagai rekomendasi finansial eksplisit | Wajib disclaimer visible di setiap panel skor, review dengan `Documentation-Business.md` §5 sebelum rilis publik |
| Font baru (`Plus Jakarta Sans`) menambah request Google Fonts | Dampak minor (font sudah pakai `display=swap`), tidak perlu self-host di iterasi awal |

---

## 8. Dokumen Terkait

- `Enhancement-Design-1-UXVisual.md` — spesifikasi visual, tipografi, palet, inventaris layar.
- `PRD/Documentation-Program.md` §4.3, §7 — modul indikator & arsitektur Tahap 2 yang jadi basis reuse.
- `Environment/Enhancement-system-setup_DatabaseSupabase.md` — schema DB yang dipakai saat Login/Sign
  Up diwiring ke backend sungguhan.