# Documentation - Program
## AI Trading Dashboard — Dokumentasi Teknis & Flow Proses

> **Versi Dokumen:** 2.1
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Developer, engineer yang melanjutkan/memelihara kode ini, AI agent
> **Panduan ringkas Tahap 2:** lihat `Documenatation/docu.md` dan `ai-trading-dashboard/README-Tahap2.md`

---

## 1. Ringkasan Arsitektur

**Tahap aktif: Tahap 2** — frontend Next.js + backend FastAPI (lihat §7).  
Tahap 1 (Streamlit di `app/`) tetap ada sebagai referensi/fallback.

Aplikasi memakai arsitektur **layered** (berlapis), supaya setiap lapisan punya tanggung jawab jelas dan bisa diganti/diupgrade secara independen.

```
┌─────────────────────────────────────────────┐
│  app/main.py           (Entry Point)          │
└───────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  app/ui/*            (Presentation Layer)        │
│  - sidebar_view.py                                │
│  - watchlist_view.py                              │
│  - chart_view.py                                  │
│  - news_view.py                                   │
└───────┬─────────────────────────┬─────────────────┘
        │                         │
┌───────▼──────────────┐  ┌───────▼──────────────────┐
│ app/indicators/        │  │ app/services/              │
│ technical.py            │  │ - market_data.py            │
│ (Perhitungan matematis) │  │ - news_data.py               │
└──────────────────────┘  └───────┬───────────────────────┘
                                    │
                            ┌───────▼────────┐
                            │ Yahoo Finance    │
                            │ (via yfinance)   │
                            │ + Google News RSS │
                            │ (fallback berita)  │
                            └────────────────┘

┌─────────────────────────────────────────┐
│ app/config/settings.py  (Configuration)   │
│ Dibaca oleh semua layer di atas            │
└─────────────────────────────────────────┘
```

**Prinsip kunci:** `app/ui/` (lapisan tampilan) **tidak pernah** memanggil `yfinance` secara langsung — selalu lewat `app/services/`. Ini yang membuat migrasi sumber data atau migrasi ke backend API terpisah (Tahap 2) tidak memerlukan penulisan ulang UI.

---

## 2. Struktur Direktori Lengkap

```
ai-trading-dashboard/
├── app/                            # Tahap 1: Dashboard Streamlit (tetap ada, referensi/fallback)
│   ├── main.py                    # Entry point Streamlit
│   ├── config/settings.py         # Konfigurasi terpusat (baca .env)
│   ├── services/                  # market_data.py, news_data.py (Yahoo Finance)
│   ├── indicators/technical.py    # Perhitungan MA/EMA/RSI/MACD/Bollinger
│   ├── ui/                        # sidebar_view.py, watchlist_view.py, chart_view.py, news_view.py
│   ├── core/                      # (placeholder lama, tidak lagi dipakai)
│   └── models/                    # (placeholder lama, tidak lagi dipakai)
│
├── backend/                        # Tahap 2: REST API (FastAPI) — lihat §7
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                # Entry point FastAPI, setup CORS
│       ├── api/                   # market.py, chart.py, news.py, schemas.py
│       ├── services/              # market_data.py, news_data.py (versi backend, tanpa Streamlit)
│       ├── indicators/technical.py  # Identik dengan versi Tahap 1
│       ├── core/cache.py          # TTL cache in-memory (pengganti st.cache_data)
│       ├── config/settings.py
│       └── models/                # (disiapkan untuk ORM Prisma, lihat §8)
│
├── frontend/                       # Tahap 2: Web UI (Next.js + Tailwind) — lihat §7
│   ├── package.json
│   ├── tailwind.config.js         # Design tokens (dark mode, warna brief)
│   ├── .env.example
│   └── (app/, components/, lib/, types/ — detail di §7.4)
│
├── data/
│   ├── cache/                     # (disiapkan, belum dipakai aktif)
│   └── logs/                      # (disiapkan, belum dipakai aktif)
├── scripts/                       # (kosong, disiapkan untuk automation scripts)
├── docs/                          # (kosong, disiapkan untuk dokumentasi tambahan)
├── README.md                      # README utama (Tahap 2 recommended)
├── README-Tahap2.md               # README Tahap 2 (cara jalankan backend + frontend)
│
# Dokumen di luar folder app (workspace root):
# ├── Documenatation/docu.md       # Panduan Enhancement Tahap 2
# └── PRD/
#     ├── PRD.md
#     ├── Documentation-Business.md
#     └── Documentation-Program.md # (dokumen ini)
```

---

## 3. Konfigurasi (`app/config/settings.py`)

Semua nilai konfigurasi dibaca dari environment variable (file `.env`) lewat kelas `Settings`. Modul lain **wajib** ambil config dari sini, bukan `os.environ` langsung — supaya audit konfigurasi terpusat.

