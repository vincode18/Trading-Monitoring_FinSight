# Enhancement Design — Dashboard Page v1.1

> **Versi Dokumen:** 1.1 — patch atas `Environment/enhancement-design_DashboardPage_v1.md`, bukan
> penulisan ulang
> **Terkait:** `Environment/enhancement-design_DashboardPage_v1.md` (dokumen induk, §5.2, §5.3,
> §4.5, §4.6)
> **Sumber:** Review screenshot implementasi FinSight Dashboard (tab Indonesia aktif)
> **Status:** 🔜 Diusulkan — belum diimplementasikan
> **Terakhir Diperbarui:** 7 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 0. Catatan Verifikasi terhadap Kode Saat Ini

Sebelum patch ini dikerjakan, perlu ditegaskan satu hal penting hasil pengecekan langsung ke
kode di branch `Development`: **widget yang direview di screenshot (Sector Performance, Market
Movers, Forex, Sentiment Gauge di context Dashboard) belum ada satu pun di kode saat ini** —
tidak ada `SectorHeatmap.tsx`, `MoversPanel.tsx`, `ForexStrip.tsx`, atau endpoint `/sectors`,
`/volume-movers` (dikonfirmasi lewat pencarian menyeluruh di `frontend/components/` dan
`backend/app/api/`). `ScoreGauge.tsx`/`RadarChart.tsx` yang ada saat ini melayani halaman
**Analysis per-simbol**, bukan Sentiment Gauge level-market di Dashboard.

Ini **tidak mengubah substansi** dokumen ini — screenshot yang direview kemungkinan besar adalah
**purwarupa desain/mockup** dari `enhancement-design_DashboardPage_v1.md` (bukan build yang sudah
di-deploy), dan kelima masalah yang ditemukan (§1–§7) tetap valid sebagai catatan desain yang
harus dipegang **saat** widget-widget tersebut mulai diimplementasikan. Dengan kata lain: dokumen
ini berfungsi sebagai **spesifikasi gabungan** (v1 + patch v1.1) untuk dikerjakan sekaligus,
bukan sebagai bug report atas sesuatu yang sudah live. Perubahan lain dari draft ke v1.1:

- Referensi dokumen dikoreksi ke path yang benar-benar ada di repo: `Environment/` (bukan tanpa
  prefix) untuk `enhancement-design_DashboardPage_v1.md`, `Environment/Enhancement-Design-1-UXVisual.md`
  (bukan `Enhancement-Design-1-Visual-Business.md`), dan `Documentation/` (bukan `PRD/`) untuk
  `Documentation-Program.md`/`Documentation-Business.md`.
- Setiap "Perubahan Kode" di §3–§7 dicatat sebagai **bagian dari implementasi widget terkait**
  (bukan patch terpisah di atas kode yang sudah berjalan), supaya urutan pengerjaan v1 tetap
  konsisten dengan urutan implementasi yang sudah disusun di `enhancement-design_DashboardPage_v1.md` §7.

---

## 1. Latar Belakang

Spesifikasi `enhancement-design_DashboardPage_v1.md` mencakup Sector Performance, Market Movers,
Sentiment Gauge, Forex Strip, dan Status Strip sebagai widget yang perlu dibangun. Review lebih
detail (dari mockup/purwarupa desain tab "Indonesia") menemukan **5 penyempurnaan** yang perlu
ditambahkan ke spesifikasi tersebut **sebelum** widget-widget ini mulai dikerjakan, supaya
implementasi pertama sudah benar dan tidak perlu revisi ulang setelah dibangun:

1. Card di grid metrik atas (`INDEX UTAMA`, `FOREX`, `MARKET SENTIMENT SCORE`) berisiko punya
   **tinggi tidak konsisten** — ada ruang kosong besar di card `FOREX` dan di bawah card
   `INDEX UTAMA` kalau tidak diantisipasi dari awal desain grid.
2. Spesifikasi awal Sector Performance (v1 §5.2) hanya mencontohkan 5 sektor (`Banking, Telecom,
   Consumer, Mining, Property`) — terlalu sedikit untuk fungsi heatmap yang bermakna.
