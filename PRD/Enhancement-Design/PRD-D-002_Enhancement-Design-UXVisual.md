# Enhancement — Redesign UI/UX (Bagian 1: Visual & Business)

> **Versi Dokumen:** 1.0
> **Terkait:** `PRD/PRD.md`, `PRD/Documentation-Business.md`, mockup referensi "Trading Monitor" (9 layar)
> **Dokumen pasangan:** `Enhancement-Design-2-Technical.md` (implementasi teknis)
> **Status:** ✅ Diimplementasikan (rilis pertama UI redesign)
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Desainer, Product Owner, Frontend Developer

---

## 1. Latar Belakang

Dashboard saat ini (`ai-trading-dashboard/frontend`, Tahap 2) sudah punya tema dark analytical,
tapi cakupannya baru **satu halaman tunggal** (watchlist + chart + news di satu route `/`) tanpa
onboarding, landing page, atau layar autentikasi. Mockup referensi ("Trading Monitor") menunjukkan
produk yang lebih lengkap sebagai **aplikasi bermerek (branded product)** dengan 9 layar:

1. Onboarding (3 slide)
2. Landing Page (marketing/publik)
3. Login / Sign Up
4. Trading Monitor Dashboard (ringkasan pasar + top gainers + berita)
5. Sub-menu Analysis (overview + gauge skor + key indicators + support/resistance)
6. Watchlist (tabel multi-kategori: My Watchlist / Tech Stocks / Crypto / Forex)
7. Chart (candlestick + MA + RSI + MACD, kontrol timeframe di toolbar atas)
8. News (tab Top/Market/My News, kartu berita dengan thumbnail)
9. Analysis Detail (radar chart, moving averages, rekomendasi jangka pendek/menengah/panjang)

Enhancement ini menyelaraskan **desain visual & informasi arsitektur** produk dengan mockup
tersebut, sekaligus tetap konsisten dengan batasan bisnis yang sudah ada di
`Documentation-Business.md` (bukan nasihat finansial, disclaimer wajib tampil).

---

## 2. Tujuan Redesign

1. Menaikkan kesan produk dari "dashboard riset internal" menjadi **produk SaaS bermerek** yang
   siap dipasarkan (selaras Tahap 3 — subscription & billing).
2. Menyediakan **flow lengkap pengguna baru**: onboarding → landing → daftar/login → dashboard.
   Saat ini flow ini belum ada — pengguna langsung mendarat di watchlist tanpa konteks produk.
3. Memisahkan **dashboard ringkasan pasar** (overview) dari **detail per-simbol** (chart/analysis),
   sesuai mockup, supaya pengguna dapat gambaran makro sebelum masuk ke satu simbol.
4. Menstandardisasi desain (warna, tipografi, radius, spacing) lewat design token tunggal supaya
   konsisten di semua layar baru maupun lama.

### 2.1 Non-Goals
- Tidak mengubah logic data/indikator teknikal (`technical.py`) — murni perubahan presentasi.
- Tidak mengimplementasikan autentikasi/backend sungguhan di dokumen ini — layar Login/Sign Up
  didesain sebagai **UI shell**; wiring ke JWT/Supabase mengikuti roadmap Tahap 2 lanjutan yang
  sudah ada di `Documentation-Program.md` §7.5 & §8.
- Tidak mengubah model bisnis/harga — mengikuti `Documentation-Business.md` apa adanya.

---

## 3. Bahasa Desain (Design Language)

### 3.1 Tipografi

| Peran | Font | Catatan |
|---|---|---|
| UI utama (heading, body, label, tombol) | **Plus Jakarta Sans** | Ganti dari `Inter` yang dipakai versi Tahap 2 saat ini. Alasan: bentuk huruf lebih geometris-modern, selaras kesan "fintech premium" pada mockup. |
| Data numerik (harga, tabel, angka indikator) | `JetBrains Mono` (tetap dipertahankan) | Angka finansial tetap pakai monospace supaya kolom rapi (`tabular-nums`) — tidak berubah dari implementasi sekarang. |

Skala ukuran (mengikuti kepadatan data ala terminal trading, bukan tampilan lapang):