| Variabel | Default | Fungsi | Tahap |
|---|---|---|---|
| `APP_ENV` | `local` | Penanda environment | 1 |
| `DEFAULT_WATCHLIST` | `BBCA.JK,BBRI.JK,TLKM.JK,AAPL,MSFT,BTC-USD` | Watchlist awal saat pertama buka | 1 |
| `CACHE_TTL_SECONDS` | `60` | Lama cache data harga (detik) sebelum fetch ulang | 1 |
| `NEWS_MAX_ITEMS` | `8` | Jumlah maksimal berita ditampilkan per simbol | 1 |
| `DATABASE_URL` | — | Koneksi database (belum dipakai) | 2 |
| `JWT_SECRET_KEY` | — | Kunci rahasia JWT (wajib di `.env` lokal) | 2 |
| `JWT_EXPIRE_MINUTES` | `1440` | Masa berlaku token login (menit) | 2 |
| `MIDTRANS_SERVER_KEY` | — | Kredensial server Midtrans (belum dipakai) | 3 |
| `MIDTRANS_CLIENT_KEY` | — | Kredensial client Midtrans (belum dipakai) | 3 |
| `MIDTRANS_IS_PRODUCTION` | `false` | Toggle sandbox/production Midtrans (belum dipakai) | 3 |
| `BANK_TRANSFER_ACCOUNT_*` | — | Info rekening tujuan transfer manual (belum dipakai) | 3 |

---

## 4. Modul Detail

### 4.1 `app/services/market_data.py`

**Tanggung jawab:** Satu-satunya titik akses ke data harga & OHLCV dari Yahoo Finance.

#### Struktur Data
```python
@dataclass
class QuoteSnapshot:
    symbol: str            # Kode simbol, misal "BBCA.JK"
    name: str               # Nama lengkap perusahaan/aset
    last_price: float | None
    prev_close: float | None
    change: float | None    # last_price - prev_close
    change_pct: float | None
    currency: str | None
    market_state: str | None  # misal "REGULAR", "CLOSED"
    fetched_at: float        # Unix timestamp saat data diambil
```

#### Fungsi

| Fungsi | Input | Output | Cache | Deskripsi |
|---|---|---|---|---|
| `get_history()` | `symbol, period, interval` | `pd.DataFrame` (kolom: Date, Open, High, Low, Close, Volume) | Ya, `CACHE_TTL_SECONDS` | Ambil data OHLCV historis via `yfinance.Ticker(symbol).history()` |
| `get_quote_snapshot()` | `symbol` | `QuoteSnapshot` | Ya, `CACHE_TTL_SECONDS` | Ambil harga terkini + info nama/currency/market state |
| `get_multiple_snapshots()` | `symbols: list[str]` | `list[QuoteSnapshot]` | Tidak langsung, mengandalkan cache per-simbol | Loop `get_quote_snapshot()` untuk banyak simbol |
| `search_symbol()` | `query, max_results` | `list[dict]` (symbol, name, exchange, type) | Tidak | Cari simbol via `yfinance.Search()`, dipakai fitur "tambah simbol" di sidebar |

#### Flow Proses: `get_history()`
```
1. Terima parameter symbol, period, interval
2. Panggil yf.Ticker(symbol).history(period, interval)
3. JIKA hasil kosong -> return DataFrame kosong (UI akan tampilkan warning)
4. Reset index -> kolom tanggal jadi kolom biasa
5. Normalisasi nama kolom tanggal: "Datetime" (untuk interval intraday)
   di-rename jadi "Date" agar konsisten dengan kode di chart_view.py
6. Return DataFrame
```

#### Flow Proses: `get_quote_snapshot()`
```
1. Buat objek yf.Ticker(symbol)
2. TRY: ambil ticker.fast_info -> last_price, previous_close, currency, market_state
3. TRY (nested): ambil ticker.get_info() -> nama lengkap (longName/shortName)
   JIKA gagal -> nama fallback = symbol itu sendiri
4. JIKA seluruh fast_info gagal diambil -> semua field jadi None
5. Hitung change = last_price - prev_close (jika keduanya ada)
6. Hitung change_pct = (change / prev_close) * 100
7. Return QuoteSnapshot dengan fetched_at = waktu saat ini
```

**Catatan penting:** Setiap panggilan `yf.Ticker().get_info()` adalah request HTTP terpisah — untuk watchlist besar, ini adalah titik yang paling mungkin lambat/kena rate-limit. Ini area yang perlu dioptimasi di Tahap 2 (misal: batch request, cache di level database, atau ganti provider data).

---

### 4.2 `app/services/news_data.py`

**Tanggung jawab:** Ambil berita terkait satu simbol.

#### Struktur Data
```python
@dataclass
class NewsItem:
    title: str
    publisher: str
    link: str
    published_at: datetime | None
```

#### Flow Proses: `get_news_for_symbol()`
```
1. Terima symbol, max_items (default dari settings.NEWS_MAX_ITEMS)
2. SUMBER UTAMA -- yfinance:
   a. Ambil ticker.news
   b. Untuk tiap item, ekstrak title/publisher/link/tanggal
      (menangani 2 kemungkinan struktur respons yfinance --
       versi lama field langsung di root, versi baru dibungkus di "content")
   c. Parse tanggal publish via _parse_published()
3. JIKA hasil dari yfinance kosong (list items masih kosong):
   FALLBACK -- Google News RSS:
   a. Bentuk URL pencarian Google News RSS berdasarkan simbol
   b. Parse via feedparser
   c. Ekstrak title/publisher/link/tanggal dari tiap entry RSS
4. Return list[NewsItem] (bisa kosong jika kedua sumber gagal)
```

**Fungsi helper `_parse_published()`:** Menangani 2 format tanggal berbeda dari yfinance — Unix timestamp (angka) atau string ISO 8601.

---

### 4.3 `app/indicators/technical.py`

