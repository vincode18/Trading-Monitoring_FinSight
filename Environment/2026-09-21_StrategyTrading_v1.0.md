# Strategy Trading — Ekstraksi dari Panduan HQSahamIDX_bot

> **Versi Dokumen:** 1.0
> **Sumber:** `Panduan_BOT_HQSaham_20240115.pdf` (70 halaman, panduan command bot Telegram
> HQSahamIDX_bot) — diekstrak penuh via `pypdf` (rendering PDF-ke-gambar tidak tersedia di
> environment ini, ekstraksi teks dipakai sebagai gantinya, seluruh 70 halaman terbaca)
> **Terkait:** `Environment/2026-09-06_DashboardPage_v1.0.md` §5.5 (Golden/Death Cross, sudah
> reuse pola serupa), `Environment/2026-09-21_NewFeatures_v1.0.md` §4 (Analysis — ide dari
> `yfinance`), struktur Analysis existing (`frontend/app/(app)/analysis/`,
> `backend/app/indicators/technical.py`)
> **Status:** 💡 Katalog ekstraksi — belum diimplementasikan, belum diprioritaskan
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Product Owner, Backend Developer, Frontend Developer

---

## 0. Ringkasan & Metodologi

PDF ini adalah **manual command bot Telegram** (HQSahamIDX_bot), bukan buku strategi — isinya
ratusan perintah `/SCORE xxx` untuk screening saham di seluruh pasar, bukan spesifikasi "cara
menganalisis satu simbol" seperti yang dibutuhkan tab **Analysis** FinSight. Dokumen ini
melakukan dua hal:

1. **Menyaring** dari ratusan command tersebut, mana yang sebenarnya **satu formula/sistem
   analisis teknikal berbasis OHLCV murni** (bisa dihitung dari data `yfinance` yang sudah jadi
   sumber data project — reuse penuh prinsip `Documentation/Documentation-Program.md` §7.5) —
   dan mana yang **butuh data broker/bandarmology proprietary** (NBSRatio, akumulasi top
   broker, transaksi asing/domestik per broker) yang **tidak tersedia** dari `yfinance` sama
   sekali, jadi **tidak bisa diimplementasikan** di FinSight tanpa langganan data pihak ketiga
   terpisah (lihat §4).
2. **Mengelompokkan** indikator yang saling berkaitan (multi-indikator jadi satu sistem, seperti
   contoh **Bill Williams Alligator** yang Anda sebutkan) menjadi kandidat **"Analisis Tunggal"**
   — satu sub-menu baru dalam tab **Analysis** — dipisahkan dari indikator berdiri sendiri yang
   lebih cocok jadi **penambahan** ke panel Analysis Overview yang sudah ada (`ScoreGauge.tsx`,
   `IndicatorSignalRow.tsx`, existing).

### 0.1 Prinsip Pengelompokan

| Kategori | Definisi | Contoh |
|---|---|---|
| **A. Sistem Analisis Tunggal** (sub-menu baru) | Kumpulan 2+ indikator yang **memang dirancang sebagai satu sistem** oleh penciptanya, dengan aturan entry/exit sendiri — tidak masuk akal dipecah jadi baris terpisah di tabel indikator generik | Bill Williams Alligator (Jaws+Teeth+Lips+Fractal+AO+AC), Ichimoku Kinko Hyo, Minervini Trend Template |
| **B. Indikator Tambahan** (baris baru di panel existing) | Satu formula berdiri sendiri, cocok jadi baris tambahan di `IndicatorSignalRow.tsx` (pola yang sama seperti RSI14/MACD/MA20/MA50 saat ini) | ADX, CCI, Williams %R, Vortex, TRIX |
| **C. Tidak Dapat Diimplementasikan** | Butuh data broker-level/bandarmology yang `yfinance` tidak sediakan | NBSRatio, Akumulasi Top Broker, Foreign Flow harian |

---

## 1. Kategori A — Sistem Analisis Tunggal (Kandidat Sub-Menu Baru)

### 1.1 Bill Williams Alligator + Profitunity Trading System ⭐ (contoh dari requirement Anda)

**Sumber PDF:** §"ALLIGATOR" (hal. 13), §"BILL WILLIAM ALLIGATORS" (hal. 54), Overlay `O4`,
Indikator `i48/i49` (Fractal), `i62` (Awesome Oscillator), `i63` (Acceleration Oscillator),
`i102` (Gator Oscillator).

**Formula (4 komponen, satu sistem oleh Bill Williams):**

