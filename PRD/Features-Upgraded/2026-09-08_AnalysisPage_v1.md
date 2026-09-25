# Enhancement Design — Analysis Page v1

> **Versi Dokumen:** 1.0
> **File Code:** `2026-09-08_AnalysisPage_v1`
> **Terkait:** `2026-09-08_ChartPage_v1.md` (halaman asal navigasi menuju Analysis), `2026-09-08_GlobalSearch_v1.md`
> (search bar di Analysis Overview), `2026-09-07_DashboardPage_v1.3.md` §3.6 (sub-menu Analysis
> yang sudah ada: Earnings Calendar), `2026-09-05_DocProgram_v1.md` §4.1, §4.3 (fungsi backend
> existing yang direuse)
> **Status:** ✅ Diimplementasikan (rilis pertama: §2–§5.1; ide lanjutan §4.3/§5.3 ditunda)
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 1. Latar Belakang

Menu sidebar **Analysis** saat ini baru punya satu sub-item aktif: `Earnings Calendar` (dari
`2026-09-07_DashboardPage_v1.3.md` §3.6). Permintaan ini menambahkan sub-item baru **Overview**
sebagai halaman detail analisis teknikal & fundamental per simbol, diakses dari link yang
ditambahkan di halaman Chart (`2026-09-08_ChartPage_v1.md`).

**Perbedaan Overview dari halaman Chart yang sudah ada:**

| Aspek | Halaman Chart (existing) | Analysis Overview (dokumen ini) |
|---|---|---|
| Fokus | Visualisasi grafik candlestick + 3 indikator overlay (MA, RSI, MACD) dalam satu tampilan | Angka-angka teknikal **detail**, dipecah per tab, plus data OHLC mentah yang bisa diunduh |
| Interaksi | Lihat pola pergerakan harga secara visual | Baca nilai indikator persis, filter rentang tanggal, export data |
| Cakupan | Teknikal saja | Teknikal **dan** fundamental (laporan keuangan) |

Dokumen ini juga menjawab permintaan eksplisit: **ide widget/tab sebanyak-banyaknya** untuk
Analysis (§4), dipisah jelas mana yang bisa dibangun langsung dari fondasi `yfinance` yang sudah
ada, vs mana yang butuh verifikasi/effort tambahan.

### 1.1 Catatan Layout Belum Selesai (Di Luar Cakupan Dokumen Ini)

Screenshot yang menyertai permintaan ini masih menunjukkan **2 masalah** dari
`2026-09-08_ChartPage_v1.md` yang **belum diimplementasikan**:
1. Blok `MA50`/`MA200` masih di baris terpisah di pojok kanan atas, belum sejajar dengan judul
   `Chart` (spesifikasi perbaikan ada di `2026-09-08_ChartPage_v1.md` §5).
2. Ada kotak kosong tanpa isi di bawah blok `MA50`/`MA200` — kemungkinan sisa elemen yang belum
   dibersihkan, serupa dengan temuan "kotak kosong keempat" di Dashboard Page
   (`2026-09-07_DashboardPage_v1.1.md` §3.1).

**Kedua hal ini tidak dispesifikasikan ulang di sini** — sudah tercakup penuh di
`2026-09-08_ChartPage_v1.md`, dokumen ini murni fokus ke halaman Analysis yang baru.

### 1.2 Non-Goals
- Tidak mengubah halaman Chart itu sendiri, di luar penambahan **link/tombol navigasi** menuju
  Analysis Overview (§3).
- Tidak mengimplementasikan rekomendasi beli/jual eksplisit — seluruh tab analisis teknikal
  maupun fundamental di dokumen ini tunduk pada batasan kepatuhan yang sama seperti
  `simple_signal()` (`2026-09-05_DocProgram_v1.md` §4.3) dan Golden/Death Cross
  (`2026-09-06_DashboardPage_v1.md` §5.5) — menyajikan **fakta angka**, bukan instruksi
  tindakan.