3. Spesifikasi Market Movers (v1 §5.3) belum menegaskan eksplisit bahwa data **wajib** ter-scope
   per-tab market — berisiko data tab US "bocor" tercampur saat implementasi nanti menampilkan
   watchlist gabungan, bukan pool per-market.
4. Spesifikasi Recent News (v1 §4.6, fix sorting) belum menegaskan bahwa konten **juga** perlu
   ikut berganti konteks saat tab market berpindah — draft awal hanya membahas sorting tanggal,
   belum soal filter per-market.
5. Spesifikasi Status Strip (v1 §4.5) baru mencakup index utama saja (`IHSG 6,619.67 -0.25%`) —
   perlu diperluas menampilkan **seluruh simbol/movers utama** dari market yang sedang aktif.

Dokumen ini adalah **spesifikasi tambahan** untuk kelima poin di atas, ditambahkan ke
`enhancement-design_DashboardPage_v1.md` sebelum implementasi widget terkait dimulai. Bagian
spesifikasi v1 yang tidak disentuh (struktur tab market, formula Sentiment Gauge, Market Overview
chart) **tidak diubah** — hanya dirujuk sebagai konteks di mana penyempurnaan ini menempel.

### 1.1 Non-Goals

- Tidak mengubah formula Sentiment Gauge (`enhancement-design_DashboardPage_v1.md` §5.1) — sudah
  dirancang benar di spesifikasi awal (skor 0–100, label Fear/Greed, disclaimer penamaan yang
  sudah tepat).
- Tidak mengubah struktur tab market (US/Indonesia/Crypto) itu sendiri — hanya memastikan
  **konsistensi data** di dalam tiap tab saat widget-widget ini diimplementasikan.
- Tidak menambah widget baru di luar 5 penyempurnaan di atas — murni memperjelas spesifikasi
  yang sudah ada di v1, sebelum kode ditulis.

---

## 2. Ringkasan Perbaikan

| # | Masalah | Kategori | Merujuk Spesifikasi Awal |
|---|---|---|---|
| 1 | Tinggi card metrik tidak konsisten | Layout/CSS | `enhancement-design_DashboardPage_v1.md` §5.4 (Forex), §4.4 (Index Utama) |
| 2 | Sector Performance kurang banyak sektor | Data/Konten | `enhancement-design_DashboardPage_v1.md` §5.2 |
| 3 | Market Movers perlu ter-scope ketat per-tab | Logic/State | `enhancement-design_DashboardPage_v1.md` §5.3 |
| 4 | Recent News perlu ikut ganti per-tab market | Logic/State | `enhancement-design_DashboardPage_v1.md` §4.6 |
| 5 | Status strip perlu tampilkan semua movers, bukan cuma index | Widget/Data | `enhancement-design_DashboardPage_v1.md` §4.5 |

---

## 3. Perbaikan #1 — Konsistensi Tinggi Card Metrik

### 3.1 Masalah

Grid 3 kolom (`INDEX UTAMA`, `FOREX`, `MARKET SENTIMENT SCORE`) di baris atas dashboard berisiko
memakai tinggi card yang tidak seragam jika tidak diantisipasi sejak spesifikasi:

- Card `INDEX UTAMA` — tinggi pas mengikuti konten (label, angka, persen).
- Card `FOREX` — berisiko tinggi jauh lebih besar dari kebutuhan konten (`USD/IDR 17,631.00
  +0.01%`), menyisakan ruang kosong signifikan di bagian bawah card kalau hanya menampilkan satu
  pair.
- Card `MARKET SENTIMENT SCORE` — tinggi mengikuti ukuran radial gauge, berpotensi lebih tinggi
  dari `INDEX UTAMA` sehingga jadi acuan tinggi yang "menyeret" card lain melebar tanpa isi.
- Berisiko muncul **kotak kosong keempat** di grid (sisa grid cell yang tidak ditutup dengan
  benar) kalau struktur grid tidak diaudit sejak awal implementasi.

### 3.2 Perbaikan

**Opsi A — Equal height dengan `align-items: stretch` (direkomendasikan):**
- Set container grid baris ini memakai `align-items: stretch` — otomatis menyamakan tinggi semua
  card ke tinggi maksimum dalam baris.