**Tanggung jawab:** Semua perhitungan indikator teknikal, murni matematis (tidak ada I/O eksternal, tidak bergantung Streamlit atau yfinance). Ini membuat modul ini **paling mudah di-unit-test** dan **paling reusable** — bisa langsung dipakai ulang di backend Tahap 2 tanpa modifikasi.

| Fungsi | Rumus/Metode | Parameter Default |
|---|---|---|
| `moving_average()` | Simple Moving Average (SMA) — rata-rata rolling | `window` (wajib diisi caller) |
| `ema()` | Exponential Moving Average via `pandas.ewm()` | `window` (wajib diisi caller) |
| `rsi()` | Relative Strength Index, pakai EWM alpha=1/window untuk avg gain/loss | `window=14` |
| `macd()` | EMA(fast) - EMA(slow), lalu signal line = EMA(macd_line) | `fast=12, slow=26, signal=9` |
| `bollinger_bands()` | SMA ± (num_std × standard deviation rolling) | `window=20, num_std=2.0` |
| `add_all_indicators()` | Menggabungkan semua fungsi di atas ke satu DataFrame | — |
| `simple_signal()` | Ringkasan kondisi teknikal berbasis aturan sederhana | — |

#### Flow Proses: `add_all_indicators(df)`
```
1. Copy DataFrame input (tidak mutate df asli)
2. Tambah kolom: MA20, MA50 (dari moving_average dengan window 20 & 50)
3. Tambah kolom: EMA12, EMA26
4. Tambah kolom: RSI14
5. Panggil macd() -> tambah kolom MACD, MACD_Signal, MACD_Hist
6. Panggil bollinger_bands() -> tambah kolom BB_Upper, BB_Middle, BB_Lower
7. Return DataFrame lengkap dengan semua kolom indikator
```

#### Flow Proses: `simple_signal(df_with_indicators)`
```
1. JIKA data < 2 baris -> return "Data tidak cukup"
2. Ambil baris terakhir (data terkini)
3. Cek RSI14:
   - JIKA > 70 -> tambahkan pesan "overbought"
   - JIKA < 30 -> tambahkan pesan "oversold"
4. Cek MACD vs MACD_Signal:
   - JIKA MACD > Signal -> "momentum positif"
   - SEBALIKNYA -> "momentum negatif"
5. Cek MA20 vs MA50:
   - JIKA MA20 > MA50 -> "tren jangka pendek naik"
   - SEBALIKNYA -> "tren jangka pendek turun"
6. Gabungkan semua pesan dengan separator, atau "Netral" jika tidak ada sinyal
```

**PENTING (batasan bisnis):** Fungsi ini eksplisit dikomentari sebagai **bukan rekomendasi finansial** — hanya menerjemahkan angka indikator ke bahasa deskriptif. Developer yang melanjutkan kode ini **tidak boleh** mengubah fungsi ini jadi rekomendasi eksplisit ("BELI"/"JUAL") tanpa review kepatuhan (lihat `Documentation-Business.md` §5).

---

### 4.4 `app/ui/sidebar_view.py`

**Tanggung jawab:** Kelola watchlist (tambah via pencarian, tambah manual, hapus).

#### State Management
Menggunakan `st.session_state.watchlist` (list of string) — disimpan di memori sesi browser Streamlit, **hilang saat sesi ditutup** (ini yang akan diganti dengan database per-user di Tahap 2).

#### Flow Proses: `render_sidebar()`
```
1. Tampilkan judul & caption aplikasi
2. JIKA session_state belum punya "watchlist" -> inisialisasi dari
   settings.DEFAULT_WATCHLIST
3. --- Blok Pencarian ---
   a. Tampilkan text_input pencarian
   b. JIKA ada query -> panggil search_symbol(query)
   c. Render tiap hasil sebagai tombol "+ simbol -- nama"
   d. JIKA tombol diklik DAN simbol belum ada di watchlist ->
      tambahkan ke session_state.watchlist, lalu st.rerun()
4. --- Blok Watchlist Saat Ini ---
   a. Loop tiap simbol di watchlist, tampilkan dengan tombol hapus
   b. JIKA tombol hapus diklik -> set to_remove, lalu setelah loop:
      remove dari list, st.rerun()
5. --- Blok Tambah Manual ---
   a. Text input untuk ketik simbol langsung (misal "GOTO.JK")
   b. JIKA tombol "Tambah Simbol Manual" diklik -> uppercase input,
      tambahkan ke watchlist jika belum ada, st.rerun()
6. Tampilkan caption roadmap Tahap 2/3
7. Return session_state.watchlist (dipakai oleh main.py)
```

**Catatan teknis:** Pola `st.rerun()` setelah setiap perubahan state adalah cara Streamlit memaksa re-render UI segera — ini normal dan diperlukan di Streamlit, bukan bug.

---

### 4.5 `app/ui/watchlist_view.py`

**Tanggung jawab:** Tampilkan tabel ringkasan seluruh watchlist, dan biarkan user memilih satu simbol untuk dilihat detailnya.

#### Flow Proses: `render_watchlist(symbols)`
```
1. JIKA symbols kosong -> tampilkan info "Watchlist kosong", return None
2. Panggil get_multiple_snapshots(symbols) -- dengan spinner loading
3. Bangun list of dict (baris tabel): Simbol, Nama, Harga, Perubahan,
   Perubahan %, Mata Uang, Status Pasar
4. Convert ke pandas DataFrame
5. Terapkan styling kondisional:
   - Kolom "Perubahan" & "Perubahan %" diwarnai hijau (naik) / merah (turun)
   - Format angka: harga 2 desimal, perubahan dengan tanda +/-
6. Render via st.dataframe()
7. Tampilkan selectbox untuk pilih simbol -> user pilih satu untuk detail
8. Return simbol yang dipilih (dipakai main.py untuk render tab chart & berita)
```