| Komponen | Formula | Fungsi dalam Sistem |
|---|---|---|
| **Jaw** (rahang, biru) | `SMA(13)` pada median price `(High+Low)/2`, digeser maju 8 bar | Garis tren jangka panjang |
| **Teeth** (gigi, merah) | `SMA(8)` pada median price, digeser maju 5 bar | Garis tren jangka menengah |
| **Lips** (bibir, hijau) | `SMA(5)` pada median price, digeser maju 3 bar | Garis tren jangka pendek |
| **Fractal** | 5-bar pattern: bar tengah adalah High/Low tertinggi/terendah dari 2 bar sebelum & sesudahnya | Titik potensial reversal (Buy/Sell) |
| **Awesome Oscillator (AO)** | `SMA(5, median price) − SMA(34, median price)` | Momentum — crossing garis 0 = sinyal |
| **Accelerator Oscillator (AC)** | `AO − SMA(5, AO)` | Percepatan momentum — crossing garis 0 = sinyal lebih dini dari AO |

**Sinyal (persis dari PDF):**
- `BUAYA1`: Golden cross **Lips × Teeth** (MA5 × MA8)
- `BUAYA2`: Golden cross **Lips × Jaws** (MA5 × MA13)
- `BUAYA3`: Golden cross **Teeth × Jaws** (MA8 × MA13)
- `PTS1`: Sinyal **BULLISH** — AO, AC, dan Trade Zone semuanya hijau (konfirmasi kuat)
- `PTS2`: Sinyal **BUY** — AO crossing garis nol ke atas
- `PTS3`: Sinyal **BUY** — AC crossing garis nol ke atas

> ⚠️ **Catatan implementasi:** Definisi Alligator di PDF ini **menyederhanakan** versi asli Bill
> Williams — versi orisinal memakai *Smoothed Moving Average* (bukan SMA biasa) dan pergeseran
> maju (forward shift) 3/5/8 bar. PDF ini eksplisit menyebut Jaws/Teeth/Lips sebagai `MA13`,
> `MA8`, `MA5` tanpa detail smoothing/shift — perlu diputuskan saat implementasi apakah mengikuti
> versi sederhana PDF (SMA biasa, tanpa shift) atau versi asli Bill Williams (lihat §5 Pertanyaan
> Terbuka).

**Data dibutuhkan:** OHLCV murni — `yfinance` `get_history()` (existing) sudah cukup.

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `backend/app/indicators/technical.py` | Fungsi baru: `alligator()` (Jaw/Teeth/Lips), `fractals()` (Buy/Sell fractal points), `awesome_oscillator()`, `accelerator_oscillator()` |
| `backend/app/api/analysis.py` | Endpoint baru `GET /api/analysis/alligator/{symbol}` — return garis Jaw/Teeth/Lips + fractal points + AO/AC + sinyal BUAYA1-3/PTS1-3 |
| `backend/app/api/schemas.py` | `AlligatorResponse` (jaw/teeth/lips series, fractals, ao, ac, signals) |
| `frontend/app/(app)/analysis/alligator/[symbol]/page.tsx` (baru) | Sub-menu baru — chart 3 garis Alligator overlay di candlestick + panel AO/AC di bawahnya (pola sama `CandlestickChart.tsx` 3-panel existing) |
| `frontend/components/analysis/AlligatorChart.tsx` (baru) | Reuse pola `lightweight-charts` yang sudah dipakai di `CandlestickChart.tsx` |
| `AppSidebarNav.tsx` | Tambah child baru di menu Analysis: `{ href: '/analysis/alligator', label: 'Bill Williams Alligator', short: 'Bw' }` |

---

### 1.2 Ichimoku Kinko Hyo (Ichimoku Cloud)

**Sumber PDF:** §"ICHIMOKU" (hal. 28-29), Overlay `O8`, 42 sub-sinyal `ICHI1`–`ICHI42`.

**Formula (5 garis, satu sistem lengkap):**

| Garis | Formula | Fungsi |
|---|---|---|
| **Tenkan-sen** (Conversion Line) | `(Highest High(9) + Lowest Low(9)) / 2` | Tren jangka sangat pendek |
| **Kijun-sen** (Base Line) | `(Highest High(26) + Lowest Low(26)) / 2` | Tren jangka menengah, support/resistance dinamis |
| **Senkou Span A** (Leading Span A) | `(Tenkan-sen + Kijun-sen) / 2`, digeser maju 26 bar | Batas atas/bawah awan (kumo) |
| **Senkou Span B** (Leading Span B) | `(Highest High(52) + Lowest Low(52)) / 2`, digeser maju 26 bar | Batas atas/bawah awan (kumo) |
| **Chikou Span** (Lagging Span) | Harga close, digeser mundur 26 bar | Konfirmasi momentum |

Periode default `9/26/52` — PDF menyebut ini bisa dikustomisasi (`O8.short.mid.long`, contoh
`O8.18.52.104` untuk chart mingguan/skala lebih panjang).