- Isi card `FOREX` dengan **konten tambahan** untuk mengisi ruang secara proporsional, misal:
  tambahkan 1–2 pair forex lain yang relevan untuk tab aktif (untuk tab Indonesia: `USD/IDR` +
  `SGD/IDR` sebagai pair sekunder — Singapura adalah mitra dagang & investasi utama Indonesia).
- Pastikan struktur grid tidak menyisakan `<div>` placeholder tanpa konten atau tanpa
  `display: none` saat tidak dipakai — dicek lewat review kode sebelum widget dianggap selesai.

**Opsi B — Card dengan tinggi tetap (fixed height) + overflow handling:**
- Jika desain tetap ingin 1 pair forex saja per card, set tinggi card secara eksplisit
  (`height: 140px` atau nilai serupa yang konsisten di ketiga card) dan pusatkan konten secara
  vertikal (`display: flex; align-items: center`) — supaya card pendek tapi rapi, bukan card
  tinggi dengan ruang kosong.

**Rekomendasi:** Opsi A lebih baik karena memberi nilai tambah (informasi forex lebih lengkap)
daripada sekadar menyembunyikan masalah layout dengan mengecilkan card.

### 3.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Grid container 3-kolom metrik atas | Tambah/pastikan `align-items: stretch` pada grid |
| `ForexStrip.tsx` (dari v1 §5.4) | Terima array pair forex (bukan satu), render list ringkas di dalam card yang sama |
| `lib/marketConfig.ts` (dari v1 §4.3) | Tambah field `forexPairs` untuk Indonesia: `['USDIDR=X', 'SGDIDR=X']` |

---

## 4. Perbaikan #2 — Sector Performance Diperbanyak

### 4.1 Masalah

Contoh spesifikasi awal Sector Performance (v1 §5.2) hanya mencantumkan **5 sektor** (`Banking,
Telecom, Consumer, Mining, Property`). Untuk fungsi heatmap yang bermakna (memungkinkan user
membandingkan performa lintas sektor secara menyeluruh), jumlah ini terlalu sedikit dan tidak
representatif terhadap struktur ekonomi yang sebenarnya lebih beragam.

### 4.2 Perbaikan — Perluasan Daftar Sektor

**Untuk tab Indonesia**, tambahkan sektor mengikuti klasifikasi IDX-IC (IDX Industrial
Classification) yang sudah jadi standar bursa, disederhanakan ke kategori utama yang familiar:

| Sektor | Basket Simbol Representatif (Contoh Awal) |
|---|---|
| Banking | `BBCA.JK, BBRI.JK, BMRI.JK, BBNI.JK` |
| Telecom | `TLKM.JK, EXCL.JK, ISAT.JK` |
| Consumer | `UNVR.JK, ICBP.JK, INDF.JK` |
| Mining | `ADRO.JK, PTBA.JK, ANTM.JK` |
| Property | `BSDE.JK, CTRA.JK, PWON.JK` |
| **Energy** *(baru)* | `PGAS.JK, MEDC.JK, AKRA.JK` |
| **Infrastructure** *(baru)* | `JSMR.JK, TOWR.JK, TBIG.JK` |
| **Healthcare** *(baru)* | `KLBF.JK, SIDO.JK, MIKA.JK` |
| **Basic Materials** *(baru)* | `INTP.JK, SMGR.JK, INCO.JK` |
| **Technology** *(baru)* | `GOTO.JK, BUKA.JK, EMTK.JK` |
| **Transportation** *(baru)* | `ASII.JK, GIAA.JK, BIRD.JK` |
| **Finance (non-bank)** *(baru)* | `BFIN.JK, ADMF.JK, PNLF.JK` |

**Untuk tab US**, sektor mengikuti klasifikasi GICS yang lazim dipakai (S&P 500 sectors):
`Technology, Financials, Healthcare, Consumer Discretionary, Consumer Staples, Energy,
Industrials, Materials, Utilities, Real Estate, Communication Services` — 11 sektor standar,
basket simbol representatif perlu didefinisikan terpisah (lihat §8 Pertanyaan Terbuka).

**Untuk tab Crypto**, "sektor" diganti konsep **kategori koin** (bukan sektor industri):
`Layer 1, DeFi, Meme Coin, Stablecoin, Exchange Token, Gaming/Metaverse` — basket simbol per
kategori juga perlu didefinisikan terpisah.