| Token | Ukuran | Pemakaian |
|---|---|---|
| `display` | 32–40px / 700 | Judul hero di Landing Page |
| `h1` | 24px / 600 | Judul halaman (Dashboard, Watchlist, dst.) |
| `h2` | 16px / 600 | Judul panel/card |
| `body` | 13px / 400 | Teks umum |
| `label` | 11px / 500, uppercase, letter-spacing wide | Header tabel, label kategori |
| `data-lg` | 20–24px / 600, mono | Harga utama di header simbol |
| `data-sm` | 11–12px / 500, mono | Angka dalam tabel dense |

### 3.2 Palet Warna

Mengikuti brief yang diberikan — **tidak berubah** dari token yang sudah ada di
`tailwind.config.js` versi Tahap 2, hanya diformalkan sebagai satu sumber kebenaran:

| Token | Hex | Pemakaian |
|---|---|---|
| `canvas` (background utama) | `#0E1117` | Deep navy-charcoal, latar seluruh halaman |
| `panel` | `#161B22` | Card, sidebar, tabel, panel chart |
| `panel-hover` | `#1C222C` | State hover baris/tombol di atas panel |
| `border` | `#2A313C` | Border antar elemen (subtle grey) |
| `border-muted` | `#1F252E` | Divider tipis dalam panel |
| `text-primary` | `#F0F3F6` | Teks utama |
| `text-secondary` | `#8B949E` | Teks sekunder/deskripsi |
| `text-muted` | `#5C6673` | Placeholder, caption, label tidak aktif |
| `positive` (accent) | `#00E676` | Neon green — kenaikan harga, status "Buy/Bullish", highlight aktif, fokus ring |
| `negative` | `#FF5252` | Merah — penurunan harga, status "Sell/Bearish" |
| `action-primary` | `#FFFFFF` | Tombol aksi utama (Get Started, Login, Sign Up) — teks gelap di atasnya |
| `neutral` | `#8B949E` | Status netral (RSI netral, sinyal campuran) |

**Prinsip pemakaian aksen** (dari observasi mockup):
- **Hijau neon (`positive`)** dipakai luas untuk: tombol CTA sekunder ("Get Started Free"),
  indikator status baik (Uptime 99.9%, badge "Strong Buy", garis chart naik, tab aktif).
- **Putih (`action-primary`)** dipakai khusus untuk tombol paling penting per layar (Login, Sign Up,
  Next di onboarding) — kontras maksimal di atas background gelap, dan menghindari dua CTA hijau
  bersaing dalam satu layar.
- Merah **hanya** untuk data negatif (harga turun, sell signal) — tidak pernah dipakai sebagai
  warna UI dekoratif, supaya sinyal risiko tetap jelas ("traffic light" logic).

### 3.3 Bentuk & Spacing

| Aspek | Nilai | Catatan |
|---|---|---|
| Radius kartu/panel | `8px` (`rounded-md`) | Sudut tajam-sedang, bukan pill/full-round — kesan "terminal", bukan konsumen kasual |
| Radius tombol/input/badge | `4–6px` (`rounded-sm`/`rounded`) | Konsisten dengan token lama, dipertahankan |
| Border | `1px solid border` | Subtle, tidak pernah drop-shadow tebal (dark UI mengandalkan kontras luminance, bukan shadow) |
| Baris tabel | Dense, padding vertikal `6–8px` | Sesuai prinsip "dense, data-focused layout" dari brief |
| Grid dashboard | 12-kolom, gap `16–20px` | Card metrik (Market Cap, 24h Volume, dst.) tersusun dalam grid responsif |

---

## 4. Inventaris Layar & Perubahan per Halaman

Referensi nomor sesuai mockup.

### 4.1 Onboarding (layar 1) — **BARU**
- 3 slide carousel: (1) value prop utama, (2) fitur watchlist, (3) fitur analisis mendalam.
- Tiap slide: ilustrasi ringkas (ikon/preview mini chart), judul singkat, 1 kalimat deskripsi.
- Indikator dot di bawah + tombol `Next` (hijau neon) → slide terakhir jadi `Get Started`.
- Hanya tampil sekali per device (state disimpan di `localStorage`, mirip pola watchlist saat ini).

### 4.2 Landing Page (layar 2) — **BARU**
- Navbar publik: logo, `Features / Markets / Pricing / About / Contact`, tombol `Log In` (outline)
  + `Get Started` (putih solid).
- Hero: judul besar "Monitor Market. Analyze Smarter. Trade Better.", sub-copy, 2 CTA
  (`Get Started Free` hijau, `Watch Demo` outline), preview dashboard di kanan (screenshot/mock UI).
