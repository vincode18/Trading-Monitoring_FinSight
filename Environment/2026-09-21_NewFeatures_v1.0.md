# New Features — Ide Perluasan Fitur dari yfinance

> **Versi Dokumen:** 1.0
> **Terkait:** `Environment/2026-09-06_DashboardPage_v1.0.md`, `Environment/2026-09-07_DashboardPage_v1.1.md`
> (dashboard sudah diimplementasikan — lihat commit `368ffb4`), `Documentation/Documentation-Program.md`
> §4.1–4.3
> **Sumber:** `yfinance` API reference — `Ticker` (`ticker.py`), `Sector`/`Industry`/`Market` (domain
> classes), `Screener`/`EquityQuery` — diverifikasi langsung dari source
> `github.com/ranaroussi/yfinance` (dokumentasi resmi `ranaroussi.github.io` tidak bisa diakses
> dari environment ini, jadi verifikasi dilakukan lewat source code, bukan halaman dokumentasi)
> **Status:** 💡 Kumpulan ide — belum diprioritaskan/disetujui, kecuali item yang ditandai
> **wajib** (War Room, Navbar) yang sudah jadi requirement eksplisit
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Product Owner, Frontend Developer, Backend Developer

---

## 0. Prinsip Seleksi Ide

Sama seperti pendekatan `2026-09-06_DashboardPage_v1.0.md`: **semua ide di bawah memakai
`yfinance` yang sudah jadi dependency inti** — tidak ada API key baru, tidak ada dependency Python
baru (kecuali disebutkan eksplisit). Setiap ide ditandai sudah dicek terhadap `yfinance` versi yang
dipakai project (`>=0.2.54`, `backend/requirements.txt`) lewat pembacaan source code langsung.

**Cakupan permukaan `yfinance` yang belum dipakai sama sekali oleh project saat ini** (baseline —
lihat §"Status Kode Saat Ini" di tiap ide untuk detail):

| Kelas/Domain | Method/Attribute Relevan | Dipakai Project? |
|---|---|---|
| `Ticker` | `recommendations`, `recommendations_summary`, `upgrades_downgrades` | ❌ Belum |
| `Ticker` | `analyst_price_targets`, `earnings_estimate`, `revenue_estimate`, `growth_estimates`, `eps_trend`, `eps_revisions` | ❌ Belum |
| `Ticker` | `major_holders`, `institutional_holders`, `mutualfund_holders`, `insider_transactions`, `insider_purchases`, `insider_roster_holders` | ❌ Belum |
| `Ticker` | `income_stmt`/`balance_sheet`/`cash_flow` (+ `quarterly_*`/`ttm_*`) | ❌ Belum |
| `Ticker` | `sustainability` (skor ESG) | ❌ Belum |
| `Ticker` | `options`, `option_chain()` | ❌ Belum |
| `Ticker` | `dividends`, `splits`, `capital_gains`, `actions` | ❌ Belum (hanya dipakai implisit lewat `history()` dengan `auto_adjust`) |
| `Ticker` | `calendar`, `earnings_dates` | 🟡 Sebagian — `calendar` sudah dipakai penuh untuk Earnings Calendar (`get_earnings_calendar()`); `earnings_dates` (DataFrame historis, beda dari `calendar`) belum |
| `Sector` / `Industry` (domain class baru) | `overview`, `top_companies`, `research_reports`, `top_etfs`, `top_mutual_funds`, `industries` | ❌ Belum — project saat ini pakai mapping sektor **statis manual** (`frontend/lib/sectorBaskets.ts`, `backend/app/config/sectors.py`), bukan data live dari `yfinance` |
| `Market` (domain class baru) | `status` (jam buka/tutup + timezone per bursa), `summary` (ringkasan indeks per exchange) | ❌ Belum — status pasar (`market_state`) saat ini hanya dari `fast_info` per simbol individual |
| `EquityQuery` + `screen()` (Screener) | Kategori screener bawaan Yahoo (`day_gainers`, `most_actives`, dst. — nama persis perlu diverifikasi saat implementasi) | ❌ Belum — Movers panel (`/api/market/volume-movers`, `/api/market/top-gainers`) saat ini **loop manual** tiap simbol pool, bukan pakai screener Yahoo langsung |
| `Ticker` | `sec_filings`, `isin`, `valuation` | ❌ Belum |
| `WebSocket`/`AsyncWebSocket` | Streaming quote real-time | ❌ Belum — **tetap non-goal** (lihat §7, sudah eksplisit ditolak di `2026-09-06_DashboardPage_v1.0.md` §1.1) |