**Contoh sinyal (dari 42 yang terdaftar, mewakili semua kategori):**
- Price crossing up/down Tenkan-sen atau Kijun-sen
- Price break upper/bottom cloud, price above/below/inside cloud
- Tenkan-sen × Kijun-sen golden/death cross ("Senkou Span Goldencross/Deathcross" di PDF —
  penamaan PDF agak menyesatkan, ini sebenarnya cross Tenkan/Kijun bukan Senkou)
- Chikou Span vs price/cloud (konfirmasi 26 bar ke belakang)
- Kumo (awan) merah vs hijau (Senkou A vs Senkou B) — future cloud bullish/bearish

**Data dibutuhkan:** OHLCV murni.

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `ichimoku()` — return dict 5 garis + status (`price_vs_cloud`, `tenkan_kijun_cross`, `chikou_status`) |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/ichimoku/{symbol}?short=9&mid=26&long=52` |
| `frontend/app/(app)/analysis/ichimoku/[symbol]/page.tsx` (baru) | Sub-menu baru, chart candlestick + 5 garis + area kumo (fill hijau/merah, `lightweight-charts` sudah support `addAreaSeries`/`setData` dengan gradient) |
| `AppSidebarNav.tsx` | Child baru: `Ichimoku Cloud` |

---

### 1.3 Minervini Trend Template

**Sumber PDF:** §"MINERVINI" (hal. 29) — nama metodologi trading saham dari Mark Minervini
(*Trade Like a Stock Market Wizard*), diadopsi bot sebagai satu sistem scoring 0-100.

**Formula (8 kriteria klasik Minervini, PDF hanya menyebut "score 100" tanpa merinci — versi
publik Minervini Trend Template yang umum dipakai komunitas):**

1. Harga di atas MA150 **dan** MA200
2. MA150 di atas MA200
3. MA200 sedang tren naik (minimal 1 bulan terakhir)
4. MA50 di atas MA150 **dan** MA200
5. Harga di atas MA50
6. Harga minimal 30% di atas Low 52 minggu
7. Harga maksimal dalam 25% dari High 52 minggu
8. *(Opsional, versi lengkap)* Relative Strength Rating vs pasar tinggi (IHSG sebagai benchmark
   untuk konteks FinSight)

**Sinyal dari PDF:**
- `MV1`: Score 100 (semua kriteria terpenuhi) + harga naik → **BUY**
- `MV2`/`MV3`: Score 100 tapi harga turun/tetap → **HOLD**
- `MVF`: Score fundamental baik menurut kriteria Minervini tambahan (di luar cakupan teknikal
  murni — lihat catatan di bawah)

> ⚠️ **Catatan cakupan:** PDF menyebut ada juga `MVF` (skor fundamental Minervini) — ini
> **di luar scope** dokumen ini karena butuh data fundamental (revenue growth, earnings growth)
> yang belum diekspos project (lihat `Environment/2026-09-21_NewFeatures_v1.0.md` §4 untuk ide
> fundamental panel terpisah dari `yfinance` `income_stmt`).

**Data dibutuhkan:** OHLCV + High/Low 52 minggu (`year_high`/`year_low` — field yang **sudah
direncanakan** ditambahkan ke `QuoteSnapshot` di `Environment/2026-09-21_NewFeatures_v1.0.md`
§4, tinggal reuse).

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `minervini_trend_template(df, year_high, year_low)` — return skor 0-100 (persentase kriteria terpenuhi) + breakdown per kriteria |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/minervini/{symbol}` |
| `frontend/app/(app)/analysis/minervini/[symbol]/page.tsx` (baru) | Checklist 7 kriteria (✅/❌) + skor total, reuse pola visual `ScoreGauge.tsx` existing untuk skor total |
| `AppSidebarNav.tsx` | Child baru: `Minervini Trend Template` |

---

### 1.4 Guppy Multiple Moving Average (GMMA)

**Sumber PDF:** §"GUPPY" (hal. 24), Overlay `O2`, Indikator `i39` (Guppy Oscillator).

**Formula (2 kelompok EMA, dirancang sebagai satu sistem oleh Daryl Guppy):**

| Kelompok | EMA Periode | Fungsi |
|---|---|---|
| **Short-term group** (trader) | EMA 3, 5, 8, 10, 12, 15 | Merepresentasikan aktivitas trader jangka pendek |
| **Long-term group** (investor) | EMA 30, 35, 40, 45, 50, 60 | Merepresentasikan aktivitas investor jangka panjang |

