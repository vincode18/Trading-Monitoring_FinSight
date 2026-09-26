# All Trading Strategy — Katalog Sistem untuk Menu Analysis

> **Versi Dokumen:** 1.0
> **File Code:** `2026-09-21_AllTradingStrategy_v1`
> **Sumber:** `Panduan_BOT_HQSaham_20240115.pdf` (HQSahamIDX_bot, 70 halaman, 15 Januari 2024)
> **Terkait:** `2026-09-08_AnalysisPage_v1.md` (Overview + Earnings Calendar), `frontend/components/app/AppSidebarNav.tsx`
> **Status:** Diimplementasikan sebagai dropdown Trading Strategy di tab Technical Analysis (`/analysis/overview`), bukan 30 route sidebar terpisah
> **Terakhir Diperbarui:** 22 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 0. Maksud dokumen

PDF sumber adalah manual perintah screening bot, bukan buku teks rumus. Dokumen ini mengekstrak **setiap sistem trading yang berdiri sendiri** dari PDF itu, lalu menempatkannya sebagai **sub-menu di bawah Analysis**.

Satu sistem bernama = satu halaman. Sinyal anggota sistem (misalnya ketiga garis Alligator, Awesome Oscillator, dan Fractal) tinggal di halaman yang sama, bukan dipecah jadi menu terpisah.

Halaman menyajikan **keadaan indikator** (contoh: “Lips memotong Teeth ke atas”). Bukan instruksi beli atau jual. Ini mengikuti non-goal `2026-09-08_AnalysisPage_v1.md`. Label “Indikasi BUY/SELL” di PDF diterjemahkan menjadi nama keadaan (bullish cross, bearish cross, oversold, overbought).

Data harga memakai `get_history()` yang sudah ada. Perhitungan baru masuk `backend/app/indicators/technical.py` hanya saat sistem ini diimplementasikan.

---

## 1. Navigasi

Sidebar **Analysis** saat ini: Overview, Earnings Calendar.

Tambahan anak menu (urutan):

| Sub-menu | Route |
|---|---|
| Profitunity | `/analysis/profitunity` |
| Bollinger | `/analysis/bollinger` |
| Ichimoku | `/analysis/ichimoku` |
| Guppy | `/analysis/guppy` |
| Minervini | `/analysis/minervini` |
| Turtle | `/analysis/turtle` |
| Donchian | `/analysis/donchian` |
| SuperTrend | `/analysis/supertrend` |
| Pixel | `/analysis/pixel` |
| Elder Impulse | `/analysis/elder-impulse` |
| TTM | `/analysis/ttm` |
| Heiken Ashi | `/analysis/heiken-ashi` |
| Fibonacci | `/analysis/fibonacci` |
| Candlestick | `/analysis/candlestick` |
| Moving Average | `/analysis/moving-average` |
| ADX | `/analysis/adx` |
| MACD | `/analysis/macd` |
| RSI | `/analysis/rsi` |
| Stochastic | `/analysis/stochastic` |
| CCI | `/analysis/cci` |
| MFI | `/analysis/mfi` |
| CMF | `/analysis/cmf` |
| TRIX | `/analysis/trix` |
| Vortex | `/analysis/vortex` |
| SMI Ergodic | `/analysis/smi` |
| Parabolic SAR | `/analysis/parabolic-sar` |
| Trend | `/analysis/trend` |
| Support & Resistance | `/analysis/support-resistance` |
| Volume & Pressure | `/analysis/volume-pressure` |
| Gap | `/analysis/gap` |

Setiap halaman memakai simbol aktif yang sama dengan Overview (`?symbol=`). Header menampilkan nama sistem, nilai rumus terkini, dan tabel keadaan sinyal.

### 1.1 Ringkasan di Analysis Overview

Widget kecil (satu baris keadaan, bukan halaman penuh) untuk simbol yang sedang dibuka:

- Profitunity: posisi harga terhadap Jaw / Teeth / Lips, plus AO di atas atau di bawah nol
- Moving Average: cross SMA20/SMA50 terakhir (sudah ada pola serupa di dashboard)
- RSI(14): nilai dan zona (<30, 30–70, >70)
- MACD(12,26,9): histogram di atas atau di bawah nol, cross terakhir
- SuperTrend: harga di atas atau di bawah garis
- 52-week: jarak persen ke high dan ke low

---

## 2. Profitunity / Bill Williams Alligator

**Route:** `/analysis/profitunity`  
**Overview:** ya  
**Sumber PDF:** bagian ALLIGATOR (`/GATORS`, `/PTS`, `/SCORE BUAYA1–3`, `/SCORE PTS1–3`) dan FRACTAL (`/SCORE FR1–FR3`). `/PTSHELP` menunjuk ke Profitunity Trading System (entry, exit, sinyal beli, sinyal jual, chart).

Tiga alat Bill Williams dihitung bersama karena PDF memperlakukannya sebagai satu sistem (PTS + buaya + fractal).

### 2.1 Alligator

Median price:

```
median = (high + low) / 2
```