---

## 1. Chart — War Room (Multi-Symbol Monitor) ⭐ Wajib

### 1.1 Tujuan

Menu baru di dalam halaman **Chart** yang memungkinkan pengguna memantau **hingga 6 simbol
sekaligus** dalam satu layar grid — untuk trader yang perlu membandingkan pergerakan beberapa
saham/aset secara paralel, bukan satu-per-satu seperti chart detail saat ini.

### 1.2 Kondisi Saat Ini

`frontend/app/(app)/chart/[symbol]/page.tsx` hanya mendukung **satu simbol per waktu** — memilih
simbol lain via dropdown mengganti seluruh halaman (fetch ulang chart, RSI, MACD untuk simbol
baru), bukan menambah panel baru di samping.

### 1.3 Struktur — War Room

**Route baru:** `frontend/app/(app)/chart/war-room/page.tsx`, diakses lewat tombol baru di
`ChartPage` (misal `⊞ War Room` di sebelah dropdown pemilih simbol yang sudah ada).

**Layout grid responsif** — mengikuti jumlah simbol yang dipilih:

| Jumlah Simbol | Grid |
|---|---|
| 1–2 | `1 kolom` (stack vertikal) atau `2 kolom` |
| 3–4 | `2 kolom × 2 baris` |
| 5–6 | `3 kolom × 2 baris` |

- Tiap sel grid berisi **mini candlestick chart** (bukan chart 3-panel penuh seperti halaman
  detail — hanya panel harga, supaya 6 chart muat dalam satu layar tanpa scroll berlebih) +
  header ringkas (simbol, harga terkini, `change_pct`, warna `positive`/`negative`).
- Klik sel manapun → navigasi ke `chart/{symbol}` (chart detail penuh 3-panel) untuk analisis
  mendalam satu simbol.
- Kontrol timeframe **global** di atas grid (satu `TimeframeToolbar.tsx`, existing dari halaman
  Chart) — mengubah periode/interval berlaku ke **semua 6 chart sekaligus**, supaya perbandingan
  antar simbol tetap apple-to-apple.
- Symbol picker: multi-select dari watchlist pengguna (`useWatchlist()` context, existing) +
  pencarian manual (reuse `api.searchSymbol()`, existing) — validasi maksimal 6 simbol terpilih,
  tombol tambah dinonaktifkan setelah simbol ke-6.
- Simbol terpilih untuk War Room disimpan di `localStorage` (key baru, misal
  `finsight-warroom-symbols`) — mengikuti pola persistensi watchlist yang sudah ada di
  `lib/watchlist-context.tsx`.

### 1.4 Sumber Data & Performa

- **Tidak butuh endpoint baru** — tiap panel memanggil `api.getChart(symbol, period, interval)`
  (existing, `GET /api/chart/{symbol}`) secara paralel, satu request per simbol (maks 6 request
  bersamaan, wajar untuk polling 30 detik yang sudah jadi pola project).
- Mini chart dirender pakai `lightweight-charts` (sudah dependency di `frontend/package.json`),
  versi **ringan** dari `CandlestickChart.tsx` existing — hanya `addCandlestickSeries()`, tanpa
  overlay MA/Bollinger/RSI/MACD terpisah, supaya render 6 chart sekaligus tetap ringan.
- Rate limiting: endpoint `/api/chart/{symbol}` sudah di-cache TTL di backend (`ttl_cache`,
  existing) — 6 simbol berbeda tetap 6 cache key terpisah, tidak ada masalah baru, tapi perlu
  dicek terhadap limit `slowapi` (`30/minute` per IP, `backend/app/core/rate_limit.py`) — 6
  request bersamaan tiap 30 detik = 12 request/menit dari War Room saja, masih di bawah limit
  asalkan tidak ada request lain menumpuk di endpoint sama dari user yang sama.