**Aturan (persis dari PDF):**
```
BUY (sinyal G1) jika:
  Price > Mean(ShortEMAs)  DAN  Mean(ShortEMAs) > Mean(LongEMAs)
```
Guppy Oscillator = `Mean(ShortEMAs) − Mean(LongEMAs)` — golden/death cross oscillator ini terhadap
garis 0 (`GOGC`/`GODC` di PDF) adalah sinyal tambahan. Jarak antar-EMA dalam tiap kelompok
("compression" vs "expansion" ribbon) adalah cara baca visual khas GMMA — kelompok rapat
(compressed) menandakan konsensus, kelompok melebar (expanded/fanned) menandakan tren kuat.

**Data dibutuhkan:** OHLCV murni — `ema()` sudah ada di `technical.py`, tinggal dipanggil 12×
dengan periode berbeda dan dikelompokkan.

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `guppy_mma(close)` — return 12 EMA series + `short_mean`, `long_mean`, `oscillator` |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/guppy/{symbol}` |
| `frontend/.../analysis/guppy/[symbol]/page.tsx` (baru) | Chart 12 garis EMA (gradien warna per kelompok: short = nuansa merah, long = nuansa biru — konvensi visual GMMA standar) + panel oscillator |
| `AppSidebarNav.tsx` | Child baru: `Guppy MMA` |

---

### 1.5 Turtle Trading System

**Sumber PDF:** §"TURTLE" (hal. 37-38), Price Band `P5` (default 20 hari atas, 10 hari bawah).

**Formula (sistem breakout channel klasik dari Richard Dennis):**

```
Entry (System 1, PDF: TS1/TS2): Breakout dari Donchian Channel
  Upper Channel = Highest High(20 hari)
  Lower Channel = Lowest Low(10 hari)
  BUY jika harga menembus Upper Channel(20)
  SELL/EXIT jika harga menembus Lower Channel(10)

TS3/TS4 (approaching signal): harga berada 2.75% di bawah upper channel — early warning
sebelum breakout benar-benar terjadi
```

> ⚠️ **Catatan cakupan:** Turtle System asli juga mencakup **position sizing berbasis ATR (N)**
> dan aturan pyramiding — PDF ini hanya mengekspos sinyal entry/exit channel-nya, bukan position
> sizing. Untuk FinSight (bukan platform eksekusi order, lihat non-goal produk), position sizing
> **tidak relevan** — cukup tampilkan sinyal breakout channel-nya saja.

**Data dibutuhkan:** OHLCV murni (High/Low rolling window).

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `donchian_channel(df, upper_period=20, lower_period=10)` — reusable juga untuk item Kategori B "Donchian Channel" (§2.7) |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/turtle/{symbol}` — status: `BREAKOUT_BUY`, `APPROACHING` (dalam 2.75% dari upper), `EXIT`, `NEUTRAL` |
| `frontend/.../analysis/turtle/[symbol]/page.tsx` (baru) | Chart candlestick + 2 garis channel (upper/lower) |
| `AppSidebarNav.tsx` | Child baru: `Turtle Trading System` |

---

### 1.6 Camarilla Pivot Support & Resistance

**Sumber PDF:** §"SUPPORT & RESISTENCE" (hal. 34-35), `/SR`, `/HELPSR`.

**Formula (metode Camarilla, 8 level dari 1 hari data OHLC sebelumnya):**

```
Range = High(prev) − Low(prev)
R4 = Close(prev) + Range × 1.1/2
R3 = Close(prev) + Range × 1.1/4
R2 = Close(prev) + Range × 1.1/6
R1 = Close(prev) + Range × 1.1/12
S1 = Close(prev) − Range × 1.1/12
S2 = Close(prev) − Range × 1.1/6
S3 = Close(prev) − Range × 1.1/4
S4 = Close(prev) − Range × 1.1/2
```

Bisa dihitung untuk 3 time frame (Daily/Weekly/Monthly) — PDF menyebut `/SR` (semua timeframe),
`/SRM` (khusus monthly).

> **Catatan hubungan dengan fitur existing:** `compute_support_resistance()` yang **sudah ada**
> di `technical.py` (dari `Environment/2026-09-06_DashboardPage_v1.0.md`) memakai metode **local
> min/max** (pivot dari data historis N hari), **bukan** Camarilla. Camarilla ini
> **pelengkap**, bukan pengganti — beda metodologi, beda use case (Camarilla untuk level
> intraday harian, local min/max untuk level swing jangka menengah). Disarankan jadi **tab
> terpisah** dalam sub-menu yang sama (Support & Resistance), bukan menggantikan panel existing.