### 4.3 Perbaikan Layout Heatmap

Dengan jumlah sektor bertambah (5 → 12 untuk Indonesia), grid perlu dirancang mengantisipasi
kepadatan ini sejak awal implementasi:

- Pakai grid **`4 kolom × 3 baris`** (12 sel) untuk tab Indonesia, atau **`4 kolom × 3 baris`**
  dengan 1 sel kosong untuk tab US (11 sektor GICS).
- Ukuran font label sektor dan persentase dikecilkan sedikit (`label` token, 11px) mengikuti
  prinsip dense layout yang sudah jadi standar project (lihat
  `Environment/Enhancement-Design-1-UXVisual.md` §3.1), supaya 12 kotak tetap muat rapi tanpa
  scroll di panel yang sama.
- Gradasi warna (dari v1 §5.2) dipertahankan — hijau/merah dengan intensitas mengikuti besaran
  `change_pct`, tidak berubah.

### 4.4 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Konfigurasi mapping sektor→simbol (dari v1 §5.2) | Diperluas dari 5 menjadi 12 sektor (Indonesia), tambah definisi terpisah untuk US (11 GICS) dan Crypto (kategori koin) |
| `SectorHeatmap.tsx` (dari v1 §5.2) | Dibangun langsung dengan grid `4 kolom`, ukuran font dense sejak awal (bukan revisi ulang setelahnya) |
| Endpoint `/api/market/sectors/{market}` (dari v1 §5.2) | Struktur tidak berubah dari rancangan v1, hanya jumlah sektor dalam response mengikuti tabel §4.2 |

---

## 5. Perbaikan #3 — Market Movers Ter-Scope per Tab

### 5.1 Masalah

Spesifikasi v1 §5.3 belum menegaskan eksplisit bahwa data di panel **Market Movers**
(Gainers/Losers/Volume) wajib terpisah per tab market. Risiko kalau tidak ditegaskan sejak
spesifikasi: fungsi fetch data movers dipanggil dengan watchlist gabungan lintas market, bukan
simbol yang sudah difilter sesuai `selectedMarket` aktif.

### 5.2 Perbaikan — State & Fetching Wajib Terikat ke `selectedMarket`

Ini murni penegasan aturan yang **seharusnya** sudah implisit di v1 §4.2 (Market Grouping), tapi
perlu ditegaskan eksplisit sebagai kontrak teknis sebelum `MoversPanel.tsx` dibangun:

```
Setiap request ke endpoint Market Movers WAJIB menyertakan parameter simbol yang sudah
difilter sesuai selectedMarket, TIDAK BOLEH mengirim watchlist gabungan semua market.

Contoh benar (tab Indonesia aktif):
  GET /api/market/volume-movers?symbols=BBCA.JK,BBRI.JK,TLKM.JK,ASII.JK,...

Contoh SALAH (tercampur):
  GET /api/market/volume-movers?symbols=BBCA.JK,AAPL,BTC-USD,TLKM.JK,...
```

**Sumber daftar simbol per market:**
- Bukan dari watchlist personal user (yang memang lintas kategori, sesuai v1 §4.2), melainkan
  dari **daftar simbol representatif per market** — bisa jadi gabungan basket sektor yang sudah
  didefinisikan di §4.2 dokumen ini (union semua basket sektor Indonesia = pool simbol untuk
  Market Movers tab Indonesia).
- Frontend membaca pool simbol ini dari `lib/marketConfig.ts` (dari v1 §4.3), bukan meng-hardcode
  di komponen `MoversPanel.tsx`.

### 5.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| `lib/marketConfig.ts` (dari v1 §4.3) | Tambah field `moverPoolSymbols` per market — union dari basket sektor (§4.2) |
| `MoversPanel.tsx` (dari v1 §5.3) | Fetch memakai `moverPoolSymbols[selectedMarket]`, re-fetch setiap `selectedMarket` berubah (dependency di `useEffect`/SWR key) |
| SWR cache key | Sertakan `selectedMarket` dalam cache key (misal `['movers', selectedMarket, activeTab]`) supaya SWR tidak menampilkan data cache dari tab market sebelumnya saat berpindah |

---

## 6. Perbaikan #4 — Recent News Ikut Berganti per Tab Market