---

### 4.6 `app/ui/chart_view.py`

**Tanggung jawab:** Render grafik candlestick 3-panel (harga, RSI, MACD) pakai Plotly.

#### Flow Proses: `render_chart(symbol)`
```
1. Tampilkan 3 kontrol: dropdown periode, dropdown interval, checkbox Bollinger Bands
2. Panggil get_history(symbol, period, interval) -- dengan spinner loading
3. JIKA DataFrame kosong -> tampilkan warning, STOP (return awal)
4. Panggil add_all_indicators(df) untuk hitung semua indikator
5. Bangun figure Plotly dengan 3 subplot (shared x-axis):
   - Panel 1 (55% tinggi): Candlestick + garis MA20, MA50
     JIKA checkbox Bollinger dicentang -> tambah garis BB_Upper/BB_Lower
     dengan fill area di antaranya
   - Panel 2 (20% tinggi): Garis RSI14 + garis horizontal referensi di 70 & 30
   - Panel 3 (25% tinggi): Bar histogram MACD + garis MACD & Signal
6. Render via st.plotly_chart()
7. Tampilkan caption disclaimer
8. Panggil simple_signal(df) -> tampilkan sebagai info box
```

**Detail teknis periode/interval:** Kombinasi interval kecil (menit) dengan periode panjang akan gagal/kosong karena keterbatasan Yahoo Finance (misal interval 15 menit hanya tersedia untuk periode pendek). Ini bukan bug aplikasi, melainkan batasan sumber data — sudah ditangani dengan pesan warning yang jelas ke user.

---

### 4.7 `app/ui/news_view.py`

**Tanggung jawab:** Render daftar berita untuk satu simbol.

#### Flow Proses: `render_news(symbol)`
```
1. Panggil get_news_for_symbol(symbol) -- dengan spinner loading
2. JIKA kosong -> tampilkan info "Tidak ada berita ditemukan"
3. Loop tiap NewsItem:
   a. Format tanggal publish (atau "Tanggal tidak diketahui" jika None)
   b. Render sebagai markdown: judul (link ke sumber asli), publisher, tanggal
   c. Tampilkan divider antar item
```

---

### 4.8 `app/main.py` — Entry Point

#### Flow Proses Lengkap (Alur Eksekusi Aplikasi)
```
1. st.set_page_config() -- atur judul tab browser, ikon, layout wide
2. Panggil main():
   a. render_sidebar() -> dapatkan watchlist terkini
   b. Tampilkan judul & caption utama
   c. render_watchlist(watchlist) -> tampilkan tabel, dapatkan simbol terpilih
   d. JIKA ada simbol terpilih:
      - Buat 2 tab: "Grafik & Indikator" dan "Berita"
      - Tab 1 -> render_chart(selected_symbol)
      - Tab 2 -> render_news(selected_symbol)
   e. Tampilkan disclaimer penutup
3. Streamlit otomatis re-run seluruh fungsi main() setiap kali ada
   interaksi user (klik tombol, ubah dropdown, dll) -- ini adalah model
   eksekusi standar Streamlit (top-to-bottom script re-run), BUKAN
   single-page-app dengan state persisten di client seperti React.
```

---

## 5. Alur Data End-to-End (Contoh Skenario)

**Skenario: User membuka dashboard, memilih "BBCA.JK" dari watchlist, melihat grafik.**

```
1. Browser load -> main.py dieksekusi dari atas
2. render_sidebar() dipanggil
   -> session_state.watchlist diisi dari DEFAULT_WATCHLIST (env var)
3. render_watchlist(watchlist) dipanggil
   -> untuk tiap simbol, get_quote_snapshot(symbol) dipanggil
      -> yf.Ticker(symbol).fast_info di-fetch (HTTP request ke Yahoo)
      -> hasil di-cache oleh st.cache_data selama CACHE_TTL_SECONDS
   -> tabel watchlist dirender dengan warna hijau/merah sesuai perubahan
4. User pilih "BBCA.JK" di selectbox
   -> Streamlit re-run seluruh script main.py
   -> selected_symbol = "BBCA.JK"
5. Tab "Grafik & Indikator" aktif -> render_chart("BBCA.JK") dipanggil
   -> get_history("BBCA.JK", period="6mo", interval="1d")
      -> yf.Ticker("BBCA.JK").history() di-fetch (HTTP request, atau cache hit)
   -> add_all_indicators(df) menghitung MA/RSI/MACD/BB secara lokal (tanpa network)
   -> Plotly figure dibangun & dirender
   -> simple_signal(df) menghasilkan ringkasan teks kondisi teknikal
6. User klik tab "Berita"
   -> render_news("BBCA.JK") dipanggil
   -> get_news_for_symbol("BBCA.JK") -> coba yfinance dulu, fallback Google News RSS
   -> daftar berita dirender
```

---

## 6. Ketergantungan Eksternal (Dependencies)