**Data dibutuhkan:** OHLC hari sebelumnya — murni dari `get_history()` existing.

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `camarilla_pivots(prev_high, prev_low, prev_close)` |
| `api/analysis.py` | Extend endpoint `support-resistance` (existing) dengan query param `?method=local_extrema\|camarilla`, atau endpoint terpisah `GET /api/analysis/camarilla/{symbol}` |
| `frontend/components/analysis/SupportResistancePanel.tsx` (existing) | Tambah tab/toggle untuk pilih metode (Local Extrema vs Camarilla) — **tidak perlu sub-menu baru**, cukup perluasan panel yang sudah ada |

---

### 1.7 SuperTrend

**Sumber PDF:** §"SUPER TREND" (hal. 36), Indikator `i47`.

**Formula (ATR-based trend-following, 1 garis dengan 2 state warna):**

```
Basic Upper Band = (High+Low)/2 + Multiplier × ATR(period)
Basic Lower Band = (High+Low)/2 − Multiplier × ATR(period)

Final Upper/Lower Band mengikuti aturan trailing (band hanya bergerak searah tren,
tidak mundur) — logic standar SuperTrend:
  Jika Close > Final Upper Band sebelumnya → trend = UP, garis aktif = Final Lower Band
  Jika Close < Final Lower Band sebelumnya → trend = DOWN, garis aktif = Final Upper Band
```

Parameter default umum: `period=10, multiplier=3` (PDF tidak eksplisit menyebut nilai default,
perlu diverifikasi/diputuskan saat implementasi — lihat §5).

**Sinyal dari PDF:** `ST1` (Speculative Buy), `ST2` (Confirmed Buy), `ST3` (Partial Sell), `ST4`
(Confirmed Sell) — menunjukkan bot membedakan sinyal awal (baru berubah warna) vs sinyal
terkonfirmasi (sudah beberapa bar).

**Data dibutuhkan:** OHLC + ATR (butuh fungsi `atr()` baru — belum ada di `technical.py`, tapi
murni matematis dari High/Low/Close, tidak butuh sumber data baru).

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `atr(df, period=14)` (prasyarat), lalu `supertrend(df, period=10, multiplier=3)` |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/supertrend/{symbol}` |
| `frontend/.../analysis/supertrend/[symbol]/page.tsx` (baru) | Chart candlestick dengan garis SuperTrend berubah warna (hijau saat uptrend, merah saat downtrend) |
| `AppSidebarNav.tsx` | Child baru: `SuperTrend` |

---

### 1.8 Enhanced Heikin Ashi Trend System

**Sumber PDF:** §"HEIKEN ASHI" (hal. 26), Indikator `i109`, `i119` (Heikin Trend Analyzer).

**Formula (candle sintetis + sistem trend-strength berlapis warna):**

```
HA_Close = (Open+High+Low+Close)/4
HA_Open  = (HA_Open[prev] + HA_Close[prev]) / 2   (bar pertama: (Open+Close)/2)
HA_High  = max(High, HA_Open, HA_Close)
HA_Low   = min(Low, HA_Open, HA_Close)
```

**Sistem sinyal berlapis (dari PDF, i119 "Heikin Trend Analyzer"):**

| Warna | Arti |
|---|---|
| Merah | Trend turun masih kuat |
| Hijau | Trend naik masih kuat |
| Pink | Trend turun mulai melemah |
| Hijau muda | Trend naik mulai melemah |

**Strategi entry/exit persis dari PDF:**
```
Entry: beberapa warna merah berubah jadi beberapa warna pink (minimal 3 bar pink)
Stop Loss: berubah kembali jadi merah lebih dari 2 bar
Exit: candle hijau → hijau muda → merah
Hold: warna belum berubah merah berturut-turut lebih dari 2 bar
```
Plus sinyal `H1`-`H4` (Speculative Buy, Buy, Partial Exit/Buy More, Sell) dari "Enhanced
Heikin-Ashi" — PDF tidak merinci formula pastinya di balik H1-H4, kemungkinan kombinasi
posisi HA candle + EMA20 (chart default `/HA` memakai EMA20 + volume 26 hari).

**Data dibutuhkan:** OHLCV murni.

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `technical.py` | Fungsi baru `heikin_ashi(df)` — return OHLC sintetis; fungsi `heikin_trend_strength()` untuk klasifikasi warna (4 state) berdasar berapa bar berturut-turut searah |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/heikin-ashi/{symbol}` |
| `frontend/.../analysis/heikin-ashi/[symbol]/page.tsx` (baru) | Chart candlestick Heikin Ashi + indikator strip warna 4-state di bawahnya |
| `AppSidebarNav.tsx` | Child baru: `Heikin Ashi Trend` |

---

### 1.9 Candlestick Pattern Recognition Engine