SMMA (smoothed MA, sama dengan EMA dengan `alpha = 1/period` setelah seed SMA):

| Garis | Periode | Geser ke depan (bar) |
|---|---|---|
| Lips (bibir) | SMMA 5 | 3 |
| Teeth (gigi) | SMMA 8 | 5 |
| Jaw (rahang) | SMMA 13 | 8 |

PDF menyederhanakan nama periode menjadi MA 5 / MA 8 / MA 13. Implementasi memakai SMMA + offset di atas (rumus Alligator standar yang cocok dengan nama Lips/Teeth/Jaws di PDF).

Keadaan:

| Kode PDF | Keadaan |
|---|---|
| BUAYA1 | Lips memotong Teeth ke atas pada bar terakhir |
| BUAYA2 | Lips memotong Jaw ke atas pada bar terakhir |
| BUAYA3 | Teeth memotong Jaw ke atas pada bar terakhir |
| PTS1 | Zona trading hijau: `close > Lips` dan `Lips > Teeth > Jaw` |
| (kebalikan) | Zona merah: `close < Lips` dan `Lips < Teeth < Jaw` |
| (tidur) | Ketiga garis berimpit / berdekatan (selisih < 0,1% dari harga) — alligator “tidur” |

### 2.2 Awesome Oscillator

```
median = (high + low) / 2
AO = SMA(median, 5) - SMA(median, 34)
```

| Kode PDF | Keadaan |
|---|---|
| PTS2 | AO memotong garis 0 ke atas pada bar terakhir |
| PTS3 | PTS2 dan zona trading hijau (PTS1) terjadi bersamaan |

Tampilkan juga AO memotong 0 ke bawah, dan histogram 2 bar terakhir naik (saucer) sebagai keadaan tambahan di halaman yang sama.

### 2.3 Fractal

Fractal naik (up) pada bar `i` jika `high[i]` lebih tinggi dari high dua bar di kiri dan dua bar di kanan. Fractal turun kebalikannya pada `low`.

| Kode PDF | Keadaan |
|---|---|
| FR1 | Fractal naik terbaru, harga terkini masih naik menjauhi fractal |
| FR2 | Fractal naik terbaru, harga terkini sedang koreksi mendekati fractal |
| FR3 | Harga stagnan di sekitar fractal terakhir |

Chart referensi PDF: indikator O6, rentang sekitar 60 bar.

---

## 3. Bollinger Band

**Route:** `/analysis/bollinger`  
**Overview:** tidak (cukup di chart)  
**Default PDF:** periode 20, deviasi 2 (dari contoh backtest `BBAND 20,2`).

```
mid = SMA(close, 20)
upper = mid + 2 * STDEV(close, 20)
lower = mid - 2 * STDEV(close, 20)
bandwidth = (upper - lower) / mid
```

| Kode | Keadaan |
|---|---|
| BB1 | Close menembus mid dari bawah |
| BB2 | Close menembus mid dari atas |
| BB3 | Close menembus upper dari bawah |
| BB4 | Close menembus lower dari atas |
| BB5 | Squeeze: bandwidth pada persentil rendah (mis. terendah 120 bar) |
| BB6 | Close kembali masuk ke dalam band setelah berada di bawah lower |
| BB7 | Close kembali masuk ke dalam band setelah berada di atas upper |
| BB8 | Close menembus upper, dan 5 bar sebelumnya selalu di bawah upper |
| BB9 | 3 bar terakhir merayap di bawah upper, hari ini close bertahan di atas upper |
| BB10 | Break upper yang berasal dari bawah mid (bar sebelumnya close < mid) |

Chart: single band, dual band, triple band. Triple band boleh memakai Heiken Ashi sebagai jenis candle (BBAND3 di PDF), rumus band tetap sama.

---

## 4. Ichimoku

**Route:** `/analysis/ichimoku`  
**Overview:** tidak  
**Default:** Tenkan 9, Kijun 26, Senkou B 52, pergeseran awan 26. PDF tidak mengubah angka ini.

```
tenkan = (highest high(9) + lowest low(9)) / 2
kijun = (highest high(26) + lowest low(26)) / 2
senkou_a = (tenkan + kijun) / 2   # digeser +26
senkou_b = (highest high(52) + lowest low(52)) / 2   # digeser +26
chikou = close digeser -26
```

| Kode | Keadaan |
|---|---|
| ICHI1 | Close memotong Kijun ke atas |
| ICHI2 | Close memotong Tenkan ke atas |
| ICHI3 | Close memotong Kijun ke bawah |
| ICHI4 | Close memotong Tenkan ke bawah |
| ICHI5 | Close menembus batas atas awan |
| ICHI6 | Close menembus batas bawah awan |
| ICHI7 | Close di atas awan |
| ICHI8 | Close di bawah awan |
| ICHI9 | Close di dalam awan |
| ICHI10 | Tenkan di atas awan |
| ICHI11 | Tenkan di bawah awan |
| ICHI12 | Tenkan di dalam awan |
| ICHI13 | Kijun di atas awan |
| ICHI14 | Kijun di bawah awan |
| ICHI15 | Kijun di dalam awan |
| ICHI16 | Tenkan memotong Kijun ke atas |
| ICHI17 | Tenkan memotong Kijun ke bawah |
| ICHI18 | Senkou span (awan) — lanjutkan deret PDF: harga vs future cloud |
| ICHI41 | Awan masa depan merah (`senkou_a < senkou_b` pada pergeseran depan) |
| ICHI42 | Awan masa depan hijau (`senkou_a > senkou_b`) |