| Library | Fungsi dalam Aplikasi | Titik Kegagalan Potensial |
|---|---|---|
| `streamlit` | Framework UI & state management | — |
| `yfinance` | Sumber data harga, OHLCV, berita, pencarian simbol | Endpoint tidak resmi, bisa berubah/rate-limit |
| `plotly` | Render grafik candlestick interaktif | — |
| `pandas` | Manipulasi data OHLCV & perhitungan indikator | — |
| `feedparser` | Parse RSS Google News (fallback berita) | Bergantung ketersediaan Google News RSS |
| `python-dotenv` | Baca file `.env` | — |

---

## 7. Frontend + Backend Terpisah (Tahap 2 — Sudah Diimplementasikan)

> Status: **✅ Diimplementasikan.** Struktur `backend/` (FastAPI) dan `frontend/`
> (Next.js) sudah ada di root project, berjalan terpisah dari `app/`
> (Streamlit, Tahap 1, tetap dibiarkan ada sebagai referensi/fallback).
> Detail lengkap cara menjalankan ada di `README-Tahap2.md`.

### 7.1 Arsitektur Baru

```
Browser (Next.js, port 3000)
      │  fetch via lib/api.ts (SWR, polling 30 detik)
      ▼
FastAPI backend (port 8000)
      │  app/api/{market,chart,news}.py
      ▼
app/services/{market_data,news_data}.py  +  app/indicators/technical.py
      │
      ▼
yfinance ──► Yahoo Finance  /  feedparser ──► Google News RSS (fallback)
```

### 7.2 Perbedaan Kunci dari Versi Streamlit

| Area | Tahap 1 (Streamlit, `app/`) | Tahap 2 (`backend/` + `frontend/`) |
|---|---|---|
| Caching | `@st.cache_data` | `ttl_cache` custom di `backend/app/core/cache.py` — TTL-based, in-memory, framework-agnostic |
| State watchlist | `st.session_state` (hilang saat sesi tutup) | `localStorage` browser (frontend) — **masih belum per-akun**, lihat §7.4 |
| Presentasi | Streamlit widget (Python) | React components (`frontend/components/`) dengan Tailwind + design tokens dark mode |
| Grafik | Plotly (subplot 3 panel dalam 1 figure) | `lightweight-charts` v4 (TradingView) — 3 chart terpisah yang disinkronkan crosshair/zoom-nya manual via `subscribeVisibleLogicalRangeChange` |
| Komunikasi data | Langsung panggil fungsi Python | REST API JSON (FastAPI ↔ Next.js), lihat kontrak di `backend/app/api/schemas.py` dan `frontend/types/market.ts` |

### 7.3 Struktur Backend (`backend/app/`)

| File | Tanggung Jawab |
|---|---|
| `main.py` | Entry point FastAPI, setup CORS, register routes |
| `api/market.py` | `GET /api/market/quote/{symbol}`, `POST /api/market/watchlist`, `GET /api/market/search` |
| `api/chart.py` | `GET /api/chart/{symbol}` — return candle + semua indikator + `signal_summary` dalam satu response |
| `api/news.py` | `GET /api/news/{symbol}` |
| `api/schemas.py` | Pydantic models — kontrak request/response, otomatis jadi dokumentasi di `/docs` |
| `services/market_data.py`, `services/news_data.py` | **Logic identik** dengan versi Streamlit, hanya cache decorator diganti |
| `indicators/technical.py` | **Byte-identik** dengan versi Streamlit — modul ini murni matematis, tidak butuh perubahan sama sekali saat porting |
| `core/cache.py` | TTL cache in-memory baru (pengganti `st.cache_data`) — lihat §7.5 untuk batasannya |

### 7.4 Struktur Frontend (`frontend/`)

| File/Folder | Tanggung Jawab |
|---|---|
| `app/page.tsx` | Halaman utama — merangkai semua komponen, mengatur state watchlist/simbol terpilih, fetch data via SWR |
| `app/layout.tsx`, `app/globals.css` | Root layout, font import (Inter + JetBrains Mono), CSS variable dasar |
| `components/Sidebar.tsx` | Watchlist manager — cari simbol (`api.searchSymbol`), tambah/hapus |
| `components/WatchlistTable.tsx` | Tabel dense rows dengan warna hijau/merah kondisional |
| `components/CandlestickChart.tsx` | 3 chart `lightweight-charts` (harga+MA+Bollinger, RSI, MACD), disinkronkan manual |
| `components/SymbolHeader.tsx`, `ChartControls.tsx`, `SignalSummary.tsx`, `NewsPanel.tsx`, `Tabs.tsx` | Komponen pendukung, masing-masing satu tanggung jawab |
| `lib/api.ts` | **Satu-satunya** titik akses ke backend — komponen tidak pernah `fetch()` langsung |
| `lib/format.ts` | Formatter angka/tanggal terpusat |
| `types/market.ts` | Tipe TypeScript yang **di-mirror manual** dari `backend/app/api/schemas.py` — kalau schema backend berubah, file ini harus diupdate manual (belum ada codegen otomatis) |

**Flow proses halaman utama (`app/page.tsx`):**
```
1. Mount pertama kali -> baca watchlist dari localStorage (atau pakai default)
2. useSWR('watchlist-quotes') -> POST /api/market/watchlist -> render WatchlistTable
   -> auto refresh tiap 30 detik (QUOTE_REFRESH_MS)
3. User klik baris watchlist atau pilih dari Sidebar -> setSelectedSymbol()
4. useSWR('chart') -> GET /api/chart/{symbol}?period&interval -> render CandlestickChart
   -> auto refresh tiap 30 detik juga
5. useSWR('news') -> GET /api/news/{symbol} -> render NewsPanel (tanpa auto-refresh)
6. Setiap perubahan watchlist -> useEffect menulis balik ke localStorage
```

