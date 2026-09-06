# Enhancement Design — Dashboard Page v1

> **Versi Dokumen:** 1.0 — disusun dari draft checklist pengguna, diverifikasi ulang terhadap kode
> `Development` saat ini (lihat §0 Catatan Verifikasi)
> **Terkait:** `Environment/Enhancement-Design-1-UXVisual.md` §3 (Design Language), §4.4 (Trading
> Monitor Dashboard)
> **Terkait teknis:** `Documentation/Documentation-Program.md` §4.1 (`market_data.py`), §4.3
> (`technical.py`), §7.3–7.4 (struktur backend/frontend)
> **Status:** 🔜 Diusulkan — sebagian kecil sudah terimplementasi (lihat §2), mayoritas belum
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Frontend Developer, Backend Developer, Desainer

---

## 0. Catatan Verifikasi terhadap Kode Saat Ini

Draft awal dokumen ini ditulis sebagai spesifikasi murni (belum ada kode). Sebelum difinalisasi
sebagai v1, setiap item di §2 **diverifikasi langsung ke kode di branch `Development`** — ternyata
sebagian fondasi sudah dibangun lewat commit implementasi Auth/JWT + Analysis API sebelumnya
(lihat `Environment/enhancement-system_JWTAuth.md`). Perubahan dari draft ke v1:

- Kolom **"Status Kode Saat Ini"** ditambahkan di §2 — membedakan item yang tinggal **diperluas**
  dari yang benar-benar **dibangun dari nol**, supaya urutan implementasi (§7) tidak
  mengerjakan ulang sesuatu yang sudah ada.
- Referensi dokumen dikoreksi ke path yang benar-benar ada di repo saat ini: `Documentation/`
  (bukan `PRD/`) untuk `Documentation-Business.md`/`Documentation-Program.md`, dan
  `Environment/Enhancement-Design-1-UXVisual.md` (bukan `Enhancement-Design-1-Visual-Business.md`).
- Wireframe (§3) dan tabel perubahan kode (§6) disesuaikan dengan nama file/komponen **yang
  benar-benar ada** di `frontend/app/(app)/dashboard/page.tsx` dan `frontend/components/dashboard/`
  saat ini, bukan nama generik dari draft.

---

## 1. Latar Belakang

Dashboard yang sudah berjalan (`frontend/app/(app)/dashboard/page.tsx`) menunjukkan dua masalah
utama, keduanya masih terbukti benar setelah verifikasi kode:

1. **Layout tidak full-width** — wrapper konten memakai `mx-auto max-w-7xl` (baris 38 file
   tersebut), menyisakan ruang kosong di kiri-kanan pada layar lebar. `AppShell.tsx` di sekitarnya
   sudah full-width (`flex-1`, tanpa `max-w-*`), jadi perbaikan **cukup di satu file** ini.
2. **Semua market dicampur jadi satu dashboard flat** — `TickerBar.tsx` saat ini hardcode 4 simbol
   tetap (`^GSPC, ^DJI, ^IXIC, BTC-USD`) tanpa pengelompokan, dan `MetricsStrip.tsx` hanya
   menampilkan metrik crypto (`Crypto Market Cap`, `BTC Dominance`) meskipun tab market lain (US,
   Indonesia) belum ada — struktur saat ini implisit "crypto-only" padahal seharusnya generik per
   market.

Dokumen ini adalah **spesifikasi perbaikan** untuk kedua masalah tersebut, sekaligus menambahkan
8 widget baru sesuai requirement. Prinsip utama tetap dipertahankan dari draft: **maksimalkan
reuse `yfinance` yang sudah dipakai**, dan sekarang juga **maksimalkan reuse endpoint/komponen
yang sudah dibangun** (`top-gainers`, `overview`, `summary`, `fear-greed`, analysis score/radar)
alih-alih membangun ulang dari nol.

### 1.1 Non-Goals

- Tidak mengubah logic indikator teknikal yang sudah ada (MA/EMA/RSI/MACD/Bollinger, termasuk
  `compute_analysis_score()`/`compute_radar_scores()`/`compute_support_resistance()` yang sudah
  dipakai di halaman Analysis) — widget baru di dokumen ini menambah fungsi **di sampingnya**,
  bukan menggantikan.
- Tidak mengimplementasikan data tick-by-tick/WebSocket real-time — kebutuhan saat ini masih
  terpenuhi oleh polling SWR (interval 30–60 detik, sudah berjalan di seluruh dashboard existing).
- Tidak mengganti sumber data utama dari `yfinance` — evaluasi API berbayar tetap di roadmap
  terpisah (`Documentation/Documentation-Program.md` §7.5).

---