ICHI19–ICHI40 di PDF adalah variasi posisi Senkou / Chikou pada keluarga yang sama. Halaman menampilkan satu panel keadaan (harga vs awan, Tenkan vs Kijun, warna awan depan) supaya 42 kode tidak menjadi 42 kartu terpisah. Daftar kode tetap ada di tabel agar screening PDF bisa dipetakan.

---

## 5. Guppy MMA

**Route:** `/analysis/guppy`  
**Overview:** tidak

Short EMA (trader): 3, 5, 8, 10, 12, 15.  
Long EMA (investor): 30, 35, 40, 45, 50, 60.

```
mean_short = rata-rata keenam short EMA
mean_long = rata-rata keenam long EMA
```

| Kode | Keadaan |
|---|---|
| G1 | `close > mean_short` DAN `mean_short > mean_long` |
| GOBULL | Guppy oscillator di wilayah positif |
| GOBEAR | Guppy oscillator di wilayah negatif |
| GOGC | Oscillator memotong ke atas (golden cross) |
| GODC | Oscillator memotong ke bawah (death cross) |

Guppy oscillator pada implementasi: `mean_short - mean_long` (selisih dua rata-rata grup). PDF tidak menuliskan rumus oscillator terpisah; selisih grup adalah definisi yang konsisten dengan G1.

---

## 6. Minervini Trend Template

**Route:** `/analysis/minervini`  
**Overview:** ya, sebagai skor `terpenuhi / 8`  
**MVF:** ditunda. PDF memakai skor fundamental; data fundamental proyek belum mencakup seluruh rasio template.

Template harga (skor 100 = delapan butir terpenuhi). Ini template Mark Minervini yang dipakai bot (`/MV`, `/SCORE MV1–MV3`); PDF tidak mengulang delapan kalimatnya:

1. Harga di atas MA150 dan MA200
2. MA150 di atas MA200
3. MA200 naik minimal 1 bulan (20 bar)
4. MA50 di atas MA150 dan MA200
5. Harga di atas MA50
6. Harga minimal 30% di atas low 52 minggu
7. Harga dalam 25% dari high 52 minggu
8. Relative strength positif terhadap indeks acuan (IHSG / pembanding yang sama dengan overview)

| Kode | Keadaan |
|---|---|
| MV1 | Skor template 100 dan close hari ini > close kemarin |
| MV2 | Skor 100 dan close hari ini < close kemarin |
| MV3 | Skor 100 dan close tidak berubah |

---

## 7. Turtle

**Route:** `/analysis/turtle`  
**Overview:** tidak

Sistem klasik yang cocok dengan nama TS1/TS2 di PDF:

| Sistem | Masuk | Keluar (keadaan, bukan perintah) |
|---|---|---|
| System 1 (TS1) | Close menembus highest high 20 bar | Close menembus lowest low 10 bar |
| System 2 (TS2) | Close menembus highest high 55 bar | Close menembus lowest low 20 bar |

| Kode | Keadaan |
|---|---|
| TS1 | Breakout 20-bar high pada bar terakhir |
| TS2 | Breakout 55-bar high pada bar terakhir |
| TS3 | Close berada ≤ 2,75% di bawah upper channel System 1 (`highest high 20`) |
| TS4 | TS3 dan upper channel datar (high 20-bar tidak naik pada beberapa bar terakhir, default 3 bar) |

---

## 8. Donchian Channel

**Route:** `/analysis/donchian`  
**Overview:** tidak  
**Periode PDF:** 20.

```
upper = highest high(20)
lower = lowest low(20)
mid = (upper + lower) / 2
```

| Kode | Keadaan |
|---|---|
| DCM1 | Close menembus mid dari bawah |
| DCM2 | Close menembus mid dari atas |

Turtle memakai kanal Donchian juga, tetapi PDF memisahkan DCM sebagai screening midline. Halaman Donchian tetap sendiri; Turtle hanya menautkan “lihat juga Donchian”.

---

## 9. SuperTrend

**Route:** `/analysis/supertrend`  
**Overview:** ya (harga di atas / di bawah garis)

PDF menamai empat keadaan tanpa angka ATR. Default implementasi: ATR 10, pengali 3.

```
basic_upper = (high + low) / 2 + multiplier * ATR
basic_lower = (high + low) / 2 - multiplier * ATR
```

Garis final memakai aturan trailing SuperTrend biasa (upper hanya turun, lower hanya naik, flip saat close menembus).