- Tidak membangun model machine learning/prediksi harga — seluruh tab di §4 berbasis
  perhitungan matematis langsung dari data historis (indikator teknikal standar) atau data
  laporan keuangan yang dipublikasikan (fundamental), bukan proyeksi/prediksi.

---

## 2. Navigasi — Chart ke Analysis

### 2.1 Trigger

- Tombol/link baru di halaman Chart (`2026-09-08_ChartPage_v1.md`), diletakkan di area header
  dekat judul simbol (`MSFT Microsoft Corporation 496.82 ...`) — misal tombol `Analisis Detail →`
  atau ikon serupa.
- Klik tombol membawa pengguna ke `/analysis/overview?symbol={symbol}` (route baru), membawa
  simbol yang sedang aktif di Chart sebagai parameter — pengguna tidak perlu mencari ulang
  simbol yang sama di halaman Analysis.

### 2.2 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Halaman Chart (existing, sudah dispesifikasikan di `2026-09-08_ChartPage_v1.md`) | Tambah tombol `Analisis Detail` di header, membawa `selectedSymbol` sebagai query param navigasi |
| Menu sidebar **Analysis** | Tambah sub-item baru `Overview`, di atas `Earnings Calendar` yang sudah ada (dari `2026-09-07_DashboardPage_v1.3.md` §3.6) |

---

## 3. Struktur Halaman Analysis Overview

### 3.1 Header

- Search bar Global Search (reuse penuh dari `2026-09-08_GlobalSearch_v1.md`) — memungkinkan
  pengguna ganti simbol yang dianalisis langsung dari halaman ini, tanpa harus kembali ke Chart.
- Judul simbol aktif + harga terkini (pola yang sama seperti header Chart:
  `MSFT  Microsoft Corporation  496.82  +2.83 (+0.57%)`, reuse `get_quote_snapshot()` existing).

### 3.2 Tab Utama

Dua kelompok besar sesuai permintaan — **Analisis Teknikal** dan **Analisis Fundamental** —
masing-masing berisi beberapa sub-tab (detail di §4 dan §5):

```
[ Technical Analysis ]  [ Fundamental Analysis ]
```

---

## 4. Tab "Technical Analysis" — Daftar Ide Sub-Tab

Sesuai permintaan "ide sebanyak-banyaknya", berikut daftar lengkap dipecah 3 kategori
kesiapan: **Siap langsung** (reuse penuh fungsi existing), **Perlu fungsi baru ringan** (data
sumbernya sudah ada, perlu ditambah kalkulasi baru di `technical.py`), dan **Ide lanjutan**
(effort lebih besar atau perlu keputusan tambahan).

### 4.1 Siap Langsung Dibangun (Reuse Penuh)

| Sub-Tab | Isi | Sumber |
|---|---|---|
| **MA (Moving Average)** | Tabel nilai MA20, MA50 per tanggal, plus sinyal "harga di atas/bawah MA" | `moving_average()` — existing, `technical.py` |
| **RSI (14)** | Nilai RSI per tanggal, badge overbought (>70)/oversold (<30)/netral | `rsi()` — existing |
| **MACD** | Nilai MACD, Signal, Histogram per tanggal, badge momentum positif/negatif | `macd()` — existing |
| **Bollinger Bands** | Upper/Middle/Lower band per tanggal, badge "harga mendekati band atas/bawah" | `bollinger_bands()` — existing |
| **Ringkasan Sinyal** | Tampilan `simple_signal()` yang sudah ada di Chart, disajikan lebih detail (per-indikator, bukan satu kalimat gabungan) | `simple_signal()` — existing, dipecah tampilannya |
| **Data OHLC** | Tabel Open/High/Low/Close/Volume per hari, filterable sampai 1 tahun, **download ke Excel** (lihat §4.4) | `get_history()` — existing |

### 4.2 Perlu Fungsi Baru Ringan (Sudah Sempat Dirancang di Dokumen Lain)