**Sumber PDF:** §"CANDLESTICK PATTERN" (hal. 17-18, 39-40) — daftar lengkap **65 pola candlestick
bernama** (34 bullish `/TC1101`-`/TC60000`, 31 bearish `/TC1201`-`/TC70000`), plus 23 pola live
screening tambahan (`/CDL01`-`/CDL23`, format sama seperti fungsi standar TA-Lib:
`CDL2CROWS`, `CDL3BLACKCROWS`, `CDLDOJI`, `CDLENGULFING`, dst).

**Contoh pola (representatif dari 65+ total):**

| Bullish | Bearish |
|---|---|
| Hammer, Belt Hold, Engulfing, Harami, Piercing Line, Morning Star, Three White Soldiers, Abandoned Baby, Breakaway | Hanging Man, Engulfing, Dark Cloud Cover, Evening Star, Three Black Crows, Shooting Star, Abandoned Baby, Breakaway |

**Cara kerja:** Setiap pola adalah aturan geometris murni dari kombinasi Open/High/Low/Close
beberapa bar berturut-turut (1-3 bar tergantung pola) — ini **persis** cakupan fungsi
`CDLxxx` di library **TA-Lib** (`ta-lib` Python package) yang mengimplementasikan >60 pola
candlestick standar dengan nama identik.

> ⚠️ **Keputusan arsitektur:** Menulis ulang 65 pola candlestick secara manual di
> `technical.py` adalah pekerjaan besar dan rawan bug (tiap pola punya aturan geometris
> spesifik). **Alternatif yang jauh lebih realistis:** pakai library `ta-lib` (C library dengan
> Python binding) — **satu-satunya item di seluruh katalog ini yang butuh dependency baru**
> (`backend/requirements.txt`). Instalasi `ta-lib` butuh compiler C (beda dari dependency
> Python murni yang selama ini jadi prinsip project — lihat catatan di §5).

**Data dibutuhkan:** OHLCV murni, tapi butuh dependency baru (`TA-Lib`).

**Perubahan kode:**

| Komponen | Perubahan |
|---|---|
| `backend/requirements.txt` | Tambah `TA-Lib` (⚠️ satu-satunya dependency baru di seluruh dokumen ini, butuh C compiler saat instalasi — beda dari prinsip "tanpa TA-Lib" yang disebutkan eksplisit di komentar `technical.py` saat ini, lihat §5) |
| `technical.py` atau modul baru `candlestick_patterns.py` | Wrapper tipis di atas fungsi `talib.CDLxxx()` — loop semua fungsi `CDL*` dari TA-Lib, return pola yang terdeteksi di bar terakhir |
| `api/analysis.py` | Endpoint baru `GET /api/analysis/candlestick-patterns/{symbol}` — return list pola terdeteksi + bullish/bearish |
| `frontend/.../analysis/patterns/[symbol]/page.tsx` (baru) | List pola terdeteksi dengan badge Bullish (hijau)/Bearish (merah) |
| `AppSidebarNav.tsx` | Child baru: `Candlestick Patterns` |

---

## 2. Kategori B — Indikator Tambahan (Perluasan Panel Analysis Existing)

Indikator berikut **tidak perlu sub-menu sendiri** — cukup ditambahkan sebagai baris baru di
`IndicatorSignalRow.tsx` (pola yang sama seperti RSI14/MACD/MA20/MA50 di Analysis Overview saat
ini), murni fungsi baru di `technical.py` + baris baru di response `compute_analysis_score()`.