| Kode | Keadaan |
|---|---|
| ST1 | Flip ke atas baru terjadi (1 bar) — speculative |
| ST2 | Harga di atas garis dan arah naik sudah ≥ 2 bar — confirmed |
| ST3 | Flip ke bawah baru 1 bar — partial |
| ST4 | Harga di bawah garis ≥ 2 bar — confirmed down |

---

## 10. Trading With Pixel

**Route:** `/analysis/pixel`  
**Overview:** ya, tiga kotak warna (hijau / merah)

PDF tidak menerbitkan rumus pewarnaan pixel (metode internal “Trading With Pixel”). Yang tertulis adalah **keadaan yang diamati**:

Tiga pixel = tiga jendela waktu (PDF menyebut garis biru bulanan / downstairs tiga bulan). Implementasi v1 memakai proksi yang eksplisit, sampai rumus pixel asli tersedia:

- Pixel pendek: close vs SMA 5
- Pixel menengah: close vs SMA 20
- Pixel panjang: close vs SMA 60 (atau high bulanan)

Hijau jika close di atas acuan dan acuan naik; merah jika close di bawah dan acuan turun.

| Kode | Keadaan |
|---|---|
| PIX / PIX1 | Ketiga pixel baru hijau pada bar ini |
| PIX2 | Ketiga pixel sudah hijau sejak kemarin |
| PIX3 | Pola downstairs: garis biru (acuan panjang) turun pada jendela ~3 bulan, lalu pixel pendek berbalik |
| PIX4 | Harga di atas high bulanan (garis biru) |
| PIX5 | Ketiga pixel baru merah hari ini |
| PIX6 | Ketiga pixel merah sejak beberapa hari |
| PIX7 | PIX1 dan Guppy oscillator golden cross (lihat §5) |
| PIX8 | Harga menembus low bulanan ke atas |
| PIX9 | PIX1, close > MA20, dan MA20 naik 3 bar |
| PIXNBO | Harga dalam jarak maksimal 5 fraksi dari tepi kotak breakout |

Fraksi harga IDX (untuk PIXNBO): <200 → 1; 200–500 → 2; 500–2000 → 5; 2000–5000 → 10; ≥5000 → 25.

---

## 11. Elder Impulse

**Route:** `/analysis/elder-impulse`  
**Overview:** tidak

```
ema = EMA(close, 13)
hist = MACD histogram (12, 26, 9)
hijau jika ema naik DAN hist naik
merah jika ema turun DAN hist turun
biru jika keduanya tidak searah
```

| Kode | Keadaan |
|---|---|
| EIS | Bar harian terakhir hijau |
| EIS2 | Bar mingguan terakhir hijau (resample OHLC mingguan, rumus yang sama) |

---

## 12. TTM

**Route:** `/analysis/ttm`  
**Overview:** tidak

TTM Squeeze histogram pada implementasi: momentum linreg dari `close - SMA((highest+lowest)/2 + SMA(close))/2` periode 20, disederhanakan sebagai delta momentum yang memotong nol. PDF hanya mensyaratkan histogram menyeberang 0 dan menghitung umur warna.

| Kode | Keadaan |
|---|---|
| TTM1 | Histogram memotong 0 ke atas, umur 1 bar |
| TTM2 | Masih di atas 0, umur 2 bar |
| TTM3 | Masih di atas 0, umur 3 bar |

Squeeze (Bollinger di dalam Keltner) ditampilkan sebagai keadaan tambahan di halaman yang sama karena nama TTM di literatur adalah squeeze + histogram. PDF sendiri hanya menyebut umur histogram biru muda.

---

## 13. Heiken Ashi

**Route:** `/analysis/heiken-ashi`  
**Overview:** tidak  
**Pendamping PDF:** EMA 20, volume MA 26.

```
HA_close = (open + high + low + close) / 4
HA_open = (HA_open_prev + HA_close_prev) / 2
HA_high = max(high, HA_open, HA_close)
HA_low = min(low, HA_open, HA_close)
```

| Kode | Keadaan |
|---|---|
| H1 | HA baru berbalik naik (HA_close > HA_open setelah bar sebelumnya turun) — speculative |
| H2 | HA naik dan close HA di atas EMA 20 |
| H3 | HA naik tetapi badan mengecil vs 3 bar sebelumnya — netral |
| H4 | HA berbalik turun (HA_close < HA_open) |

---

## 14. Fibonacci

**Route:** `/analysis/fibonacci`  
**Overview:** tidak

Dua jangkar dari PDF: swing 90 hari (`FIBO90`) dan 365 hari (`FIBO365`).

```
swing_high = highest high(N)
swing_low = lowest low(N)
# uptrend (LHFIBO90): low di kiri, high di kanan
level(r) = swing_high - (swing_high - swing_low) * r
# downtrend (HLFIBO90): high di kiri, low di kanan
level(r) = swing_low + (swing_high - swing_low) * r
```

Rasio: 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1. Kode level `X` pada `BOFIBO90;X` memetakan urutan itu (X=4 ≈ 0.618, sesuai contoh breakout 61.8% di bagian /SCORE PDF).