### 7.5 Batasan yang Masih Ada (Belum Selesai)

Implementasi Tahap 2 ini **baru mengganti arsitektur presentasi**, bukan menyelesaikan seluruh roadmap Tahap 2 dari `PRD.md`. Status keamanan & infrastruktur:

| # | Area | Kondisi Saat Ini | Yang Masih Perlu Dikerjakan |
|---|---|---|---|
| 1 | Autentikasi JWT | ✅ Register / login / logout / `GET /me` — cookie httpOnly + fallback Bearer | — |
| 2 | Session token storage | ✅ Cookie `access_token` (HttpOnly, SameSite=Lax); body token hanya untuk testing/Swagger | Production: pastikan HTTPS (`Secure`) — lihat §7.6 C-1 |
| 3 | Watchlist per-user | ✅ `GET/PUT/POST/DELETE /api/user/watchlist` terikat `user_id`; guest tetap localStorage | Kategori watchlist masih meta lokal (opsional migrasi ke DB) |
| 4 | Caching lintas-instance | `ttl_cache` in-memory, hanya berlaku untuk 1 proses backend | Kalau backend di-scale ke banyak instance/container, pindah ke Redis supaya cache konsisten |
| 5 | Rate-limiting | ✅ `slowapi` 30/menit per IP pada search, chart, watchlist POST, news (+ auth login/register) | Sesuaikan angka limit berdasarkan traffic nyata; pertimbangkan limit per-user setelah auth full |
| 6 | Sumber data harga | Masih `yfinance` (endpoint tidak resmi) | Evaluasi API berbayar sebelum scale ke banyak user simultan |
| 7 | Real-time push | Polling SWR tiap 30 detik (bukan WebSocket) | Kalau butuh update lebih instan, pertimbangkan WebSocket/SSE di backend |
| 8 | `app/core/` & `app/models/` (folder lama di root) | Placeholder, tidak lagi relevan | Folder baru `backend/app/core/` dan `backend/app/models/` yang dipakai sekarang |

### 7.6 Next Step — Migrasi JWT `localStorage` → httpOnly Cookie

> **Prioritas:** Tinggi (blocker soft untuk onboarding user publik / berbayar).  
> **Prasyarat:** JWT Auth dasar sudah ✅ (`PRD2/Enhancement-System/enhancement-system_JWTAuth.md`).  
> **Referensi UI notes:** caption sesi di `AuthCard` sudah dihapus setelah migrasi cookie + watchlist per-akun.

#### Mengapa

- `localStorage` bisa dibaca JavaScript → XSS dapat mencuri JWT.
- Cookie `HttpOnly` + `Secure` + `SameSite` tidak bisa dibaca dari JS; browser mengirim cookie otomatis ke API same-site / CORS ber-credentials.

#### Requirement

| ID | Requirement | Detail |
|---|---|---|
| C-1 | Set cookie di login | `POST /api/auth/login` set cookie session (mis. `access_token`) dengan `HttpOnly`, `Secure` (prod), `SameSite=Strict` atau `Lax`, `Path=/`, `Max-Age` selaras `JWT_EXPIRE_MINUTES` |
| C-2 | Set cookie setelah register | Setelah register + auto-login (atau redirect login), cookie sama seperti C-1 |
| C-3 | Baca session dari cookie | `get_current_user()` menerima token dari cookie **atau** (sementara) header Bearer — dual-support opsional selama masa transisi |
| C-4 | Logout server-side | Endpoint `POST /api/auth/logout` menghapus cookie (`Set-Cookie` expired / `max-age=0`) |
| C-5 | Frontend credentials | `fetch` ke API auth/`/me` memakai `credentials: 'include'`; **hapus** baca/tulis `trading-dashboard-token` di `localStorage` |
| C-6 | CORS credentials | `allow_credentials=True` sudah ada; pastikan `CORS_ORIGINS` eksplisit (bukan `*`) — sudah sesuai |
| C-7 | CSRF mitigation | Karena cookie otomatis terkirim: pakai `SameSite=Strict`/`Lax`, dan/atau CSRF token double-submit untuk method state-changing; dokumentasikan pilihan yang dipakai |
| C-8 | Swagger / testing | Update cara uji di `README-Tahap2.md` (cookie jar / browser login), bukan hanya Authorize Bearer |
| C-9 | Docs & UI copy | Hapus notes localStorage di `AuthCard`; centang item #2 di §7.5; update `enhancement-system_JWTAuth.md` §5 |

#### Checklist implementasi (urutan disarankan)

- [x] Backend: helper set/clear auth cookie (flags environment-aware: `Secure` hanya di non-local)
- [x] Backend: `login` / `register` set cookie; response masih return `access_token` (Swagger) + cookie httpOnly untuk browser
- [x] Backend: `POST /api/auth/logout` + clear cookie
- [x] Backend: `deps.get_current_user` baca cookie dulu, fallback Bearer (transisi)
- [x] Frontend: `fetchJson` → `credentials: 'include'`; hapus `getStoredToken` / `setStoredToken`
- [x] Frontend: `AuthCard` & `AppSidebarNav` logout panggil `POST /api/auth/logout` lalu redirect `/login`
- [x] Verifikasi: login → `/me` via cookie; logout clear cookie; tidak ada JWT di `localStorage`
- [x] Update §7.5 baris #2 → ✅; sync dokumentasi §7.7