### 6.1 Masalah

Sama seperti masalah #3, panel **Recent News** perlu dipastikan kontennya relevan dengan tab
market yang sedang aktif. Spesifikasi v1 §4.6 baru membahas perbaikan sorting tanggal — belum
menegaskan bahwa konten berita juga perlu difilter per-market, bukan generik dari watchlist
pengguna atau simbol acak.

### 6.2 Perbaikan — News per Market, Bukan per Watchlist

- Untuk tab **Indonesia**: ambil berita gabungan dari index utama (`^JKSE`) DAN beberapa simbol
  representatif top market cap (misal dari basket Banking — `BBCA.JK, BBRI.JK` — karena keduanya
  kerap jadi representasi sentimen pasar Indonesia secara luas).
- Untuk tab **US**: ambil berita dari index utama (`^GSPC`) DAN simbol top market cap US
  (`AAPL, MSFT, NVDA`).
- Untuk tab **Crypto**: ambil berita dari `BTC-USD` DAN `ETH-USD` sebagai representasi pasar
  crypto secara umum.
- Implementasi memakai fungsi `get_news_for_symbol()` (dari v1 §4.6, dengan fix sorting
  `published_at` yang sudah dispesifikasikan di sana), dipanggil untuk beberapa simbol
  representatif sekaligus, hasil digabung dan di-dedupe (kalau ada judul yang sama persis dari
  simbol berbeda), lalu di-sort ulang berdasar `published_at` — aturan sorting dari v1 §4.6 tetap
  berlaku sebagai langkah terakhir di sini.

### 6.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| `lib/marketConfig.ts` (dari v1 §4.3) | Tambah field `newsSymbols` per market (index utama + 1–2 simbol representatif) |
| Endpoint baru, misal `GET /api/news/market/{market}` | Loop `newsSymbols`, panggil `get_news_for_symbol()` (dari v1 §4.6, sudah termasuk fix sorting) untuk tiap simbol, gabung + dedupe + sort ulang |
| `NewsPanel.tsx`/`NewsCard.tsx` di context Dashboard | Fetch dari endpoint baru berbasis `selectedMarket`, bukan endpoint per-simbol tunggal yang dipakai di halaman Chart/Analysis |

> **Catatan:** Endpoint per-simbol tunggal (`GET /api/news/{symbol}`, existing) **tetap
> dipertahankan** untuk dipakai di halaman Chart/Analysis Detail — endpoint baru ini adalah
> tambahan khusus untuk kebutuhan Dashboard, bukan pengganti.

---

## 7. Perbaikan #5 — Status Strip Menampilkan Semua Movers per Market

### 7.1 Masalah

Spesifikasi Status Strip di v1 §4.5 baru mencakup **index utama** tab aktif (`IHSG 6,619.67
-0.25%`). Permintaan: strip ini perlu menampilkan **seluruh saham/simbol utama** dari market yang
aktif secara bergulir, bukan cuma satu index — mirip ticker bar sungguhan yang menampilkan banyak
simbol berjalan terus.

### 7.2 Perbaikan — Perluasan Isi Ticker per Market

Isi status strip diperluas dari "index utama saja" menjadi **gabungan index utama + movers utama**
market aktif:

| Tab | Isi Status Strip (Bergulir) |
|---|---|
| **US Market** | `S&P 500, DOW 30, NASDAQ` (index, dari v1 §4.5) **+** simbol Top Gainers/Losers hasil dari panel Market Movers (§5 dokumen ini) tab US saat itu — jadi daftar bergulir bisa berisi 15–20 simbol tergantung ukuran pool |
| **Indonesia** | `IHSG` (index) **+** seluruh simbol dari `moverPoolSymbols` Indonesia (§5.2 dokumen ini — union basket 12 sektor) — berpotensi jadi cukup panjang (30+ simbol), perlu dipertimbangkan apakah ditampilkan semua atau dibatasi ke top movers saja (lihat §7.4) |
| **Crypto** | `BTC-USD, ETH-USD` (index/representatif) **+** simbol crypto lain dari pool yang relevan |

### 7.3 Sumber Data — Reuse, Bukan Endpoint Baru