| Indikator | Formula Ringkas | Sumber PDF | Status |
|---|---|---|---|
| **ADX** (Average Directional Index) | `+DI`, `-DI` dari smoothed directional movement; `ADX = SMA(\|+DI−−DI\|/(+DI+−DI))`. Sinyal: `+DI > -DI` = bullish kuat; `+DI`×`-DI` golden cross = awal tren | hal. 8 | ❌ Belum ada |
| **CCI** (Commodity Channel Index) | `(Typical Price − SMA(TP,20)) / (0.015 × Mean Deviation)`. Level acuan: -100/0/+100 | hal. 18 | ❌ Belum ada |
| **Williams %R** | `(Highest High(N) − Close) / (Highest High(N) − Lowest Low(N)) × -100`. Overbought > -20, Oversold < -80 | hal. 47-48 | ❌ Belum ada |
| **Vortex Indicator** | `+VI`/`-VI` dari selisih High/Low antar-bar dibagi True Range. Golden cross `+VI`×`-VI` = bullish | hal. 38 | ❌ Belum ada |
| **TRIX** | Triple-smoothed EMA rate-of-change, + signal line (EMA9 dari TRIX). Golden cross & crossing garis 0 | hal. 36-37 | ❌ Belum ada |
| **Stochastic Oscillator** | `%K = (Close − Lowest Low(N))/(Highest High(N) − Lowest Low(N)) × 100`, `%D = SMA(%K, 3)`. Overbought > 80, Oversold < 20 | hal. 33-34 | ❌ Belum ada |
| **SMI Ergodic** | True Strength Index turunan (double-smoothed momentum) + signal line, default `TSI(5,20)` signal(5) | hal. 33 | ❌ Belum ada |
| **Parabolic SAR** (standalone) | `SAR[t] = SAR[t-1] + AF × (EP − SAR[t-1])`, AF mulai 0.02 naik 0.02 tiap EP baru sampai max 0.2 | hal. 31 | ❌ Belum ada (beda dari `detect_ma_cross`/Golden-Death Cross yang sudah ada) |
| **Donchian Channel** (standalone, di luar konteks Turtle §1.5) | `Upper = Highest High(N)`, `Lower = Lowest Low(N)`, `Middle = (Upper+Lower)/2` | hal. 21 | ❌ Belum ada — reuse `donchian_channel()` dari §1.5 |
| **Fibonacci Retracement/Extension** | Level 23.6/38.2/50/61.8/76.4/100% dari swing High-Low N hari (default 90 hari) | hal. 21-22 | ❌ Belum ada |
| **MFI** (Money Flow Index) | RSI berbasis volume: `Typical Price × Volume` sebagai Raw Money Flow, lalu ratio positive/negative flow. Overbought > 80, Oversold < 20 | hal. 29 | ❌ Belum ada |
| **CMF** (Chaikin Money Flow) | `Money Flow Multiplier × Volume`, di-rolling-sum lalu dibagi rolling-sum Volume. Crossing garis 0 | hal. 18 | ❌ Belum ada |
| **OBV** (On-Balance Volume) | Running total volume, ditambah bila close naik, dikurangi bila close turun | hal. 50 | ❌ Belum ada |
| **VWAP** (Volume Weighted Average Price) | `Σ(Typical Price × Volume) / ΣVolume`, biasanya reset harian (perlu data intraday — batasan: `yfinance` interval harian tidak cukup granular untuk VWAP intraday sungguhan, hanya bisa VWAP "rolling N hari" sebagai proksi) | hal. 38 | ❌ Belum ada, ⚠️ batasan data |
| **Elder Impulse System (EIS)** | Kombinasi warna EMA13 slope + MACD histogram slope (hijau/merah/biru) | hal. 21 | ❌ Belum ada |
| **Linear Regression Trend Slope** | Kemiringan garis regresi linier N hari — dipakai PDF untuk klasifikasi uptrend/downtrend/sideways | hal. 35-36 | ❌ Belum ada |
| **52-Week High/Low proximity** | `(price - low_52w)/(high_52w - low_52w)` — sudah sebagian direncanakan lewat `year_high`/`year_low` di `Environment/2026-09-21_NewFeatures_v1.0.md` §4 (Sentiment Gauge Range Score) | hal. 26 | 🟡 Sebagian (field-nya direncanakan, fungsi proximity belum) |
| **Seasonality (bulanan)** | Rata-rata return historis per-bulan (N tahun ke belakang) — butuh data historis panjang (`period="max"` di `get_history()`, sudah didukung) | hal. 33 | ❌ Belum ada |

---

## 3. Kategori C — Tidak Dapat Diimplementasikan (Butuh Data Broker Proprietary)

Bagian besar isi PDF (>40% dari total command) adalah analisis **bandarmology** — pergerakan
dana broker/asing/domestik per transaksi — yang **secara struktural tidak tersedia** dari
`yfinance`. `yfinance` hanya menyediakan data harga/volume agregat publik, **bukan** rincian
broker per transaksi (data ini di Indonesia biasanya berasal dari **KSEI/IDX data feed
berbayar**, sumber data yang benar-benar berbeda dari Yahoo Finance).

| Kategori PDF | Contoh Command | Kenapa Tidak Bisa |
|---|---|---|
| Akumulasi Top Broker | `/AB`, `/AS`, `/NBSRATIO`, `/TBD`, `/BQ` | Butuh data broker summary per saham (siapa beli/jual berapa lot) — tidak ada di `yfinance` |
| Akumulasi Domestik/Foreign | `/FD`, `/O`, `/OT`, `/AF`, `/ADF`, `/FACCUM` | Butuh data kepemilikan asing/domestik per transaksi harian — tidak ada di `yfinance` |
| Pasar Negosiasi | `/CR`, `/NM`, `/NMB` | Butuh data transaksi nego per broker — tidak ada di `yfinance` |
| Holder/Kepemilikan >5% | `/KPS`, `/KPM`, `/KPO` | Butuh data laporan kepemilikan KSEI — bukan cakupan `yfinance` (meskipun `yfinance.Ticker().major_holders`/`institutional_holders` ada untuk saham **US**, tidak untuk IDX — lihat `Environment/2026-09-21_NewFeatures_v1.0.md` §4 yang sudah mencatat keterbatasan ini) |