| Sub-Tab | Isi | Sumber |
|---|---|---|
| **Golden/Death Cross History** | Riwayat seluruh persilangan MA20/MA50 dalam rentang waktu terpilih (bukan cuma status terkini seperti di Dashboard) | `detect_ma_cross()` — sudah dirancang di `2026-09-06_DashboardPage_v1.md` §5.5, diperluas jadi riwayat bukan snapshot |
| **Sentiment Gauge (Detail)** | Breakdown 4 komponen (RSI Score, Trend Score, Volatility Score, Range Score) yang membentuk skor akhir — bukan cuma angka gabungan seperti di Dashboard | `sentiment_score()`, `volatility_score()`, `range_score()` — sudah dirancang di `2026-09-06_DashboardPage_v1.md` §5.1, ditampilkan breakdown-nya |
| **Volume Analysis** | Grafik volume harian + rasio terhadap rata-rata 20 hari (badge "volume tidak biasa" jika rasio tinggi) | `volume_ratio()` — sudah dirancang di `2026-09-06_DashboardPage_v1.md` §5.3 |
| **Volatility Snapshot** | Standar deviasi harga rolling (20/50/90 hari), ditampilkan sebagai angka tunggal + tren naik/turun | Turunan dari fungsi `volatility_score()` yang sudah dirancang — dipakai di sini sebagai angka mentah, bukan sudah dinormalisasi ke skor 0-100 |

### 4.3 Ide Lanjutan — Sentiment News & Analisis Teknikal Tambahan

Sesuai permintaan eksplisit "sentiment News dan analisis-analisis teknikal", berikut ide
tambahan di luar yang sudah tercakup di §4.1–4.2:

| Sub-Tab | Isi | Status Kesiapan |
|---|---|---|
| **News Sentiment** | Klasifikasi sederhana berita terkini (positif/negatif/netral) berdasar kata kunci pada judul berita, ditampilkan sebagai ringkasan (misal "7 berita positif, 2 negatif dalam 7 hari terakhir") | **Perlu effort baru** — `get_news_for_symbol()` (existing) hanya mengambil berita, belum ada klasifikasi sentimen. Perlu logic tambahan (kata kunci sederhana, atau model NLP ringan) — pendekatan kata kunci sederhana lebih realistis untuk dibangun tanpa dependency ML baru, tapi akurasinya kasar dan **wajib** diberi disclaimer eksplisit bahwa ini bukan analisis sentimen yang tervalidasi |
| **Support & Resistance** | Level harga historis yang berulang kali jadi titik pantulan (dari local minima/maxima harga) | **Perlu fungsi baru** — logic deteksi local min/max dari data `get_history()`, belum ada di `technical.py`. Effort sedang, murni matematis (tidak butuh sumber data baru) |
| **Stochastic Oscillator** | Indikator momentum tambahan (selain RSI), populer untuk sinyal overbought/oversold jangka pendek | **Perlu fungsi baru** di `technical.py` — rumus standar, tidak butuh data tambahan dari `yfinance` |
| **ADX (Average Directional Index)** | Mengukur kekuatan tren (bukan arahnya) — pelengkap MA yang hanya menunjukkan arah | **Perlu fungsi baru** — rumus lebih kompleks dari indikator existing, effort lebih tinggi |
| **Fibonacci Retracement** | Level retracement dari swing high/low terakhir — populer di kalangan trader teknikal | **Perlu fungsi baru** — perhitungan langsung dari titik tertinggi/terendah di rentang waktu terpilih |
| **Correlation dengan Index Utama** | Seberapa erat pergerakan simbol mengikuti index utama market-nya (`^JKSE` untuk saham IDX, `^GSPC` untuk US) | **Perlu fungsi baru** — perhitungan korelasi Pearson antara `Close` simbol dan `Close` index, dari dua `get_history()` yang sudah ada |
| **Perbandingan Multi-Simbol** | Overlay pergerakan harga (dinormalisasi ke %) antara simbol aktif dengan 1-2 simbol pembanding yang dipilih pengguna | **Perlu komponen baru** — reuse `get_history()` untuk beberapa simbol sekaligus, normalisasi ke persentase perubahan dari titik awal, plot overlay |