Status strip **tidak perlu endpoint terpisah** — cukup reuse data yang **sudah** di-fetch oleh
panel Market Movers (§5 dokumen ini) untuk tab aktif, karena kebutuhannya sama (daftar simbol +
harga + persen perubahan). Ini menghindari duplikasi fetch data yang sama dua kali (sekali untuk
Movers panel, sekali lagi untuk status strip) dalam satu render dashboard.

```
selectedMarket berubah
        │
        ▼
Fetch sekali: get_multiple_snapshots(moverPoolSymbols[selectedMarket])
        │
        ├──────────────┬───────────────────┐
        ▼              ▼                   ▼
  Status Strip    Market Movers      (data lain yang
  (tampilkan       (sort & filter     butuh snapshot
   semua/subset)    top gainers/       sama, jika ada)
                     losers/volume)
```

### 7.4 Pertimbangan Performa & UX — Batasan Jumlah Simbol di Strip

Menampilkan **seluruh** pool simbol (bisa 30+ untuk Indonesia dengan 12 sektor) di satu ticker bar
berjalan berisiko:

- Animasi CSS jadi sangat panjang durasinya (user harus menunggu lama untuk melihat simbol yang
  sama muncul lagi di siklus berikutnya).
- Payload data yang di-fetch lebih besar, berpotensi memperlambat render awal dashboard.

**Rekomendasi:** Batasi status strip ke **index utama + top 10–15 simbol** dari pool (diurutkan
berdasar `|change_pct|` terbesar — gabungan top gainers dan top losers paling signifikan), bukan
seluruh pool tanpa batas. Ini tetap memenuhi maksud "menampilkan pergerakan market secara luas"
tanpa mengorbankan performa. Jumlah pasti (10 vs 15 vs lainnya) didaftarkan sebagai keputusan
terbuka di §8.

### 7.5 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| `TickerBar.tsx` (dari v1 §4.5) | Dibangun menerima data gabungan index + movers (bukan cuma index) sejak awal, terapkan batasan jumlah simbol (§7.4) |
| State management dashboard | Data snapshot movers pool di-fetch sekali di level parent (Dashboard page), di-pass ke `TickerBar.tsx` dan `MoversPanel.tsx` sekaligus — hindari duplikasi fetch |
| Animasi CSS ticker | Durasi `@keyframes` (dispesifikasikan di v1 §4.5) disesuaikan proporsional dengan jumlah simbol final (setelah dibatasi §7.4), supaya kecepatan scroll tetap nyaman dibaca |

---

## 8. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] Basket simbol representatif final untuk 11 sektor GICS (tab US) dan kategori koin (tab
      Crypto) — dokumen ini baru mendefinisikan lengkap untuk Indonesia (§4.2).
- [ ] Apakah pair forex sekunder untuk tab Indonesia sebaiknya `SGD/IDR`, atau pair lain
      (`EUR/IDR`, `JPY/IDR`) yang dianggap lebih relevan bagi target pengguna?
- [ ] Batas jumlah simbol di status strip (§7.4) — apakah 10, 15, atau angka lain yang dianggap
      seimbang antara kelengkapan informasi dan performa/UX.
- [ ] Apakah endpoint gabungan news per-market (§6.3) perlu caching terpisah dengan TTL lebih
      lama dari endpoint per-simbol (mengingat ini menggabungkan beberapa panggilan sekaligus)?
- [ ] Untuk sektor yang barunya ditambahkan (§4.2) — apakah basket simbol contoh yang diberikan
      sudah difinalisasi, atau masih perlu direview tim yang lebih paham komposisi sektor IDX?

---

## 9. Dokumen Terkait

- `Environment/enhancement-design_DashboardPage_v1.md` — dokumen induk/spesifikasi awal seluruh
  widget Dashboard
- `Environment/Enhancement-Design-1-UXVisual.md` — design token & prinsip dense layout
- `Documentation/Documentation-Program.md` §4.1–4.3 — fungsi backend existing yang direuse
  (`get_history()`, `get_multiple_snapshots()`, `get_news_for_symbol()`)
- `Documentation/Documentation-Business.md` §5 — kebutuhan disclaimer, berlaku untuk Sentiment
  Gauge dan Golden/Death Cross yang tidak diubah oleh dokumen ini tapi tetap relevan di halaman
  yang sama