- Strip statistik: `50K+ Active Users`, `150+ Markets`, `99.9% Uptime`, `24/7 Support` — 4 kolom.
- **Catatan kepatuhan:** angka-angka ini adalah placeholder marketing, harus diganti data riil atau
  dihapus sebelum go-live — selaras catatan legal di `Documentation-Business.md` §5.

### 4.3 Login / Sign Up (layar 3) — **BARU (UI shell)**
- Dua kartu terpisah berdampingan (atau 2 route `/login`, `/signup`), form minimal: email, password
  (+ nama & confirm untuk sign up), tombol utama putih solid, link "atau lanjutkan dengan"
  Google/Apple/Microsoft (ikon saja, opsional aktif belakangan).
- Link silang "Belum punya akun? Sign Up" / "Sudah punya akun? Login".
- Tidak ada validasi/backend di enhancement ini — form disiapkan sebagai UI, wiring JWT menyusul
  sesuai roadmap Tahap 2 lanjutan.

### 4.4 Trading Monitor Dashboard (layar 4) — **BARU, menggantikan halaman utama saat ini**
Halaman ini **baru** dibanding implementasi sekarang (yang langsung menampilkan watchlist+chart).
Berisi ringkasan makro pasar sebelum user masuk ke simbol tertentu:
- Ticker bar atas: index utama (`S&P 500`, `DOW 30`, `NASDAQ`, `BTCUSD`) dengan `%` naik/turun.
- Sidebar navigasi kiri: `Dashboard, Watchlist, Chart, News, Analysis, Alerts, Portfolio, Settings,
  Help & Support` + profil user di bawah (avatar, nama, tier plan — relevan untuk Tahap 3).
- Panel `Market Overview`: mini line chart index pilihan + dropdown periode.
- Panel `Top Gainers`: tabel ringkas 4–5 simbol top mover.
- Strip metrik: `Market Cap`, `24h Volume`, `BTC Dominance`, `Fear & Greed` index.
- Panel `Cryptocurrency`: tabel harga crypto utama.
- Panel `Recent News`: 3 berita ringkas.

> **Gap data:** endpoint index global, top gainers, market cap/dominance, dan fear-greed index
> **belum ada** di backend saat ini (lihat `Enhancement-Design-2-Technical.md` §3 untuk daftar API
> baru yang dibutuhkan).

### 4.5 Sub-menu Analysis Overview (layar 5) — **BARU**
- Layout 2 kolom: kiri navigasi sidebar yang sama, kanan konten analisis untuk satu simbol terpilih.
- Gauge skor "76 — Strong Buy" (radial gauge, warna dari merah→kuning→hijau).
- Baris `Moving Averages`, `RSI (14)`, `MACD (12,26,9)`, `Stochastic (14,3,3)`, `ADX (14)` dengan
  kolom Value + badge Signal (Buy/Sell/Neutral berwarna).
- Panel `Support & Resistance` (2 level tiap arah).
- **Ini adalah versi UI baru dari fungsi `simple_signal()` yang sudah ada** — bukan indikator baru,
  hanya presentasi lebih kaya (skor gauge, badge per-indikator, bukan satu kalimat ringkasan).
- ⚠️ Tetap harus menampilkan disclaimer "bukan rekomendasi finansial" — badge "Buy/Sell" di layar
  ini rawan disalahartikan sebagai rekomendasi eksplisit; wajib review dengan
  `Documentation-Business.md` §5 sebelum dipakai produksi (lihat juga batasan di
  `Documentation-Program.md` §4.3 soal `simple_signal()`).

### 4.6 Watchlist (layar 6) — **Perluasan dari `WatchlistTable.tsx` saat ini**
- Tab kategori di atas tabel: `My Watchlist / Tech Stocks / Crypto / Forex` — pengelompokan baru,
  saat ini watchlist bersifat flat (semua simbol dalam satu list).
- Tombol `+ Add Symbol` di kanan atas (fungsinya sama dengan pencarian di `Sidebar.tsx` sekarang,
  dipindah jadi modal/dropdown alih-alih permanen di sidebar).
- Kolom tambahan: `Market Cap` (butuh data baru dari `yfinance` info, belum diekspos di
  `QuoteSnapshot` saat ini).