| Kode | Keadaan |
|---|---|
| AFIBO90 | Jarak close dari level 0 dalam persen, filter X%–Y% |
| BOFIBO90 | Close menembus level X ke atas |
| FIBO90 / FIBO365 | Harga berada di zona retrace jendela 90 atau 365 hari |
| GZFIBO90 | Zona “golden” (sekitar 0.618) dengan lebar > 1 satuan harga |
| HLFIBO90 | Jangkar high-ke-low (downtrend) |
| LHFIBO90 | Jangkar low-ke-high (uptrend) |
| RBFIBO90 / RJFIBO90 | Harga baru berbalik di dekat level dan mendekati level berikutnya |
| SLFIBO90 | Harga menempel di level yang dipilih |

---

## 15. Candlestick

**Route:** `/analysis/candlestick`  
**Overview:** tidak (nama pola terakhir saja, jika ada)

### 15.1 Badan dan doji (PDF: CANDLESTICK BODY)

| Kode | Keadaan |
|---|---|
| DOJI | `|close-open| / (high-low) < 0.1` |
| DFDOJI | Doji, low jauh di bawah, high ≈ open/close (dragonfly) |
| GSDOJI | Doji, high jauh di atas (gravestone) |
| DOJISTAR | Doji dengan shadow atas dan bawah hampir simetris |
| FPDOJI | Open = high = low = close |
| DD / DDJ | Dua doji berurutan |
| BULLPB | Pin bar bullish: ekor bawah ≥ 2× badan, close di sepertiga atas |
| BEARPB | Pin bar bearish: ekor atas ≥ 2× badan, close di sepertiga bawah |
| ENBULL | Bullish engulfing: badan hijau menelan badan merah sebelumnya |
| CH / CLOSEHIGH | Close = high (tidak ada upper shadow) |
| HO | High = open |
| IJO | Close > open |
| RED | Close < open |
| GCRV | Badan hijau tetapi volume di bawah volume bar sebelumnya |

### 15.2 Sinyal EOD otomatis

| Kode | Keadaan |
|---|---|
| AC1 | Pola bullish pada bar terakhir |
| AC2 | Pola bearish pada bar terakhir |
| AC3 | Pola bullish dan close naik |
| AC4 | Pola bullish dan close turun |
| AC5 | Pola bullish dan close datar |
| 3M1H | 3 candle merah diikuti 1 hijau |
| 5M1H | 5 candle merah diikuti 1 hijau (teks PDF sempat menulis “3 merah”; implementasi memakai 5 merah + 1 hijau sesuai nama kode) |
| ACREV | Harga masih di zona reversal (dekat low N bar) dan ada pola bullish |
| ANTBULLDIV | Low baru sementara indikator (RSI) tidak membuat low baru |

### 15.3 Katalog pola bernama (CDLBULL / CDLBEAR / CDL live)

Halaman punya satu detektor per nama. Bila beberapa pola cocok, tampilkan semuanya.

Bullish: Hammer, Belt Hold, Engulfing, Harami, Harami Cross, Inverted Hammer, Piercing Line, Doji Star, Meeting Line, Homing Pigeon, Matching Low, Kicking, One White Soldier, Morning Star, Morning Doji Star, Abandoned Baby, Tri Star, Downside Gap Two Rabbits, Unique Three River Bottom, Three White Soldiers, Descent Block, Deliberation Block, Two Rabbits, Three Inside Up, Three Outside Up, Three Stars in the South, Stick Sandwich, Squeeze Alert, Three Gap Downs, Concealing Baby Swallow, Breakaway, Ladder Bottom, After Bottom Gap Up.

Bearish: Hanging Man, Belt Hold, Engulfing, Harami, Harami Cross, Shooting Star, Dark Cloud Cover, Doji Star, Meeting Line, Descending Hawk, Matching High, Kicking, One Black Crow, Evening Star, Evening Doji Star, Abandoned Baby, Tri Star, Upside Gap Two Crows, Unique Three Mountain Top, Three Black Crows, Advance Block, Deliberation Block, Two Crows, Three Inside Down, Three Outside Down, Squeeze Alert, Three Gap Ups, Breakaway, Ladder Top, After Top Gap Down.

Live (`/CDLxx`) menambah: Three-Line Strike, Closing Marubozu, Counterattack, High-Wave, Hikkake, Identical Three Crows, In-Neck, Long Legged Doji, Long Line, Marubozu, Mat Hold, On-Neck, Rickshaw Man, Rising/Falling Three Methods, Separating Lines, Short Line, Spinning Top, Stalled Pattern, Tasuki Gap, Thrusting, Upside/Downside Gap Three Methods.

Rumus tiap pola mengikuti definisi standar badan/ekor (TA-Lib). Jangan menyalin teks tutorial PDF.

---

## 16. Moving Average

**Route:** `/analysis/moving-average`  
**Overview:** ya, cross terakhir saja  
**Preset periode PDF:** 2, 3, 5, 8, 10, 13, 15, 20, 25, 30, 34, 40, 50, 60, 100, 150, 200 untuk SMA dan EMA.