> **Catatan kepatuhan khusus untuk News Sentiment:** Klasifikasi sentimen berbasis kata kunci
> sederhana **sangat rawan disalahartikan** sebagai analisis yang solid, padahal akurasinya
> kasar. Jika sub-tab ini dibangun, wajib disclaimer eksplisit ("klasifikasi otomatis
> sederhana, bukan analisis sentimen tervalidasi") — konsisten dengan prinsip kepatuhan yang
> sudah diterapkan di seluruh dokumen desain sebelumnya (`2026-09-05_DocBusiness_v1.md` §5).

### 4.4 Data OHLC — Filter & Export Excel

**Detail khusus sesuai permintaan eksplisit:**

- **Filter rentang waktu:** Dropdown/tombol pill (`1M, 3M, 6M, 1Y`) — maksimal **1 tahun**
  sesuai permintaan, memakai parameter `period` yang **sudah ada** di `get_history()`
  (`2026-09-05_DocProgram_v1.md` §4.1) — tidak perlu perubahan backend untuk filter ini.
- **Kolom tabel:** Date, Open, High, Low, Close, Volume — seluruhnya **sudah** dikembalikan
  oleh `get_history()` apa adanya, tidak ada kolom yang perlu ditambah dari sumber baru.
- **Export ke Excel:**
  - Tombol `Download Excel` di atas tabel.
  - **Pendekatan yang direkomendasikan:** generate file `.xlsx` di **sisi frontend**
    (library `xlsx`/SheetJS atau serupa) dari data yang **sudah ter-fetch** untuk ditampilkan
    di tabel — menghindari endpoint backend baru khusus untuk export, karena data mentahnya
    sama persis dengan yang dipakai render tabel.
  - Alternatif: endpoint backend baru `GET /api/market/ohlc-export/{symbol}` yang generate
    `.xlsx` di server (pakai `openpyxl` atau `pandas.DataFrame.to_excel()`) — lebih berat di
    server tapi menghindari dependency tambahan di frontend. **Keputusan pendekatan mana yang
    dipakai didaftarkan sebagai pertanyaan terbuka di §7.**
  - Nama file mengikuti pola `{symbol}_OHLC_{start}_{end}.xlsx` (contoh:
    `MSFT_OHLC_2025-09-08_2026-09-08.xlsx`).

---

## 5. Tab "Fundamental Analysis" — Daftar Ide Sub-Tab

> ⚠️ **Status verifikasi:** Berbeda dari tab Technical Analysis (§4.1) yang murni reuse fungsi
> yang sudah teruji di project ini, seluruh sub-tab Fundamental Analysis **bergantung pada
> field `yfinance` yang belum pernah dipakai di project ini sebelumnya**
> (`Ticker.income_stmt`, `Ticker.quarterly_income_stmt`, `Ticker.balance_sheet`,
> `Ticker.cashflow`). Field-field ini terkonfirmasi **ada** di `yfinance`, tapi nama baris/kolom
> persis di dalamnya **belum diverifikasi** di sandbox dokumen ini disusun — pola yang sama
> dengan temuan di `2026-09-07_DashboardPage_v1.3.md` §2.3 untuk `yfinance.Calendars`. Checklist
> verifikasi lengkap ada di §7.

### 5.1 Sub-Tab yang Diusulkan

| Sub-Tab | Isi | Sumber (Dugaan, Perlu Verifikasi) |
|---|---|---|
| **Earnings Summary** | Revenue, Net Income, EPS — kuartal terakhir vs kuartal sebelumnya, dengan indikator naik/turun | `Ticker.quarterly_income_stmt` |
| **Profitability Ratios** | Net Profit Margin (NPM), Gross Margin, Operating Margin | Dihitung dari `Ticker.income_stmt` (`Net Income / Revenue`, dst. — rumus sederhana, tapi nama baris persis di DataFrame hasil perlu dicek) |
| **Balance Sheet Snapshot** | Total Assets, Total Liabilities, Total Equity, Debt-to-Equity Ratio | `Ticker.balance_sheet` |
| **Cash Flow Summary** | Operating Cash Flow, Free Cash Flow, Capital Expenditure | `Ticker.cashflow` |
| **Revenue & Profit Trend** | Grafik tren Revenue dan Net Income beberapa kuartal/tahun terakhir (line chart sederhana) | `Ticker.quarterly_income_stmt` atau `Ticker.income_stmt` (tahunan), diplot sebagai tren |
| **Valuation Snapshot** | P/E Ratio, P/B Ratio, Market Cap | Kemungkinan tersedia dari `Ticker.info` atau `Ticker.fast_info` (fungsi `get_quote_snapshot()` **sudah** memakai `fast_info`, tapi belum mengekspos field valuasi — lihat `2026-09-05_DocProgram_v1.md` §4.1) |
| **Dividend History** | Riwayat pembagian dividen (jika ada) | `Ticker.dividends` — terkonfirmasi ada di dokumentasi `yfinance`, format hasil belum diverifikasi |

### 5.2 Keterbatasan yang Sudah Diketahui

- **Data fundamental untuk saham IDX kemungkinan besar tidak selengkap saham US** — pola ini
  konsisten dengan temuan sebelumnya soal Earnings Calendar
  (`2026-09-07_DashboardPage_v1.2.md` §2, `Ticker().calendar` "sering kosong untuk IDX").
  Kemungkinan besar tab Fundamental Analysis akan **lebih berguna untuk tab market US**
  dibanding Indonesia — ini perlu diverifikasi langsung, bukan diasumsikan, tapi disebutkan di
  sini sebagai ekspektasi realistis berdasar pola yang sudah berulang kali ditemukan.
- **Tidak ada rencana kalkulasi rasio fundamental yang lebih kompleks** (ROE, ROA, Quick Ratio,
  Current Ratio, dst.) di rilis pertama — didaftarkan sebagai ide lanjutan di §5.3, bukan
  cakupan wajib dokumen ini.

### 5.3 Ide Lanjutan Fundamental (Di Luar Cakupan Rilis Pertama)

| Ide | Catatan |
|---|---|
| **ROE (Return on Equity), ROA (Return on Assets)** | Kalkulasi turunan dari Balance Sheet + Income Statement, effort tambahan setelah §5.1 terverifikasi |
| **Quick Ratio, Current Ratio** | Turunan dari Balance Sheet, sama seperti di atas |
| **Perbandingan Fundamental Multi-Simbol** | Sama pola dengan "Perbandingan Multi-Simbol" di §4.3, tapi untuk metrik fundamental — misal bandingkan NPM beberapa bank sekaligus |
| **Analyst Recommendations** | `yfinance` punya `Ticker.recommendations` — **berpotensi menyinggung batasan kepatuhan** yang sama seperti `simple_signal()` jika ditampilkan sebagai "rekomendasi", perlu review lebih hati-hati sebelum diusulkan serius |

---

## 6. Ringkasan Perubahan Kode

| File | Perubahan |
|---|---|
| `app/services/market_data.py` | Fungsi baru: `get_fundamentals(symbol)` membungkus `Ticker.income_stmt`, `.balance_sheet`, `.cashflow`, `.dividends` (§5) — struktur persis menunggu verifikasi §7 |
| `app/indicators/technical.py` | Fungsi baru untuk §4.3: `stochastic_oscillator()`, `adx()`, `fibonacci_retracement()`, `support_resistance_levels()`, `correlation_with_index()` — masing-masing independen, bisa dibangun bertahap |
| `app/services/news_data.py` | Fungsi baru `classify_sentiment_simple()` untuk News Sentiment (§4.3) — opsional, effort rendah tapi akurasi kasar |
| `app/api/market.py` | Endpoint baru: `/analysis/technical/{symbol}`, `/analysis/fundamental/{symbol}`, opsional `/analysis/ohlc-export/{symbol}` (§4.4) |
| Frontend — route baru `/analysis/overview` | Halaman utama, 2 tab besar (Technical/Fundamental), masing-masing berisi sub-tab dari §4–5 |
| Menu sidebar **Analysis** | Tambah sub-item `Overview` (§2.2) |
| Halaman Chart (`2026-09-08_ChartPage_v1.md`) | Tambah tombol navigasi ke Analysis Overview (§2.1) |

---

## 7. Yang Belum Diputuskan / Perlu Verifikasi (Perlu Konfirmasi Lanjutan)

- [ ] **Prioritas tertinggi:** verifikasi struktur `Ticker.income_stmt`, `.quarterly_income_stmt`,
      `.balance_sheet`, `.cashflow`, `.dividends` di lingkungan dengan akses internet penuh —
      catat nama baris/kolom persis sebelum menulis kode `get_fundamentals()` final. Pola
      verifikasi yang sama seperti `2026-09-07_DashboardPage_v1.3.md` §2.3.
  ```python
  import yfinance as yf
  t = yf.Ticker("MSFT")
  print(t.income_stmt)
  print(t.quarterly_income_stmt)
  print(t.balance_sheet)
  print(t.cashflow)
  print(t.dividends)
  ```
- [ ] Apakah export Excel dibangun di sisi frontend (SheetJS) atau backend (`openpyxl`) — §4.4
      menyebutkan trade-off keduanya, belum diputuskan final.
- [ ] Berapa banyak sub-tab dari §4.3 dan §5.3 (ide lanjutan) yang masuk rilis pertama vs
      ditunda — dokumen ini sengaja mendaftarkan **semua ide** sesuai permintaan "sebanyak
      banyaknya", tapi implementasi bertahap perlu prioritas yang dipilih terpisah.
- [ ] Redaksi disclaimer untuk News Sentiment (§4.3) — perlu review lebih spesifik dari yang
      sudah ada di `Documentation-Business.md` §5, mengingat sentimen otomatis kata-kunci punya
      risiko misinterpretasi lebih tinggi dari indikator teknikal standar.
- [ ] Apakah **Analyst Recommendations** (§5.3) layak diusulkan sama sekali, mengingat potensi
      benturan dengan batasan kepatuhan — perlu didiskusikan terpisah sebelum masuk roadmap.

---

## 8. Dokumen Terkait

- `2026-09-08_ChartPage_v1.md` — halaman asal navigasi ke Analysis, termasuk 2 masalah layout
  yang masih terbuka (§1.1 dokumen ini)
- `2026-09-08_GlobalSearch_v1.md` — search bar yang direuse di header Analysis Overview (§3.1)
- `2026-09-07_DashboardPage_v1.3.md` §3.6 — sub-menu Analysis existing (Earnings Calendar),
  yang kini punya sub-item saudara baru (Overview)
- `2026-09-06_DashboardPage_v1.md` §5.1, §5.3, §5.5 — Sentiment Gauge, Volume Ratio,
  Golden/Death Cross yang direuse dengan tampilan lebih detail di §4.2
- `2026-09-05_DocProgram_v1.md` §4.1, §4.3 — fungsi backend existing (`get_history()`,
  `technical.py`) yang jadi fondasi seluruh tab Technical Analysis
- `2026-09-05_DocBusiness_v1.md` §5 — kebutuhan disclaimer, berlaku untuk seluruh sub-tab
  analisis di dokumen ini, terutama News Sentiment dan Golden/Death Cross History