#### Definition of Done

1. Tidak ada JWT auth di `localStorage`.
2. Session bertahan lewat cookie httpOnly; logout membersihkan cookie.
3. Notes UI + dokumen §7.5/#2 dan JWTAuth §5 sudah mencerminkan status selesai.

### 7.7 Checklist — Next Step & Caption Sesi (paragraf)

Checklist gabungan untuk menutup caption Login/Sign Up (*“Sesi disimpan di perangkat…”*) dan batasan §7.5 #2–#3.

**A. Prioritas next (urutan kerja)**

- [x] **§7.6 — Migrasi JWT `localStorage` → httpOnly cookie** (login/register set cookie, logout clear cookie, frontend `credentials: 'include'`, hapus `trading-dashboard-token`).
- [x] **§7.5 #3 — Watchlist per-user ke database** (GET/PUT/POST/DELETE `/api/user/watchlist`, terikat `user_id` via Prisma `WatchlistItem`).
- [ ] **Production hardening** (`CORS_ORIGINS` domain asli, rotasi secret, hosting) — belakangan.
- [ ] *(Opsional)* **Verifikasi email** — hanya jika ingin klaim “sebelum verifikasi email aktif” benar-benar berlaku (belum diimplementasikan).

**B. Supaya caption Login/Sign Up akurat / selesai**

- [x] Setelah cookie §7.6: sesi tidak mengandalkan token di `localStorage`.
- [x] Setelah watchlist per-akun: simbol pantauan tersinkron ke akun (bukan hanya browser untuk user login).
- [x] Update / hapus teks UI caption sesi agar sesuai kondisi nyata (jangan sebut verifikasi email sebelum fitur itu ada).
- [x] Centang §7.5 #2–#3 + DoD §7.6; update catatan JWTAuth terkait storage.

**C. Definition of Done singkat untuk caption**

- [x] Tidak ada JWT auth di `localStorage`.
- [x] Watchlist (simbol) tersimpan per akun di DB saat user login.
- [x] Microcopy Login/Sign Up diganti atau dihapus tanpa klaim fitur yang belum dibangun.

> **Status implementasi:** ✅ Cookie session + watchlist per-user sudah diimplementasikan (6 Sep 2026). Production hardening & email verification masih terbuka.

---

## 8. Setup Database — Supabase + Prisma ORM (Tahap 2)

> ⚠️ **Catatan penting sebelum mulai:** Prisma adalah ORM yang berasal dari ekosistem **Node.js/TypeScript**. Project ini saat ini berbasis **Python** (Streamlit, nanti FastAPI di Tahap 2). Ada dua cara realistis untuk menggabungkannya, dengan trade-off masing-masing:
>
> | Opsi | Deskripsi | Trade-off |
> |---|---|---|
> | **A. Prisma Client Python** | Pakai `prisma` Python package — schema tetap `.prisma`, generate client Python | Community-maintained (bukan resmi Prisma Labs), API sedikit berbeda dari Prisma JS, ekosistem plugin lebih terbatas |
> | **B. Prisma untuk migrasi saja + SQLAlchemy untuk query** | Prisma CLI dipakai hanya untuk `migrate` (schema & migration files), backend Python query pakai SQLAlchemy | Perlu maintain 2 tool, tapi SQLAlchemy jauh lebih matang di ekosistem Python |
>
> Panduan di bawah pakai **Opsi A (Prisma Client Python)** karena paling dekat dengan permintaan awal (satu ORM, satu schema). Jika di tengah jalan tim merasa lebih nyaman dengan SQLAlchemy murni, Opsi B lebih aman untuk produksi jangka panjang.

### 8.1 Membuat Database Baru di Supabase

**Langkah-langkah:**