| Kode | Keadaan |
|---|---|
| SMAGC short,long | SMA(short) memotong SMA(long) ke atas. Contoh PDF: 5 dan 20 |
| EMAGC | Sama untuk EMA |
| PASMA n | Close di atas SMA(n) |
| PAEMA n | Close di atas EMA(n) |
| MACD-style death | SMA pendek memotong panjang ke bawah |
| RMA n | Close hari ini memantul dari SMA(n) (low menyentuh garis, close kembali di atas) |

Golden cross dan death cross yang sudah ada di dashboard (MA20/MA50) tetap. Halaman ini yang menampilkan seluruh preset.

---

## 17. ADX

**Route:** `/analysis/adx`  
**Overview:** tidak  
**Periode:** 14.

```
+DI, -DI, ADX = Wilder 14
```

| Kode | Keadaan |
|---|---|
| ADX1 | ADX > 25 dan +DI > -DI |
| ADX2 | +DI memotong -DI ke atas |

---

## 18. MACD

**Route:** `/analysis/macd`  
**Overview:** ya  
**Parameter PDF:** 12, 26, 9.

| Kode | Keadaan |
|---|---|
| MACDGC | Garis MACD memotong signal ke atas |
| MACDGCA | Cross itu terjadi di atas 0 |
| MACDGCB | Cross itu terjadi di bawah 0 |
| MACDDC | Garis MACD memotong signal ke bawah |
| MACDDCA | Death cross di atas 0 |
| MACDDCB | Death cross di bawah 0 |
| NGCMACD | Proyeksi: jarak harga ke titik cross berikutnya ≤ 10 fraksi (opsional, butuh ekstrapolasi; v1 boleh hanya melaporkan jarak histogram ke 0) |

---

## 19. RSI

**Route:** `/analysis/rsi`  
**Overview:** ya  
**Default:** RSI 14. Periode yang didukung PDF: 2, 10, 14. Level 2–99, default contoh 20 atau 40.

| Kode | Keadaan |
|---|---|
| BLRSI level | RSI memotong atau menyentuh level dari atas (contoh 40) |
| BURSI level | RSI memotong level dari bawah |
| RSIA | RSI berada di atas level selama N hari |
| (zona) | RSI < 30 oversold, RSI > 70 overbought — sudah dipakai alert engine |

---

## 20. Stochastic

**Route:** `/analysis/stochastic`  
**Overview:** tidak  
**Default backtest PDF:** `%K 14, %D 3, smooth 3`. Level GC contoh: 30. Periode screening: 5, 10, 14, 20, 40, 60, 80, 100, 120.

| Kode | Keadaan |
|---|---|
| KSTO | %K berada di antara min dan max |
| DSTO | %D berada di antara min dan max |
| JSTOGC | %K sudah di atas %D dan selisih K−D berada di rentang yang diminta |
| GC di bawah level | %K memotong %D ke atas saat keduanya < level (contoh 30) |

Urutan filter di PDF mengubah makna (K dulu vs D dulu). Halaman cukup menampilkan nilai %K, %D, dan apakah cross terakhir naik atau turun.

---

## 21. CCI

**Route:** `/analysis/cci`  
**Overview:** tidak  
**Periode:** 20.

| Kode | Keadaan |
|---|---|
| CCI1 | CCI memotong -100 ke atas |
| CCI2 | CCI memotong -100 ke bawah |
| CCI3 | CCI memotong 100 ke atas |
| CCI4 | CCI memotong 100 ke bawah |
| CCI5 | CCI memotong 0 ke atas |
| CCI6 | CCI memotong 0 ke bawah |

---

## 22. MFI

**Route:** `/analysis/mfi`  
**Overview:** tidak  
**Periode:** 14.

| Kode | Keadaan |
|---|---|
| BLMFI | MFI memotong level X ke bawah (contoh 30) |
| BUMFI | MFI memotong level X ke atas (contoh 50) |
| MFI1 | MFI < 20 |
| MFI2 | MFI memotong 20 ke atas |
| MFI3 | MFI > 80 |
| MFI4 | MFI memotong 80 ke bawah |

---

## 23. CMF

**Route:** `/analysis/cmf`  
**Overview:** tidak  
**Periode:** 20 (Chaikin Money Flow standar; PDF tidak mengubah periode).

```
mf_multiplier = ((close-low) - (high-close)) / (high-low)
mf_volume = mf_multiplier * volume
CMF = sum(mf_volume, 20) / sum(volume, 20)
```

| Kode | Keadaan |
|---|---|
| CMF1 | CMF memotong 0 ke atas pada bar ini |
| CMF2 | CMF di atas 0 selama 2 bar, cross pada bar ke-2 |
| CMF3 | Sama, umur 3 bar |
| CMF4 | Umur 4 bar |
| CMF5 | Umur 5 bar |

---

## 24. TRIX

**Route:** `/analysis/trix`  
**Overview:** tidak  
**Periode PDF:** default 14, alternatif 8.

```
TRIX = 1-bar percent change of EMA(EMA(EMA(close, n), n), n)
signal = SMA(TRIX, 9)
```