### 4.7 Chart (layar 7) — **Perluasan dari `CandlestickChart.tsx` saat ini**
- Toolbar timeframe langsung di atas chart (`1D 5D 1M 3M 6M YTD 1Y 5Y ALL`) + tombol `Indicators`
  (dropdown untuk toggle MA/RSI/MACD/Bollinger, bukan checkbox tunggal seperti sekarang).
- Header chart menampilkan `MA 50 close` & `MA 200 close` sebagai anotasi angka, bukan hanya garis.
- Toolbar alat gambar di kiri (crosshair, garis trend, dll.) — **opsional/fase lanjutan**, tidak
  wajib di rilis pertama redesign karena `lightweight-charts` v4 mendukungnya tapi butuh effort
  tersendiri (lihat `Enhancement-Design-2-Technical.md` §5).
- Tetap 3 panel (Harga/RSI/MACD) — sinkronisasi crosshair sudah ada, dipertahankan.

### 4.8 News (layar 8) — **Perluasan dari `NewsPanel.tsx` saat ini**
- Tab filter: `Top News / Market News / My News / All`.
- Kartu berita dengan thumbnail gambar (bukan hanya teks) — sumber gambar dari `yfinance`
  (`content.thumbnail`, jika tersedia) atau placeholder generik per publisher.
- Layout tetap list vertikal dense, konsisten dengan tema.

### 4.9 Analysis Detail (layar 9) — **BARU**
- Header pemilihan simbol + toggle periode (`1D/1W/1M`).
- Panel `Trend` (Uptrend/Downtrend) + `Strength` (Strong/Weak) — turunan dari `simple_signal()`.
- Radar chart 5 sumbu: `Price Action, Volume, Momentum, Trend, Volatility` — **fitur analisis baru**,
  butuh perhitungan skor 0–100 per sumbu di backend (belum ada di `technical.py` saat ini).
- Panel `Moving Averages` (MA20/50/100/200 + badge Buy/Sell per baris) — MA100/200 belum dihitung
  di `add_all_indicators()` saat ini (baru MA20/MA50).
- Panel `Summary` (paragraf naratif) + `Recommendations` (Short/Mid/Long Term) — **kembali
  ditegaskan: label "Recommendations" berisiko dari sisi kepatuhan**, harus di-review ulang bahasa
  dan disclaimer-nya sebelum rilis (lih. §4.5 di atas).

---

## 5. Komponen Baru vs. Dipakai Ulang

| Kategori | Dipakai ulang (reuse) | Baru dibuat |
|---|---|---|
| Data & indikator | `technical.py` (MA/EMA/RSI/MACD/BB), `simple_signal()` | Skor gauge 0–100, radar chart 5-sumbu, MA100/200 |
| Chart | `CandlestickChart.tsx` (3-panel lightweight-charts) | Toolbar timeframe atas, dropdown indicators |
| Watchlist | `WatchlistTable.tsx`, `Sidebar.tsx` (search logic) | Tab kategori, modal Add Symbol, kolom Market Cap |
| News | `NewsPanel.tsx` | Tab filter, kartu dengan thumbnail |
| Layout | Design token warna (`tailwind.config.js` sudah sesuai brief) | Sidebar navigasi app-shell, ticker bar index global |
| Halaman | — | Onboarding, Landing, Login, Sign Up, Dashboard ringkasan, Analysis Overview, Analysis Detail |

---

## 6. Metrik Keberhasilan Desain

- Pengguna baru menyelesaikan onboarding → sign up → landing di dashboard tanpa bingung arah
  (diukur lewat funnel drop-off, perlu analytics — di luar cakupan dokumen ini).
- Waktu untuk menemukan chart+indikator simbol tertentu dari dashboard ringkasan ≤ 3 klik.
- Konsistensi visual: 100% layar baru memakai token warna & tipografi di §3, tidak ada warna hex
  hardcode di luar tabel token.

---

## 7. Dokumen Terkait

- `Enhancement-Design-2-Technical.md` — struktur route, komponen, dan API baru yang dibutuhkan.
- `PRD/PRD.md` — status fitur per tahap produk.
- `PRD/Documentation-Business.md` §4–5 — role/akses & batasan kepatuhan yang memengaruhi copy di
  layar Analysis/Dashboard.
- `PRD/Documentation-Program.md` §7 — arsitektur frontend/backend Tahap 2 yang menjadi basis redesign.