### 1.5 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| `frontend/app/(app)/chart/war-room/page.tsx` (baru) | Halaman War Room, grid responsif §1.3 |
| `frontend/components/chart/MiniCandlestickChart.tsx` (baru) | Versi ringan `CandlestickChart.tsx`, hanya panel harga |
| `frontend/components/chart/WarRoomSymbolPicker.tsx` (baru) | Multi-select simbol, maks 6, reuse `api.searchSymbol()` |
| `frontend/app/(app)/chart/[symbol]/page.tsx` | Tambah tombol `⊞ War Room` di header (existing file) |
| `frontend/lib/warroom-context.tsx` (baru, opsional) | State 6 simbol terpilih + sync `localStorage`, atau cukup `useState` lokal di halaman War Room jika tidak perlu dipakai lintas halaman |

---

## 2. Navbar/Sidebar — Logo saat Collapsed + Ikon Hamburger ⭐ Wajib

### 2.1 Kondisi Saat Ini

`frontend/components/app/AppSidebarNav.tsx`:
- Saat collapsed (`collapsed === true`), header menampilkan **teks singkatan** `"FS"` (baris 154),
  bukan mark logo grafis.
- Tombol toggle collapse memakai `ChevronIcon` (baris 45–64) — panah `<` yang rotasi 180° saat
  toggle, bukan ikon hamburger (☰).

### 2.2 Perubahan

1. **Logo saat collapsed:** Ganti teks `"FS"` (`<div className="text-xs font-bold ...">FS</div>`)
   dengan **mark logo grafis** (SVG inline atau `<img>` kecil, 24×24px) — konsisten dengan brand
   FinSight. Karena belum ada aset logo final di repo, pakai SVG monogram sederhana (lingkaran
   candlestick/mark geometris warna `positive` di atas `panel`) sebagai placeholder sampai aset
   asli tersedia — pola yang sama dengan placeholder `placehold.co` di
   `Environment/2026-09-06_OnboardingLoginPage_v2.0.md` §3, tapi karena ini elemen UI kecil
   yang sering dirender (bukan gambar konten), lebih baik inline SVG langsung di kode daripada
   fetch eksternal.
2. **Ikon hamburger untuk toggle:** Ganti `ChevronIcon` dengan ikon hamburger 3-garis (☰) untuk
   **kedua** state (collapsed maupun expanded) — konvensi hamburger lebih universal dikenali
   sebagai "toggle menu" dibanding panah, dan tidak perlu animasi rotasi (state cukup dibedakan
   lewat `aria-expanded`/tooltip saja, bukan visual ikon berubah arah).