| Kode | Keadaan |
|---|---|
| GCTRIX | TRIX memotong signal ke atas |
| RGCTRIX | Cross naik itu terjadi dalam 4 bar terakhir |
| CZTRIX | TRIX memotong 0 ke atas |
| AZTRIX | TRIX sudah di atas 0, cross 0 dalam 4 bar terakhir |

---

## 25. Vortex

**Route:** `/analysis/vortex`  
**Overview:** tidak  
**Periode:** 14.

```
VM+ = |high - low_prev|
VM- = |low - high_prev|
TR = true range
VI+ = sum(VM+, 14) / sum(TR, 14)
VI- = sum(VM-, 14) / sum(TR, 14)
```

| Kode | Keadaan |
|---|---|
| GCVX | VI+ memotong VI- ke atas |

---

## 26. SMI Ergodic

**Route:** `/analysis/smi`  
**Overview:** tidak

PDF menyebut indikator ini sebagai keluarga screening (bagian SMI ERGODIC) tanpa parameter angka di teks yang terekstrak. Rumus implementasi:

```
SMI Ergodic = TSI-style double smooth dari (close - close_prev)
default: panjang 20, pendek 5, signal 5
```

Keadaan yang ditampilkan: garis di atas/bawah 0, dan cross terhadap signal. Jika teks PDF tidak cukup untuk memetakan kode perintah 1:1, halaman tetap ada dengan kedua keadaan itu dan kode bot ditandai “parameter tidak tercetak di PDF”.

---

## 27. Parabolic SAR

**Route:** `/analysis/parabolic-sar`  
**Overview:** tidak  
**Default backtest PDF:** step 0.02, max 0.2.

| Kode | Keadaan |
|---|---|
| PSAR1 | Titik SAR berpindah ke bawah candle (arah naik) |
| PSAR2 | Titik SAR berpindah ke atas candle (arah turun) |
| PSAR3 | PSAR1 dan nilai transaksi bar ≥ ambang (PDF: Rp 1 miliar; di app ini opsional karena volume Yahoo tidak selalu dalam rupiah) |

---

## 28. Trend structure

**Route:** `/analysis/trend`  
**Overview:** ya, label HHHL / lower-low / sideways

| Kode | Keadaan |
|---|---|
| HH3 / HH5 | N bar berturut-turut higher high dan badan hijau |
| HHHL | High terakhir > high sebelumnya, low terakhir > low sebelumnya, volume terakhir > volume sebelumnya |
| HHBREAK | Close menembus highest high N hari |
| LL3 / LL5 | N bar lower low dan badan merah |
| NLL | Setelah N candle merah, belum ada low baru |
| TRU | Kemiringan regresi linier close positif. PDF: sudut X0 pada Y hari. Contoh `TRU 45 30` = kemiringan 45 pada 30 bar |
| TRD | Kemiringan negatif. Contoh PDF: −300 pada 60 hari |
| TRS | Sideways. Default kemiringan dalam ±50 pada 10 hari. Periode yang disebut: 10, 20, 30, 60, 90 |

Kemiringan = sudut derajat dari regresi `close` terhadap indeks bar, diskalakan agar angka PDF (±50, 450, −300) tetap menjadi ambang, bukan prediksi harga.

Filter harga ekstrem yang PDF letakkan di bagian HARGA ikut di halaman ini sebagai subsection, karena mereka mengukur level bukan sistem terpisah:

| Kode | Keadaan |
|---|---|
| HBO | Close menembus high N hari (default 5) |
| HIGHDROP | Turun X%–Y% dari highest high dalam N hari bursa |
| LOWRISE | Naik X%–Y% dari lowest low dalam N hari bursa |
| HSTATS / LSTATS | Harga = ekstrem jendela: 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ATH |
| CAPH | Close > high kemarin |
| NBATH | Dekat all-time high (dalam 2% kecuali PDF menentukan lain) |

---

## 29. Support & Resistance

**Route:** `/analysis/support-resistance`  
**Overview:** ya, jarak ke S1 dan R1 plus jarak 52-week

### 29.1 Pivot klasik (`/P`, PR/PS)

```
P = (high_prev + low_prev + close_prev) / 3
R1 = 2P - low_prev
S1 = 2P - high_prev
R2 = P + (high_prev - low_prev)
S2 = P - (high_prev - low_prev)
R3 = high_prev + 2(P - low_prev)
S3 = low_prev - 2(high_prev - P)
```

| Kode | Keadaan |
|---|---|
| PS / PR | Close di sekitar pivot, sisi support atau resistance (toleransi 0,5%) |
| PS1 PR1 | Di sekitar S1 / R1 |
| PS2 PR2 | Di sekitar S2 / R2 |
| PS3 PR3 | Di S3 atau lebih rendah / di R3 atau lebih tinggi |

### 29.2 Camarilla

Disebut di `/HELPSR` sebagai support-resistance harian. Rumus:

```
range = high_prev - low_prev
R1 = close_prev + range * 1.1/12
R2 = close_prev + range * 1.1/6
R3 = close_prev + range * 1.1/4
R4 = close_prev + range * 1.1/2
S1..S4 = close_prev - jarak yang sama
```