1. **Buat akun/login** di [supabase.com](https://supabase.com)
2. Klik **"New Project"**
   - Isi nama project (misal: `ai-trading-dashboard`)
   - Pilih organization
   - Buat **Database Password** yang kuat — **simpan password ini**, akan dipakai di connection string
   - Pilih **Region** terdekat (misal `Southeast Asia (Singapore)` untuk latensi terbaik dari Indonesia)
   - Klik **"Create new project"** (proses provisioning ±2 menit)
3. Setelah project aktif, buka **Project Settings → Database**
4. Cari bagian **Connection string**:
   - Pilih tab **"URI"**
   - Salin connection string, formatnya seperti:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
     ```
   - Ganti `[YOUR-PASSWORD]` dengan password yang dibuat di langkah 2
5. **Penting untuk Prisma:** Supabase menyediakan 2 jenis connection string:
   - **Direct connection** (port `5432`) — dipakai untuk **migrasi** (`prisma migrate`)
   - **Connection pooling / PgBouncer** (port `6543`, ada parameter `?pgbouncer=true`) — dipakai untuk **query di runtime aplikasi**, supaya tidak kehabisan koneksi saat banyak user mengakses bersamaan

   Kedua string ini nanti dipisah jadi 2 environment variable (lihat §8.3).

### 8.2 Instalasi Prisma di Project Python

1. Tambahkan ke `requirements.txt`:
   ```
   prisma==0.15.0
   ```
2. Install:
   ```bash
   pip install -r requirements.txt
   ```
3. Inisialisasi Prisma di root project:
   ```bash
   prisma init
   ```
   Ini akan membuat folder `prisma/` berisi file `schema.prisma`, dan menambahkan `DATABASE_URL` ke `.env`.

### 8.3 Konfigurasi Environment Variable

Update `.env` (dan `.env.example` sebagai template):

```env
# --- Tahap 2: Database (Supabase + Prisma) ---
# Dipakai Prisma untuk migrasi schema (direct connection, port 5432)
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres

# Dipakai aplikasi saat runtime untuk query (connection pooling, port 6543)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
```

> Jangan commit `.env` yang sudah terisi password asli ke Git — pastikan `.env` ada di `.gitignore`.

### 8.4 Menulis Schema (`prisma/schema.prisma`)

Contoh schema awal yang selaras dengan kebutuhan produk (User, Watchlist, Subscription — lihat `PRD.md` §4.2–4.3 dan `Documentation-Business.md` §4):

```prisma
generator client {
  provider = "prisma-client-py"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

model User {
  id           String         @id @default(uuid())
  email        String         @unique
  passwordHash String
  role         Role           @default(MEMBER)
  createdAt    DateTime       @default(now())
  watchlist    WatchlistItem[]
  subscription Subscription?
}

enum Role {
  ADMIN
  MEMBER
}

model WatchlistItem {
  id        String   @id @default(uuid())
  symbol    String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  addedAt   DateTime @default(now())

  @@unique([userId, symbol])
}

model Subscription {
  id          String             @id @default(uuid())
  userId      String             @unique
  user        User               @relation(fields: [userId], references: [id])
  tier        SubscriptionTier   @default(FREE)
  status      SubscriptionStatus @default(ACTIVE)
  startDate   DateTime           @default(now())
  endDate     DateTime?
  paymentMethod PaymentMethod?
}

enum SubscriptionTier {
  FREE
  PRO
  PREMIUM
}

enum SubscriptionStatus {
  ACTIVE
  PENDING_VERIFICATION
  EXPIRED
  CANCELLED
}

enum PaymentMethod {
  BANK_TRANSFER
  MIDTRANS
}
```

> Model ini adalah **titik awal**, bukan final — sesuaikan field sesuai keputusan bisnis di `Documentation-Business.md` §7 (Pertanyaan Terbuka) sebelum dipakai produksi.

### 8.5 Menjalankan Migrasi

```bash
# Generate migration file & apply ke database Supabase
prisma migrate dev --name init

# Generate Prisma Client Python (dipanggil ulang tiap kali schema berubah)
prisma generate
```

**Yang terjadi di balik layar:**
1. Prisma membaca `schema.prisma`
2. Terhubung ke Supabase lewat `DIRECT_DATABASE_URL`
3. Membuat file migrasi SQL di `prisma/migrations/`
4. Menjalankan SQL tersebut ke database Supabase (membuat tabel `User`, `WatchlistItem`, `Subscription`, dst.)
5. Generate Python client di `node_modules/.prisma` atau lokasi custom, siap di-import sebagai `from prisma import Prisma`

### 8.6 Verifikasi di Supabase

1. Buka dashboard Supabase → menu **Table Editor**
2. Pastikan tabel `User`, `WatchlistItem`, `Subscription` sudah muncul sesuai schema
3. Coba insert 1 baris data test langsung dari Table Editor untuk memastikan struktur kolom sesuai

### 8.7 Contoh Pemakaian di Kode Python (`app/core/db.py` — belum ada, disiapkan)

```python
from prisma import Prisma

db = Prisma()

async def get_user_watchlist(user_id: str) -> list[str]:
    await db.connect()
    items = await db.watchlistitem.find_many(where={"userId": user_id})
    await db.disconnect()
    return [item.symbol for item in items]
```

> Prisma Client Python bersifat **async-first** — pemanggilannya perlu `await`. Ini butuh penyesuaian karena Streamlit (Tahap 1) berjalan sinkron; di Tahap 2 saat pindah ke FastAPI (yang native async), ini akan menyatu lebih mulus.

### 8.8 Checklist Setup

- [ ] Project Supabase dibuat, region dipilih sesuai target user (disarankan Singapore)
- [ ] Password database disimpan aman (password manager, bukan di chat/Slack)
- [ ] `DIRECT_DATABASE_URL` (port 5432) dan `DATABASE_URL` (port 6543, pooling) sudah dipisah di `.env`
- [ ] `prisma` ditambahkan ke `requirements.txt` dan diinstall
- [ ] `schema.prisma` ditulis sesuai kebutuhan produk final (bukan sekadar contoh di atas)
- [ ] `prisma migrate dev` berhasil dijalankan tanpa error
- [ ] Tabel terverifikasi muncul di Supabase Table Editor
- [ ] `.env` dipastikan masuk `.gitignore` sebelum push ke repository manapun

---

## 9. Testing (Belum Diimplementasikan — Rekomendasi)

Modul `app/indicators/technical.py` adalah kandidat **prioritas tertinggi** untuk unit test karena murni fungsi matematis tanpa I/O:
```python
# Contoh kerangka test yang disarankan (belum ada di kode saat ini)
def test_rsi_calculation():
    prices = pd.Series([...])  # data harga dummy dengan hasil RSI yang sudah diketahui
    result = rsi(prices, window=14)
    assert abs(result.iloc[-1] - expected_value) < 0.01
```

Modul `services/` lebih sulit di-unit-test karena bergantung network — disarankan pakai mocking (`unittest.mock`) untuk simulasi respons `yfinance` di Tahap 2.