```tsx
// Pengganti ChevronIcon di AppSidebarNav.tsx
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

### 2.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| `AppSidebarNav.tsx` — blok `<Link href="/dashboard">` (baris ~148–161) | Ganti render teks `"FS"` collapsed jadi `<LogoMark />` (komponen SVG baru) |
| `AppSidebarNav.tsx` — fungsi `ChevronIcon` (baris 45–64) | Diganti/ditambah `HamburgerIcon` (§2.2), dipakai di tombol toggle (baris ~170) |
| `frontend/components/app/LogoMark.tsx` (baru, opsional dipisah) | Komponen SVG logo mark reusable — bisa dipakai ulang juga di `Navbar.tsx` (marketing) dan `AuthCard.tsx` kalau ingin konsistensi lebih lanjut (di luar scope wajib saat ini) |

---

## 3. Watchlist — Ide dari `yfinance`

| Ide | Sumber `yfinance` | Status Kode | Catatan |
|---|---|---|---|
| Badge **Analyst Rating** ringkas per baris (misal "Buy · 24 analis") | `Ticker.recommendations_summary` | ❌ Belum | Tabel dense — cukup 1 badge kecil, bukan panel penuh (itu ada di ide Analysis §4) |
| Kolom **Dividend Yield** | `Ticker.info` (`dividendYield`) atau `Ticker.dividends` (historis) | ❌ Belum | Relevan untuk watchlist saham dividen (banyak simbol IDX punya dividend yield tinggi) |
| Filter tipe aset di hasil pencarian (`Equity`/`ETF`/`Crypto`/`Index`/`Currency`) | `search_symbol()` (existing) sudah dapat field `type` dari `yf.Search`, **belum dipakai untuk filter UI** | 🟡 Sebagian | Murni perbaikan UI — `SymbolSearchResult.type` sudah ada di response, tinggal ditambah dropdown filter di `Sidebar`/pencarian watchlist |

---

## 4. Analysis (Overview & Detail) — Ide dari `yfinance`

Halaman Analysis (`/analysis/[symbol]`, sudah punya `ScoreGauge`, `RadarChart`,
`SupportResistancePanel`, existing) adalah tempat paling natural untuk data fundamental/riset
yang belum dipakai sama sekali oleh project:

| Ide | Sumber `yfinance` | Status Kode | Prioritas Usulan |
|---|---|---|---|
| **Panel Analyst Ratings & Price Target** — konsensus Buy/Hold/Sell, jumlah analis, target harga (low/mean/high) | `recommendations`, `recommendations_summary`, `analyst_price_targets`, `upgrades_downgrades` (riwayat perubahan rating) | ❌ Belum | Tinggi — melengkapi `ScoreGauge` (skor internal) dengan opini analis eksternal, jelas beda sumber (disclaimer perlu menegaskan ini pendapat pihak ketiga, bukan skor FinSight) |
| **Panel Fundamental Ringkas** — revenue, net income, total assets/liabilities dari 4 kuartal terakhir | `income_stmt`, `balance_sheet`, `cash_flow` (+ `quarterly_*`) | ❌ Belum | Sedang — berguna untuk saham (bukan crypto/index), perlu UI yang menyembunyikan panel ini otomatis untuk simbol non-equity |
| **Panel Ownership & Insider Activity** — kepemilikan institusi/insider, transaksi insider terbaru | `major_holders`, `institutional_holders`, `insider_transactions` | ❌ Belum | Sedang — data ini kerap kosong/tidak lengkap untuk saham IDX (batasan sumber data, sama seperti catatan Earnings Calendar di `PRD-S-002_Enhancement-system_EarningCalendar.md`) |
| **Panel Growth & Estimates** — proyeksi EPS/revenue analis kuartal mendatang | `earnings_estimate`, `revenue_estimate`, `growth_estimates`, `eps_trend`, `eps_revisions` | ❌ Belum | Rendah — nice-to-have, data proyeksi analis kompleks untuk ditampilkan ringkas |
| **Badge ESG/Sustainability Score** | `sustainability` | ❌ Belum | Rendah — cakupan data terbatas (mayoritas US large-cap), relevansi ke target pasar IDX perlu divalidasi dulu |
| **Tab Options Chain** — daftar strike price, open interest, implied volatility untuk simbol yang punya opsi | `options` (daftar tanggal expiry) + `option_chain(date)` (`.calls`/`.puts`) | ❌ Belum | Rendah — hanya relevan untuk saham US besar (opsi tidak umum di IDX), scope besar (perlu UI tabel opsi baru) |
| **Overlay Dividend & Stock Split** di chart (marker vertikal di tanggal ex-dividend/split) | `dividends`, `splits` (kedua Series sudah tersedia lewat objek `Ticker`, tinggal diekspos) | ❌ Belum | Sedang — pelengkap natural untuk chart existing, `lightweight-charts` mendukung marker (`setMarkers()`) |

---

## 5. Dashboard — Ide dari `yfinance` (Kelas Domain Baru)

Dashboard sudah lengkap sesuai `2026-09-06_DashboardPage_v1.0.md` (Market Overview, Sector
Heatmap, Movers, Sentiment Gauge, Forex, MA Cross Alerts, Earnings Calendar — semua sudah
terimplementasi). Ide baru di bawah memakai **kelas domain `yfinance` yang belum pernah disentuh**
sama sekali oleh project (`Sector`, `Industry`, `Market`, `EquityQuery`/`screen()`):

| Ide | Sumber `yfinance` | Status Kode | Catatan |
|---|---|---|---|
| **Sector data live** menggantikan/melengkapi mapping statis | `yf.Sector(key).overview`, `.top_companies`, `.research_reports` | ❌ Belum — saat ini `SectorHeatmap.tsx` pakai basket simbol **hardcode manual** (`sectorBaskets.ts`) | Berpotensi menyederhanakan maintenance (tidak perlu update manual daftar simbol per sektor), tapi `yf.Sector` fokus data US (GICS) — untuk tab Indonesia tetap perlu basket manual, jadi ini **pelengkap** untuk tab US, bukan pengganti total |
| **Market Status widget** (buka/tutup + jam bursa per exchange) | `yf.Market(region).status` | ❌ Belum | Status pasar saat ini hanya inferensi dari `market_state` per simbol individual (`fast_info`) — widget ini bisa jadi indikator global di `TickerBar.tsx` ("NYSE: Buka · IDX: Tutup"), lebih akurat dari inferensi per-simbol |
| **Movers via Yahoo Screener** sebagai alternatif movers panel | `yf.screen()` + `EquityQuery`/kategori bawaan (`day_gainers`, `most_actives`, dst.) | ❌ Belum — Movers panel existing (`MoversPanel.tsx`) **loop manual** tiap simbol di pool | Berpotensi lebih efisien (1 request screener vs N request loop per simbol) **untuk market US**; untuk IDX, cakupan screener Yahoo terhadap bursa Indonesia perlu diverifikasi dulu sebelum dianggap pengganti — kandidat kuat untuk riset lanjutan, bukan langsung ganti implementasi existing |

---

## 6. News — Ide dari `yfinance`

| Ide | Sumber `yfinance` | Status Kode | Catatan |
|---|---|---|---|
| Link **SEC Filings** terkait simbol (khusus saham US) | `Ticker.sec_filings` | ❌ Belum | Relevan hanya untuk tab US — perlu disembunyikan otomatis untuk simbol IDX/crypto yang tidak punya data ini |

---

## 7. Ide yang Sengaja Tidak Diprioritaskan (Dicatat, Bukan Ditolak)

| Ide | Sumber `yfinance` | Alasan Tidak Diprioritaskan |
|---|---|---|
| Streaming quote real-time | `yf.WebSocket`/`AsyncWebSocket` | Tetap non-goal eksplisit — arsitektur polling SWR yang sudah dipakai di seluruh project cukup untuk kebutuhan riset (bukan eksekusi order), mengubah ke WebSocket adalah perubahan arsitektur besar di luar scope dokumen ini |
| `funds_data`, `valuation`, `isin` | `Ticker.funds_data`, `.valuation`, `.isin` | Kegunaan untuk konteks produk (riset saham/crypto/index individual) belum jelas — dicatat sebagai referensi, bukan diusulkan aktif |

---

## 8. Ringkasan Prioritas

| Prioritas | Item |
|---|---|
| ⭐ Wajib (requirement eksplisit) | War Room (§1), Navbar Logo + Hamburger (§2) |
| Tinggi | Panel Analyst Ratings & Price Target (§4) |
| Sedang | Panel Fundamental Ringkas, Ownership & Insider Activity, Overlay Dividend/Split (§4); Market Status widget (§5) |
| Rendah | Growth & Estimates, ESG Badge, Options Chain (§4); Sector data live, Movers via Screener (§5, butuh riset lanjutan cakupan IDX) |
| Dicatat, bukan diprioritaskan | Streaming real-time, `funds_data`/`valuation`/`isin` (§7) |

---

## 9. Dokumen Terkait

- `Environment/2026-09-06_DashboardPage_v1.0.md` / `Environment/2026-09-07_DashboardPage_v1.1.md`
  — spesifikasi dashboard yang sudah diimplementasikan (basis "Status Kode Saat Ini" di dokumen ini)
- `PRD/Enhancement-System/PRD-S-002_Enhancement-system_EarningCalendar.md` — implementasi Earnings
  Calendar (referensi pola integrasi `yfinance.Ticker().calendar` yang sudah berhasil, jadi acuan
  gaya untuk ide-ide fundamental/ownership di §4)
- `Environment/2026-09-21_AddedFeatures_v1.0.md` — dev task Alerts/Portfolio/Settings (terpisah dari dokumen ini)
- `Documentation/Documentation-Program.md` §4.1, §4.3 — modul `market_data.py`/`technical.py` yang
  jadi basis reuse