### 29.3 Polynomial regression channel (`/PRC`)

Regresi polinomial derajat 2 pada close N bar (default 60). Garis tengah = fitted value. Batas atas/bawah = fitted ± 2 deviasi residual.

| Kode | Keadaan |
|---|---|
| PRCLOW | Close menembus batas bawah kanal |
| PRC2 | Close berada di bawah garis tengah beberapa hari |

### 29.4 52 minggu

| Kode | Keadaan |
|---|---|
| H52W | Close = high 52 minggu |
| L52W | Close = low 52 minggu |
| NH52W / NB52W | Dalam 2% di bawah high 52 minggu |
| NL52W | Dalam 2% di atas low 52 minggu |
| REV52W | Berbalik dari low 52 minggu: close > low 52w dan close > close kemarin, jarak ke low < 5% |

### 29.5 Tebas

`/TEBAS`: support/resistance berbasis volume. Default MA volume 20 dan pengali 1,5. Level = harga pada bar yang volumenya > 1,5 × MA volume, dikelompokkan ke zona terdekat. Parameter bisa diganti (contoh PDF: 30 dan 2).

---

## 30. Volume & Pressure

**Route:** `/analysis/volume-pressure`  
**Overview:** tidak  
Tanpa data broker (net buy, kuadran, clean buy). Itu ada di lampiran.

### 30.1 Tekanan

PDF tidak menulis rumus BPR. Proksi yang eksplisit:

```
buyer = volume * (close - low) / (high - low)
seller = volume * (high - close) / (high - low)
rasio = buyer / seller
```

| Kode | Keadaan |
|---|---|
| BPR n | Rasio buyer/seller ≥ n |
| SPR n | Rasio seller/buyer ≥ n |
| BSPRES n | Buyer > seller selama n hari berturut-turut |
| SBPRES n | Seller > buyer selama n hari |

### 30.2 Volume

Periode rata-rata yang disebut PDF: 3, 5, 20, 26, 30, 50, 60, 100.

| Kode | Keadaan |
|---|---|
| VSPIKE1 | Close naik dan volume > 2 × MA volume |
| VSPIKE2 | Close turun dan volume > 2 × MA volume |
| HV | Volume hari ini > volume kemarin |
| VASMA n | Volume > MA volume n |
| XVOL | Volume beberapa hari di atas rata-rata (contoh `XVOL;3;20`: 3 hari, MA 20) |

Equivolume (lebar bar = volume) adalah mode tampilan chart di halaman ini, bukan sinyal terpisah.

---

## 31. Gap

**Route:** `/analysis/gap`  
**Overview:** tidak

```
gap up = low hari ini > high kemarin
gap down = high hari ini < low kemarin
masih terbuka = belum ada bar kemudian yang menutup celah
```

| Kode | Keadaan |
|---|---|
| GAP1 | Gap up pada bar terakhir |
| GAP2 | Gap down pada bar terakhir |
| CNTGU / OGU | Gap up masih terbuka dalam 240 bar |
| CNTGD / OGD | Gap down masih terbuka dalam 240 bar |

---

## 32. Di luar sub-menu chart

Perintah berikut ada di PDF dan **tidak** menjadi halaman Analysis, karena butuh data yang bukan OHLC Yahoo:

| Kelompok | Contoh perintah | Alasan |
|---|---|---|
| Akumulasi broker | `/AB`, `/AS`, `/NBSRATIO`, `/TBD`, `/BQ`, `/CLNBUY` | Buku broker IDX |
| Distribusi | lawan dari akumulasi, domestik vs asing | Buku broker |
| Pasar nego | `/CR` | Papan nego |
| Warrant | `/STW` | Instrumen terpisah |
| IPO | `/IPO`, `/UW` | Data listing |
| Forex | bagian FOREX | Bukan harga saham tunggal di overview |
| Seasonality | `/WD` weekly diary | Bisa menyusul; bukan sistem indikator |
| Frequency | `/FQ`, `/MFQ` | Butuh tick/menit |
| Backtest bot | `/BTEST` | Mesin uji terpisah, bukan tampilan analisis |
| Money management | `/MM` | Kalkulator lot, bukan sinyal |
| Fundamental bot | `/FC`, `/DV`, dividen | Sudah ada jalur fundamental di Overview; skor MVF menyusul di Minervini |
| Index bull/bear | `/BBIDX`, `/MAP` | Widget pasar, bukan analisis satu simbol |

---

## 33. Bentuk halaman (semua sub-menu)

1. Simbol mengikuti Overview.
2. Blok rumus: angka terkini (garis, level, atau skor).
3. Tabel keadaan: kode PDF, terpenuhi atau tidak pada bar terakhir.
4. Tidak ada tombol order.
5. Teks kaki: keadaan indikator untuk riset, bukan ajakan transaksi.

Endpoint nanti (saat implementasi, di luar dokumen ini): `GET /api/analysis/strategy/{slug}/{symbol}` mengembalikan nilai rumus dan daftar keadaan. Satu slug per baris tabel §1.