**Rekomendasi:** Kategori ini **tidak masuk** roadmap Analysis tab FinSight kecuali project
memutuskan berlangganan data feed IDX broker summary terpisah (di luar cakupan `yfinance`,
keputusan bisnis besar — dicatat sebagai catatan strategis, bukan item teknis siap kerja).

---

## 4. Signal Library — Katalog ~300 Sinyal Kombinatorial (`/SCORE APP`)

PDF menyebut satu fitur bot bernama `/SCORE APP;<kode sinyal>` (hal. 46-50) yang berisi
**~300 sinyal siap pakai**, sebagian besar adalah **parametrisasi** dari indikator yang sama di
§1-§2 (misal "GoldenCross MA(7,13)", "GoldenCross MA(7,26)", ... adalah 10 variasi periode dari
satu formula golden cross MA yang sama).

**Implikasi desain:** Daripada meniru pendekatan "300 command terpisah", cara yang lebih sehat
untuk FinSight adalah membuat fungsi-fungsi di §1-§2 **generik dengan parameter periode/level**
(pola yang **sudah** dipakai project — contoh `moving_average(close, window)` menerima parameter
`window` apa saja, bukan fungsi terpisah `ma20()`/`ma50()`/`ma200()`). Dengan pendekatan ini,
seluruh 300 sinyal MA/EMA/WMA cross, RSI level crossing, CCI level crossing, dll. otomatis
tercakup tanpa perlu 300 fungsi terpisah — cukup UI yang memungkinkan user memilih periode/level
sendiri di panel Analysis (misal dropdown periode untuk MA cross, bukan hardcode).

**Tidak direkomendasikan sebagai item roadmap terpisah** — ini murni catatan arsitektur untuk
diperhatikan **saat** mengimplementasikan §1-§2, supaya desainnya sudah generik sejak awal.

---

## 5. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] **Alligator (§1.1):** Pakai versi sederhana PDF (SMA biasa tanpa shift) atau versi asli
      Bill Williams (Smoothed MA + forward shift 3/5/8 bar)? Mempengaruhi akurasi visual chart
      dibanding referensi standar industri.
- [ ] **SuperTrend (§1.7):** Parameter default `period`/`multiplier` tidak disebutkan eksplisit
      di PDF — perlu ditentukan (umum dipakai: `10, 3`).
- [ ] **Candlestick Pattern Engine (§1.9):** Apakah menambah dependency `TA-Lib` (butuh C
      compiler, satu-satunya pengecualian dari prinsip "tanpa TA-Lib" yang sudah jadi komentar
      eksplisit di `technical.py`) sepadan dengan cakupan 65 pola, atau cukup implementasi
      manual untuk **subset kecil** pola paling populer (Hammer, Engulfing, Doji, Morning/Evening
      Star — 4-5 pola saja, tanpa dependency baru)?
- [ ] **VWAP (§2):** Karena `yfinance` interval harian tidak cukup granular untuk VWAP intraday
      sungguhan, apakah "VWAP rolling N-hari" sebagai proksi cukup bermakna untuk pengguna, atau
      item ini sebaiknya di-skip?
- [ ] **Prioritas 9 sub-menu Kategori A (§1):** Perlu diurutkan bersama Product Owner — dokumen
      ini tidak menetapkan urutan implementasi (beda dari dokumen `enhancement-design_*`
      sebelumnya yang selalu punya §7 "Urutan Implementasi") karena scope-nya murni katalog
      ekstraksi, prioritas final adalah keputusan produk di luar cakupan ekstraksi PDF ini.

---

## 6. Dokumen Terkait

- `Environment/2026-09-06_DashboardPage_v1.0.md` §5.5, §5.1 — pola `detect_ma_cross()`,
  `compute_analysis_score()` yang jadi acuan gaya kode untuk fungsi-fungsi baru di dokumen ini
- `Environment/2026-09-21_NewFeatures_v1.0.md` §4 — ide fitur Analysis dari `yfinance` (analyst
  ratings, fundamentals, ownership) — melengkapi, tidak tumpang tindih dengan dokumen ini
  (dokumen ini murni indikator teknikal OHLCV, `New-Features` murni data fundamental/kualitatif)
- `Documentation/Documentation-Program.md` §4.3 — modul `technical.py` existing yang jadi basis
  reuse seluruh fungsi baru
- `Documentation/Documentation-Business.md` §5 — kebutuhan disclaimer "bukan rekomendasi
  finansial", berlaku untuk **seluruh** sub-menu baru di dokumen ini tanpa kecuali