## 2. Ringkasan Perubahan

| # | Item | Kategori | Butuh API/Sumber Baru? | Status Kode Saat Ini |
|---|---|---|---|---|
| 1 | Fix layout full-width | Struktural | Tidak | ❌ Belum — `max-w-7xl` masih ada di `dashboard/page.tsx` |
| 2 | Market grouping (US / Indonesia / Crypto) | Struktural | Tidak | ❌ Belum — tidak ada tab market sama sekali |
| 3 | Sentiment Gauge (formula kustom) | Widget baru | Tidak — dari `yfinance` | 🟡 Sebagian — pola skor 0–100 & helper (`_clamp`, `_score_to_label`) sudah ada di `technical.py` untuk analisis per-simbol; formula sentiment *market-level* di dokumen ini masih baru |
| 4 | Sector Performance (heatmap) | Widget baru | Tidak — dari `yfinance` | ❌ Belum ada sama sekali |
| 5 | Panel Top Gainers / Losers / Volume Movers (3 tab) | Widget baru | Tidak — dari `yfinance` | 🟡 Sebagian — **Top Gainers sudah jalan** (`TopGainersTable.tsx` + `POST /api/market/top-gainers`); Losers & Volume Movers belum ada |
| 6 | Currency/Forex strip | Widget baru | Tidak — `yfinance` (`USDIDR=X`, dst.) | ❌ Belum ada widget-nya, tapi endpoint yang dipakai (`POST /api/market/watchlist`) **sudah ada dan reusable langsung** |
| 7 | Golden/Death Cross alert list | Widget baru | Tidak — dari indikator existing | ❌ Belum ada |
| 8 | Index utama per tab market | Struktural | Tidak — dari `yfinance` | ❌ Belum ada (menyatu dengan item #2) |
| 9 | Status strip (ticker bar berjalan) | Struktural | Tidak | 🟡 Sebagian — `TickerBar.tsx` **sudah ada** dan reuse `GET /api/market/overview`, tapi: (a) simbol hardcode, belum ikut tab market aktif; (b) `overflow-x-auto` statis, **belum ada animasi scroll** kanan→kiri |
| 10 | Earnings Calendar | Widget baru | Tidak — `yfinance.Ticker().calendar` (belum diekspos) | ❌ Belum ada |
| 11 | Fix sorting Recent News (minor) | Bug fix | Tidak — perbaikan di service existing | ❌ Belum diperbaiki — `get_news_for_symbol()` di `backend/app/services/news_data.py` masih memotong `[:max_items]` tanpa `sorted()` |

**Catatan penting (tetap berlaku dari draft):** Seluruh 11 item di atas **tidak menambah
dependency Python baru** dan **tidak menambah API key/layanan eksternal baru** — murni
perluasan/perbaikan pemakaian `yfinance` yang sudah jadi dependency inti project.

---

## 3. Susunan Layout Dashboard (ASCII Wireframe)

Wireframe diperbarui memakai nama komponen **yang benar-benar ada** di kode saat ini (bukan nama
generik draft) supaya langsung bisa dipetakan ke file.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TickerBar.tsx — diperluas: ikut tab market aktif + animasi scroll kanan→kiri  │
│ (§4.5) — reuse GET /api/market/overview, simbol dari MARKET_CONFIG (§4.3)     │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────────────────────────────┐
│          │  [ US Market ] [ Indonesia ] [ Crypto ]   ← MarketTabs.tsx (baru,│
│          │                                              §4.2)               │
│          ├─────────────────────────────────────────────────────────────────┤
│          │  Dashboard                                                        │
│ AppSide- │  Ringkasan pasar sebelum masuk detail simbol.                     │
│ barNav   │                                                                    │
│ (existing│  ┌─────────────┬─────────────┬─────────────┬──────────────────┐  │
│ , tidak  │  │ INDEX UTAMA │  ForexStrip │  Sentiment- │  MetricsStrip.tsx │  │
│ berubah) │  │ (baru §4.4) │  .tsx (baru)│  Gauge.tsx  │  (existing,       │  │
│          │  │             │  (§5.4)     │  (baru §5.1)│   diperluas §5.1) │  │
│          │  └─────────────┴─────────────┴─────────────┴──────────────────┘  │
│          │                                                                    │
│          │  ┌───────────────────────────────┬──────────────────────────────┐ │
│          │  │ MarketOverviewChart.tsx        │ SectorHeatmap.tsx (baru,     │ │
│          │  │ (existing, simbol ikut index   │ §5.2)                        │ │
│          │  │  utama tab aktif)               │                              │ │
│          │  └───────────────────────────────┴──────────────────────────────┘ │
│          │                                                                    │
│          │  ┌───────────────────────────────┬──────────────────────────────┐ │
│          │  │ MoversPanel.tsx (baru, §5.3)    │ Recent News (existing di    │ │
│          │  │ [Gainers|Losers|Volume] ← tab   │ dashboard/page.tsx, perlu   │ │
│          │  │ Tab Gainers = reuse             │ fix sorting §4.6)           │ │
│          │  │ TopGainersTable.tsx existing    │                              │ │
│          │  └───────────────────────────────┴──────────────────────────────┘ │
│          │                                                                    │
│          │  ┌───────────────────────────────┬──────────────────────────────┐ │
│          │  │ MACrossAlerts.tsx (baru, §5.5)  │ EarningsCalendar.tsx (baru, │ │
│          │  │                                  │ §5.6)                        │ │
│          │  └───────────────────────────────┴──────────────────────────────┘ │
│          │                                                                    │
│          │  ─────────────────────────────────────────────────────────────    │
│          │  Your Watchlist Snapshot (existing di dashboard/page.tsx, tidak   │
│          │  difilter tab market — lintas kategori sesuai desain awal)        │
└──────────┴─────────────────────────────────────────────────────────────────┘
```

**Catatan pembacaan diagram (adjustment vs draft):**
- `CryptoSnapshotTable.tsx` (existing) **tidak dihilangkan** — begitu tab `Crypto` aktif, tabel ini
  cukup natural jadi bagian dari grid movers/watchlist untuk tab tersebut; untuk tab US/Indonesia
  ia disembunyikan (tidak relevan menampilkan snapshot crypto di tab saham).
- `MetricsStrip.tsx` (existing, saat ini isinya crypto-only: Market Cap/24h Volume/BTC
  Dominance/Fear&Greed) **diperluas jadi kolom ke-4** grid metrik atas, bukan dihapus — untuk tab
  US/Indonesia, tampilkan metrik yang relevan (mis. index performance harian) alih-alih
  metrik crypto yang tidak relevan.
- Grid memakai `grid-cols-12` untuk memenuhi §4.1 (full-width, ruang tambahan terisi informasi).

---

## 4. Perbaikan Struktural

### 4.1 Layout Full-Width

**Masalah (terverifikasi):** `frontend/app/(app)/dashboard/page.tsx` baris 38:
```tsx
<div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
```
`AppShell.tsx` di sekitarnya sudah benar (`flex-1`, tanpa constraint) — masalah murni di wrapper
halaman ini.

**Perbaikan:**
- Ganti jadi `<div className="w-full space-y-5 px-6 py-5">` — hapus `mx-auto max-w-7xl`.
- Grid dashboard (`grid lg:grid-cols-3`, `grid lg:grid-cols-2` yang sudah ada di file yang sama)
  dinaikkan resolusinya ke `grid-cols-12` dengan `col-span` eksplisit per card, supaya ruang
  tambahan terisi **informasi** (kolom tabel lebih banyak, chart lebih detail), bukan sekadar
  dilebarkan kosong.
- Constraint lebar (`max-width`) boleh tetap dipakai di level **komponen individual** (misal
  paragraf disclaimer di baris akhir file yang sama) — bukan di level wrapper halaman.

### 4.2 Market Grouping (US / Indonesia / Crypto)

**Komponen baru:** `frontend/components/dashboard/MarketTabs.tsx` — tab switcher di atas seluruh
grid widget, di bawah `TickerBar.tsx`:

```
[ US Market ]  [ Indonesia ]  [ Crypto ]
```

- State `selectedMarket: 'us' | 'indonesia' | 'crypto'` (disimpan di `dashboard/page.tsx` via
  `useState`, mengikuti pola `selectedSymbol` di `watchlist-context.tsx` existing) mengontrol
  **seluruh** konten panel di bawahnya: index utama (§4.4), `TickerBar` (§4.5), `SectorHeatmap`,
  `MoversPanel`, dan `ForexStrip` yang relevan.
- `WatchlistProvider` (existing, `lib/watchlist-context.tsx`) **tidak diubah** — Your Watchlist
  Snapshot tetap tampil lintas kategori, tidak difilter tab market, sesuai desain awal.

### 4.3 Konfigurasi per Market

Satu objek konfigurasi terpusat baru di frontend, `frontend/lib/marketConfig.ts`:

```typescript
export const MARKET_CONFIG = {
  us: {
    label: 'US Market',
    mainIndex: { symbol: '^GSPC', label: 'S&P 500' },
    tickerSymbols: ['^GSPC', '^DJI', '^IXIC'],
    forexPairs: [], // tidak relevan untuk tab US
  },
  indonesia: {
    label: 'Indonesia',
    mainIndex: { symbol: '^JKSE', label: 'IHSG (Composite)' },
    tickerSymbols: ['^JKSE'],
    forexPairs: ['USDIDR=X'],
  },
  crypto: {
    label: 'Crypto',
    mainIndex: { symbol: 'BTC-USD', label: 'BTC/USD' },
    tickerSymbols: ['BTC-USD', 'ETH-USD'],
    forexPairs: [],
  },
} as const;
```

> Simbol index (`^GSPC`, `^JKSE`, dst.) perlu diverifikasi jalan normal di versi `yfinance` yang
> dipakai project (`>=0.2.54`, lihat `backend/requirements.txt`) saat implementasi — referensi
> awal, bukan final teruji.

`TickerBar.tsx` yang sudah ada saat ini punya `LABELS` hardcode (`^GSPC → 'S&P 500'`, dst.) — objek
ini **dipindah** jadi bagian dari `MARKET_CONFIG` supaya satu sumber kebenaran, tidak dobel dengan
label di tempat lain.

### 4.4 Index Utama per Tab

Setiap tab market menampilkan **satu index acuan utama** secara menonjol (kartu tersendiri di grid
metrik atas, bukan cuma di ticker bar):

| Tab | Index Utama | Simbol (referensi awal) |
|---|---|---|
| US Market | S&P 500 | `^GSPC` |
| Indonesia | IHSG (IDX Composite) | `^JKSE` |
| Crypto | BTC/USD | `BTC-USD` |

Index ini dipakai sebagai simbol untuk `MarketOverviewChart.tsx` (existing,
`frontend/components/dashboard/MarketOverviewChart.tsx`) — perlu prop baru `symbol` yang berganti
otomatis mengikuti `MARKET_CONFIG[selectedMarket].mainIndex.symbol`, menggantikan simbol tetap yang
mungkin di-hardcode saat ini.

### 4.5 Status Strip (Ticker Bar Berjalan) — Perluasan `TickerBar.tsx`

**Kondisi saat ini:** `TickerBar.tsx` sudah reuse `GET /api/market/overview` dan sudah tampil di
`AppShell.tsx` (full-width, benar). Dua hal yang **belum** sesuai requirement:

1. **Belum market-aware** — daftar simbol hardcode di `OVERVIEW_SYMBOLS` (backend,
   `app/api/market.py`) dan `LABELS` (frontend). Perlu:
   - Ubah `GET /api/market/overview` jadi menerima query param opsional
     `?symbols=^JKSE,USDIDR=X` (default tetap `OVERVIEW_SYMBOLS` lama jika kosong, supaya tidak
     breaking untuk consumer lain).
   - `TickerBar.tsx` mengirim `MARKET_CONFIG[selectedMarket].tickerSymbols` sebagai param tersebut.
2. **Belum ada animasi scroll kanan→kiri** — saat ini murni `overflow-x-auto` (scroll manual oleh
   user), bukan ticker berjalan otomatis. Perlu:
   - CSS `@keyframes ticker-scroll` dengan `transform: translateX(-50%)` pada wrapper yang berisi
     **konten digandakan 2×** (pola umum infinite ticker: render list dua kali berdampingan,
     animasikan geser sepanjang setengah lebar total, lalu reset instan tanpa terlihat "loncat").
   - Durasi disesuaikan panjang konten (`duration: Nsimbol * detik_per_simbol`), didefinisikan di
     `globals.css` (yang sudah punya beberapa `@keyframes` custom seperti `animate-pulse-soft`
     yang dipakai di file ini sendiri).
   - Pakai CSS animation (bukan `setInterval`/`requestAnimationFrame` JS) untuk performa lebih
     ringan pada animasi kontinu — sesuai catatan performa di draft awal.
3. Warna angka persen **tidak berubah** — tetap `positive`/`negative` seperti implementasi
   `TickerBar.tsx` saat ini.

### 4.6 Fix Sorting Recent News (Minor)

**Masalah (terverifikasi):** `backend/app/services/news_data.py` — fungsi `get_news_for_symbol()`
memotong `raw_news[:max_items]` langsung dari hasil `ticker.news`/RSS **tanpa** memanggil
`sorted()` berdasar `published_at` di kode manapun dalam file ini (dikonfirmasi lewat pencarian
`sorted`/`published_at` di file — tidak ada pemanggilan `sorted()`).

**Perbaikan:** Tambah satu langkah `sorted()` berdasar `published_at` (descending, terbaru dulu)
sebelum data dipotong ke `max_items`. Item dengan `published_at = None` ditempatkan di akhir:

```python
items_sorted = sorted(
    items,
    key=lambda item: item.published_at or datetime.min.replace(tzinfo=timezone.utc),
    reverse=True,
)
return items_sorted[:max_items]
```

**Cakupan:** Murni di layer service, tidak menyentuh `NewsCard.tsx`/`NewsPanel.tsx` (frontend)
atau skema respons API.

---

## 5. Widget Baru

### 5.1 Sentiment Gauge (Formula Kustom)

**Tujuan:** Skor sentimen pasar 0–100 **per index utama tab aktif** (bukan per-simbol watchlist,
dan bukan pengganti `compute_analysis_score()` yang sudah ada untuk halaman Analysis simbol
individual — keduanya melayani konteks berbeda: satu untuk "kondisi market hari ini", satu untuk
"kondisi satu saham").

> ⚠️ **Penamaan:** Tidak boleh dinamakan "Fear & Greed Index" tanpa embel-embel (nama tersebut
> terasosiasi metodologi berlisensi CNN). Pakai **"Market Sentiment Score"** atau
> **"Sentiment Gauge"**, dengan caption menjelaskan ini kalkulasi internal.

**Formula (4 komponen, rata-rata sederhana):**

| Komponen | Cara Hitung | Sumber |
|---|---|---|
| RSI Score | `RSI14` (skala 0–100, langsung pakai) | `technical.py` → `rsi()` (existing) |
| Trend Score | `100` jika `MA20 > MA50`, `0` jika sebaliknya | `technical.py` → `moving_average()` (existing) |
| Volatility Score | `100 - normalisasi(rolling_std_20hari)` | Fungsi baru — **ikuti pola `_clamp()`/`_safe_float()` yang sudah ada** di `technical.py` untuk konsistensi gaya kode |
| Range Score | `(harga_sekarang - year_low) / (year_high - year_low) × 100` | `yfinance.Ticker().fast_info` — `year_high`/`year_low` **belum** ada di `QuoteSnapshot` (`backend/app/services/market_data.py`), perlu ditambahkan sebagai field opsional baru (pola sama seperti `market_cap` yang sudah ditambahkan sebelumnya) |

```
Sentiment Score = rata-rata(RSI Score, Trend Score, Volatility Score, Range Score)
```

**Klasifikasi skala:**

| Rentang | Label |
|---|---|
| 0–25 | Extreme Fear |
| 25–45 | Fear |
| 45–55 | Neutral |
| 55–75 | Greed |
| 75–100 | Extreme Greed |

**Perubahan kode yang dibutuhkan:**
- Fungsi baru `volatility_score()`, `range_score()`, `sentiment_score()` di `technical.py` — taruh
  berdampingan dengan `compute_analysis_score()`/`compute_radar_scores()` yang sudah ada, memakai
  helper (`_clamp`, `_safe_float`) yang sama, supaya satu gaya kode konsisten.
- Tambah `year_high`, `year_low` (float | None) ke `QuoteSnapshot` di `market_data.py`.
- Endpoint baru `GET /api/market/sentiment/{symbol}` di `app/api/market.py`, dipanggil dengan
  `MARKET_CONFIG[selectedMarket].mainIndex.symbol` dari frontend.
- Komponen `SentimentGauge.tsx` baru — **bisa reuse visual pattern dari `ScoreGauge.tsx`**
  (`frontend/components/analysis/ScoreGauge.tsx`, sudah ada untuk halaman Analysis) alih-alih
  membangun radial gauge SVG dari nol.

### 5.2 Sector Performance (Heatmap)

**Tujuan:** Perbandingan performa antar sektor dalam satu grid warna.

**Cara kerja (tidak berubah dari draft):**
- Mapping simbol representatif per sektor (perlu didefinisikan — lihat §8, belum diputuskan).
- Untuk tiap sektor, hitung rata-rata `change_pct` dari basket simbolnya via
  `get_multiple_snapshots()` (existing, sudah dipakai di banyak endpoint lain seperti
  `/top-gainers` dan `/summary`).
- Render grid kotak berwarna, intensitas mengikuti besaran `change_pct`, basis gradasi dari token
  `positive`/`negative` yang sudah ada di `tailwind.config.js`.

**Perubahan kode yang dibutuhkan:**
- Konfigurasi mapping sektor→simbol (statis, disarankan di backend supaya bisa dipakai ulang kalau
  nanti ada consumer selain frontend web).
- Endpoint baru `GET /api/market/sectors/{market}`.
- Komponen frontend baru `SectorHeatmap.tsx`.

> **Catatan cakupan (tidak berubah):** Mapping sektor lengkap & representatif adalah kerja
> tersendiri — dokumen ini mendefinisikan mekanismenya, bukan basket simbol final (lihat §8).

### 5.3 Panel Top Gainers / Top Losers / Volume Movers (3 Tab dalam 1 Panel)

**Adjustment penting vs draft:** Top Gainers **sudah berjalan** sebagai panel berdiri sendiri
(`TopGainersTable.tsx` + `POST /api/market/top-gainers`, sort `change_pct` descending). Alih-alih
membuat Losers sebagai endpoint terpisah (duplikasi logic), **satu endpoint diperluas** dengan
parameter arah:

```
POST /api/market/top-gainers?limit=5&order=desc   ← Gainers (default, perilaku existing)
POST /api/market/top-gainers?limit=5&order=asc    ← Losers (kebalikan sort, endpoint sama)
```

Ini menghindari dua fungsi backend yang isinya nyaris identik hanya beda arah `sorted(..., reverse=...)`.

**Volume Movers — fitur baru, sesuai requirement:**
1. Fungsi baru `volume_ratio()` di `technical.py`:
   ```python
   def volume_ratio(df: pd.DataFrame, window: int = 20) -> float | None:
       """Rasio volume hari terakhir vs rata-rata `window` hari sebelumnya."""
       if df is None or df.empty or "Volume" not in df.columns or len(df) < 2:
           return None
       volume = df["Volume"].astype(float)
       latest = float(volume.iloc[-1])
       avg = float(volume.iloc[-(window + 1):-1].mean()) if len(volume) > window else float(volume.iloc[:-1].mean())
       if not avg or avg != avg:  # None atau NaN
           return None
       return latest / avg
   ```
   Rasio > 1 berarti volume hari ini di atas rata-rata `window` hari sebelumnya (mengecualikan
   hari ini sendiri dari perhitungan rata-rata, supaya tidak bias).
2. Endpoint baru `POST /api/market/volume-movers`:
   ```python
   @router.post("/volume-movers", response_model=list[VolumeMoverResponse])
   def get_volume_movers(payload: WatchlistRequest, limit: int = Query(10, ge=1, le=50)):
       """Loop simbol watchlist/market aktif, hitung volume_ratio via get_history(), sort descending."""
       results = []
       for sym in [s.upper() for s in payload.symbols]:
           df = get_history(sym, period="3mo", interval="1d")  # cukup untuk window 20 hari
           ratio = volume_ratio(df)
           if ratio is not None:
               results.append({"symbol": sym, "volume_ratio": ratio})
       results.sort(key=lambda r: r["volume_ratio"], reverse=True)
       return results[:limit]
   ```
   Sesuai requirement: **loop watchlist/market aktif** yang dikirim frontend, hitung rasio tiap
   simbol, **urutkan berdasar rasio tertinggi**.

**Komponen:** `MoversPanel.tsx` baru dengan 3 tab — tab Gainers/Losers memanggil endpoint yang
sama (beda `order`), tab Volume Movers memanggil endpoint baru di atas.

### 5.4 Currency/Forex Strip

**Tujuan:** Kurs mata uang relevan per tab market — terutama USD/IDR untuk tab Indonesia.

**Sumber data:** `yfinance` mendukung pair forex format `XXXYYY=X`:

| Pair | Ticker `yfinance` | Relevan untuk Tab |
|---|---|---|
| USD/IDR | `USDIDR=X` | Indonesia |
| EUR/USD | `EURUSD=X` | US (opsional) |
| USD/JPY | `USDJPY=X` | US (opsional) |

**Perubahan kode yang dibutuhkan:** **Tidak ada endpoint baru** — `ForexStrip.tsx` (komponen baru,
tampilan saja) memanggil `api.getWatchlistQuotes(MARKET_CONFIG[selectedMarket].forexPairs)`, fungsi
yang **sudah ada** di `frontend/lib/api.ts` (`getWatchlistQuotes`), memanggil
`POST /api/market/watchlist` yang **sudah ada** di backend. Murni komposisi ulang, nol perubahan
backend.

### 5.5 Golden/Death Cross Alert List

**Tujuan:** Daftar simbol (watchlist/market aktif) yang baru mengalami persilangan MA20/MA50.

**Definisi:**
- **Golden Cross:** `MA20` melintas ke atas `MA50` (sinyal bullish).
- **Death Cross:** `MA20` melintas ke bawah `MA50` (sinyal bearish).

**Deteksi** (dari data `add_all_indicators()`, existing — sudah termasuk `MA20`/`MA50`/`MA100`/
`MA200` per commit sebelumnya):
```
Golden Cross jika: MA20[hari ini] > MA50[hari ini] DAN MA20[kemarin] <= MA50[kemarin]
Death Cross  jika: MA20[hari ini] < MA50[hari ini] DAN MA20[kemarin] >= MA50[kemarin]
```

**Perubahan kode yang dibutuhkan:**
- Fungsi baru `detect_ma_cross(df_with_indicators)` di `technical.py`, return
  `"golden" | "death" | None`.
- Endpoint baru `POST /api/market/ma-cross-alerts`, loop simbol, panggil `get_history()` +
  `add_all_indicators()` (keduanya existing) + `detect_ma_cross()`, kembalikan hanya yang match.

> ⚠️ **Catatan kepatuhan (tidak berubah dari draft):** Widget ini menampilkan **fakta teknikal**
> (persilangan MA terjadi), bukan rekomendasi beli/jual — disclaimer sama seperti widget sinyal
> lain (lihat `Documentation/Documentation-Business.md` §5).

### 5.6 Earnings Calendar

**Tujuan:** Menyoroti simbol watchlist yang punya jadwal rilis laporan keuangan minggu berjalan.

**Sumber data:** `yfinance.Ticker().calendar` — **sudah tersedia** di library `yfinance` yang
sudah jadi dependency, **belum diekspos** di `market_data.py` mana pun (dikonfirmasi tidak ada
pemanggilan `.calendar` di seluruh `backend/app/services/`).

**Perubahan kode yang dibutuhkan:**
```python
# backend/app/services/market_data.py — fungsi baru
def get_earnings_calendar(symbol: str) -> dict | None:
    try:
        ticker = yf.Ticker(symbol)
        cal = ticker.calendar
        if not cal:
            return None
        # Struktur `calendar` yfinance bisa dict atau DataFrame tergantung versi —
        # normalisasi ke dict sederhana {"earnings_date": ..., "symbol": symbol}
        ...
    except Exception:
        return None
```
- Endpoint baru `POST /api/market/earnings-calendar`, loop watchlist, filter hanya yang punya
  tanggal earnings dalam 7 hari ke depan.

> **Catatan keandalan data (tidak berubah dari draft):** Field `calendar` untuk sebagian simbol
> (terutama non-US, termasuk IDX) kerap kosong/tidak lengkap — ini keterbatasan sumber data.
> Widget wajib menangani "data tidak tersedia" secara eksplisit, bukan kosong tanpa keterangan.

---

## 6. Ringkasan Perubahan Kode

### 6.1 Backend

| File | Perubahan |
|---|---|
| `backend/app/services/market_data.py` | Tambah `year_high`/`year_low` ke `QuoteSnapshot`; fungsi baru `get_earnings_calendar()` |
| `backend/app/services/news_data.py` | **Fix minor** (§4.6): tambah `sorted()` berdasar `published_at` |
| `backend/app/indicators/technical.py` | Fungsi baru: `volatility_score()`, `range_score()`, `sentiment_score()`, `volume_ratio()`, `detect_ma_cross()` — ditaruh berdampingan dengan `compute_analysis_score()`/`compute_radar_scores()` yang sudah ada |
| `backend/app/api/market.py` | Extend `GET /overview` dengan query param `symbols` opsional; extend `POST /top-gainers` dengan param `order`; endpoint baru: `/sentiment/{symbol}`, `/sectors/{market}`, `/volume-movers`, `/ma-cross-alerts`, `/earnings-calendar` |
| `backend/app/api/schemas.py` | Response model baru: `VolumeMoverResponse`, `MACrossAlertResponse`, `EarningsCalendarResponse`, `SentimentScoreResponse`, `SectorPerformanceResponse` |

### 6.2 Frontend

| File/Komponen | Perubahan |
|---|---|
| `frontend/app/(app)/dashboard/page.tsx` | Hapus `mx-auto max-w-7xl` → `w-full` (§4.1); tambah state `selectedMarket` + render `MarketTabs` |
| `frontend/components/dashboard/MarketTabs.tsx` (baru) | Tab switcher US/Indonesia/Crypto (§4.2) |
| `frontend/lib/marketConfig.ts` (baru) | Konfigurasi index/ticker/forex per market (§4.3) |
| `frontend/components/app/TickerBar.tsx` | **Diperluas** (bukan baru): terima param symbols dinamis + animasi CSS scroll (§4.5) |
| `frontend/components/dashboard/MarketOverviewChart.tsx` | **Diperluas**: terima prop `symbol` dinamis mengikuti index utama tab aktif (§4.4) |
| `frontend/components/dashboard/MetricsStrip.tsx` | **Diperluas**: metrik relevan per tab, bukan crypto-only |
| `frontend/components/dashboard/SentimentGauge.tsx` (baru) | Widget gauge (§5.1), reuse pola visual `ScoreGauge.tsx` existing |
| `frontend/components/dashboard/SectorHeatmap.tsx` (baru) | Widget heatmap (§5.2) |
| `frontend/components/dashboard/MoversPanel.tsx` (baru) | Panel 3-tab, tab Gainers reuse `TopGainersTable.tsx` existing (§5.3) |
| `frontend/components/dashboard/ForexStrip.tsx` (baru) | Widget kurs, reuse `api.getWatchlistQuotes()` existing (§5.4) |
| `frontend/components/dashboard/MACrossAlerts.tsx` (baru) | List Golden/Death Cross (§5.5) |
| `frontend/components/dashboard/EarningsCalendar.tsx` (baru) | Widget kalender earnings (§5.6) |
| `frontend/lib/api.ts` | Tambah fungsi client untuk 5 endpoint baru di §6.1 |
| `frontend/types/market.ts` | Tambah interface sepadan untuk response baru |

---

## 7. Urutan Implementasi yang Disarankan

Disusun ulang dari draft dengan mempertimbangkan apa yang **sudah** ada di kode (§2):

1. **Fix layout full-width** (§4.1) — satu baris perubahan di `dashboard/page.tsx`, dampak visual
   langsung, tidak bergantung apa pun.
2. **Fix sorting Recent News** (§4.6) — quick-win, satu langkah `sorted()`, independen.
3. **Market grouping + konfigurasi + index utama** (§4.2–4.4) — fondasi struktural untuk semua
   widget "per market" berikutnya. `MarketOverviewChart.tsx` tinggal diberi prop dinamis, bukan
   dibangun ulang.
4. **Currency/Forex strip** (§5.4) — paling ringan, murni reuse `getWatchlistQuotes()` existing.
5. **Panel Top Gainers/Losers/Volume Movers** (§5.3) — Gainers tinggal dipindah ke tab (sudah
   jalan), Losers cukup extend param `order` di endpoint yang sama, Volume Movers butuh 1 fungsi +
   1 endpoint baru.
6. **Perluas `TickerBar.tsx`** (§4.5) — market-aware + animasi scroll, butuh `MARKET_CONFIG` dari
   langkah 3 sudah siap.
7. **Golden/Death Cross alerts** (§5.5) — reuse indikator existing sepenuhnya (`add_all_indicators`
   sudah punya MA20/MA50).
8. **Sentiment Gauge** (§5.1) — butuh field baru (`year_high`/`year_low`) + fungsi baru, tapi bisa
   reuse `ScoreGauge.tsx` untuk visual, jadi effort frontend lebih ringan dari draft awal.
9. **Sector Performance heatmap** (§5.2) — butuh keputusan tambahan (mapping sektor→simbol, §8)
   sebelum implementasi — kerjakan setelah widget lain lebih dulu.
10. **Earnings Calendar** (§5.6) — independen, risiko data tidak lengkap tertinggi, cocok
    dikerjakan terakhir sambil menguji penanganan kasus kosong.

---

## 8. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

*(Tidak berubah dari draft — masih terbuka.)*

- [ ] Basket simbol representatif per sektor (§5.2) — perlu didefinisikan lengkap untuk US dan
      Indonesia sebelum Sector Heatmap bisa diimplementasikan.
- [ ] Bobot komponen Sentiment Gauge (§5.1) — dokumen ini pakai rata-rata sederhana (bobot sama
      rata); perlu diputuskan apakah beberapa komponen sebaiknya lebih dominan.
- [ ] Simbol pasti untuk index utama (§4.4) — `^GSPC`, `^JKSE`, dst. perlu diverifikasi berfungsi
      normal di `yfinance` versi yang dipakai project sebelum dijadikan default.
- [ ] Ambang batas "signifikan" untuk Volume Movers (§5.3) — apakah rasio > 1.5x, > 2x, atau nilai
      lain yang dianggap layak masuk daftar movers.

---

## 9. Dokumen Terkait

- `Environment/Enhancement-Design-1-UXVisual.md` — design token & inventaris 9 layar (dokumen induk)
- `Environment/enhancement-design_OnboardingLoginPage.md` — spesifikasi layar Onboarding/Landing/
  Login (FinSight)
- `Environment/enhancement-system_JWTAuth.md` — status implementasi Auth JWT + Rate Limiting (basis
  commit yang sudah menambahkan Analysis API & route groups yang direferensikan di dokumen ini)
- `Documentation/Documentation-Program.md` §4, §7 — arsitektur backend/frontend existing yang
  jadi basis reuse
- `Documentation/Documentation-Business.md` §5 — kebutuhan disclaimer & kepatuhan (berlaku untuk
  semua widget sinyal/rekomendasi di dokumen ini)
