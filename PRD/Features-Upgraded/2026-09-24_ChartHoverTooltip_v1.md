# Enhancement Design — Chart Hover Tooltip (OHLC & Moving Average)

> **Versi Dokumen:** 1.0
> **File Code:** `2026-09-24_ChartHoverTooltip_v1`
> **Terkait:** `2026-09-08_ChartPage_v1.md` (halaman Chart tempat komponen ini dipasang),
> `2026-09-08_AnalysisPage_v1.md` §3.2 (Technical Analysis, chart yang sama juga dipakai di
> sub-menu Overview Stocks sesuai screenshot), `Documentation-Program.md` §7.4
> (`CandlestickChart.tsx`, komponen yang diperkaya dokumen ini)
> **Sumber Referensi:** `lightweight-charts` dokumentasi resmi —
> [Tooltips](https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips),
> [`MouseEventParams`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams),
> [`IChartApi.subscribeCrosshairMove`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribecrosshairmove),
> [`CandlestickData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CandlestickData)
> — seluruhnya dicek langsung ke halaman resmi, bukan diasumsikan dari memori pelatihan
> **Status:** 🔜 Diusulkan — belum diimplementasikan
> **Terakhir Diperbarui:** 24 September 2026
> **Audiens:** Frontend Developer

---

## 1. Latar Belakang

Dari screenshot halaman **Analysis Overview** (sub-tab **Overview Stocks**, chart `TLKM.JK`),
terlihat candlestick chart dengan overlay **MA20** (garis biru) dan **MA50** (garis kuning) di
panel harga, plus panel **RSI(14)** terpisah di bawahnya. Saat ini chart menampilkan nilai
terkini (harga terakhir, MA20/MA50 terkini) sebagai **badge statis** di sisi kanan chart —
tapi **tidak ada** informasi yang muncul saat kursor di-hover ke titik candle tertentu di masa
lalu (misal saat pengguna ingin tahu persis OHLC pada tanggal 12 Juni).

Permintaan: tambahkan **tooltip on-hover** yang menampilkan:
1. Data **OHLC** (Open, High, Low, Close) dari candle yang sedang di-hover.
2. Nilai **Moving Average** (MA20, MA50, dan indikator overlay lain jika ada — Bollinger Bands)
   pada titik waktu yang sama, jika indikator tersebut sedang aktif ditampilkan.

### 1.1 Temuan Penting dari Dokumentasi Resmi

`lightweight-charts` (library yang **sudah** dipakai project ini, terkonfirmasi di
`Documentation-Program.md` §7.4) **tidak menyediakan tooltip bawaan** — dokumentasi resmi
menyatakan eksplisit: *"Lightweight Charts doesn't include a built-in tooltip feature, however
it is something which can be added to your chart by following the examples presented below."*
Tooltip harus dibangun manual dengan pola: buat elemen HTML overlay, lalu subscribe ke event
`subscribeCrosshairMove()` pada instance chart, dan update konten HTML tersebut secara manual
setiap event ter-trigger.

Ini **bukan keterbatasan project ini** — semua pengguna `lightweight-charts` di mana pun
menghadapi hal yang sama, jadi pola implementasi di dokumen ini mengikuti pola resmi dari
TradingView sendiri, bukan solusi workaround yang rapuh.

### 1.2 Non-Goals
- Tidak mengubah cara data OHLC/MA dihitung — `get_history()` dan `add_all_indicators()`
  (existing, `Documentation-Program.md` §4.1, §4.3) sudah mengembalikan seluruh data yang
  dibutuhkan, dokumen ini murni menambah **lapisan presentasi** (tooltip), bukan sumber data
  baru.
- Tidak mengubah komponen chart di halaman lain (War Room mini chart dari
  `2026-09-21_NewFeatures_v1_1.md` §1) — dokumen ini fokus ke `CandlestickChart.tsx` versi
  penuh (3-panel) yang dipakai di halaman Chart dan Analysis Overview.
- Tidak menambah dependency baru — seluruh implementasi memakai API `lightweight-charts` yang
  sudah jadi dependency existing (`frontend/package.json`).

---

## 2. Spesifikasi Perilaku

### 2.1 Trigger

- Tooltip muncul saat kursor mouse berada di atas area chart (candlestick), mengikuti posisi
  crosshair yang **sudah ada** secara default di `lightweight-charts` (garis vertikal/horizontal
  putus-putus, terlihat di screenshot sebagai crosshair dotted line).
- Tooltip **hilang otomatis** saat kursor keluar dari area chart (`param.point === undefined`).

### 2.2 Konten Tooltip — OHLC

Saat hover di satu candle, tampilkan:

| Field | Sumber |
|---|---|
| Tanggal/waktu candle | `param.time` (dari `MouseEventParams`, terkonfirmasi resmi tersedia — lihat §1.1) |
| Open | `CandlestickData.open` |
| High | `CandlestickData.high` |
| Low | `CandlestickData.low` |
| Close | `CandlestickData.close` |
| Warna teks Close | `positive` jika `close >= open`, `negative` jika `close < open` — konsisten dengan warna candle itu sendiri (token existing) |

### 2.3 Konten Tooltip — Moving Average & Overlay Lain

Selain OHLC, tooltip **juga** menampilkan nilai tiap **overlay yang sedang aktif** pada titik
waktu yang sama:

| Overlay | Kondisi Ditampilkan |
|---|---|
| MA20 | Selalu, jika toggle `Indicators → MA` aktif (sesuai kontrol yang sudah ada di header chart, terlihat di screenshot: tombol `MA` berwarna hijau saat aktif) |
| MA50 | Sama seperti MA20 |
| Bollinger Bands (Upper/Middle/Lower) | Jika toggle `Bollinger` aktif (tombol di sebelah `MA`, terlihat di screenshot) |

**Mekanisme:** Ini **bukan** field terpisah yang perlu di-fetch ulang — nilai MA20/MA50/Bollinger
pada titik waktu ter-hover **sudah otomatis tersedia** dari `param.seriesData`, karena
`MouseEventParams.seriesData` adalah `Map` yang berisi data dari **seluruh series** yang
terpasang di chart pada saat itu (candlestick series DAN line series MA/Bollinger sekaligus) —
dikonfirmasi langsung dari `MouseEventParams` interface resmi (§1). Ini artinya satu handler
`subscribeCrosshairMove()` sudah cukup untuk ambil OHLC **dan** nilai overlay secara bersamaan,
tanpa perlu query terpisah.

### 2.4 Posisi & Gaya Visual

- Tooltip berupa `<div>` overlay (bukan native browser tooltip/`title` attribute) — mengikuti
  pola resmi §1.1, memungkinkan styling penuh sesuai design token project.
- Posisi mengikuti koordinat kursor (`param.point.x`, `param.point.y`), dengan sedikit offset
  supaya tidak menutupi candle yang sedang di-hover.
- Styling memakai token warna existing (`panel` untuk background, `border` untuk border,
  `text-primary`/`text-secondary` untuk teks, `positive`/`negative` untuk nilai Close) — bukan
  gaya baru di luar design system yang sudah ditetapkan.
- Font angka memakai `font-mono` (existing, dipakai konsisten untuk semua angka finansial di
  seluruh project — lihat `WatchlistTable.tsx`, `SymbolHeader.tsx`).

---

## 3. Implementasi

### 3.1 Struktur Perubahan

Komponen `CandlestickChart.tsx` (existing) diperluas untuk:
1. Membuat elemen tooltip (`<div>`) sekali saat chart di-inisialisasi.
2. Subscribe ke `chart.subscribeCrosshairMove()`.
3. Di dalam handler, ambil data dari `param.seriesData` untuk **setiap series** yang relevan
   (candlestick, MA20, MA50, Bollinger jika aktif), lalu render ke dalam elemen tooltip.
4. Unsubscribe saat komponen unmount (`chart.unsubscribeCrosshairMove()`), mencegah memory leak
   — pola ini **harus** disandingkan dengan cleanup `chart.remove()` yang **sudah ada** di
   `CandlestickChart.tsx` (dari pola `useEffect` cleanup yang sudah diterapkan di komponen chart
   existing project ini).

### 3.2 Kode — Referensi Series untuk Tooltip

Prasyarat: komponen perlu menyimpan **referensi ke tiap series** (bukan hanya candlestick),
supaya `param.seriesData.get(series)` bisa dipanggil untuk masing-masing di dalam handler.

```typescript
// Excerpt dari CandlestickChart.tsx — state referensi series
// (memperluas komponen existing, bukan file baru)

const seriesRefs = useRef<{
  candlestick: ISeriesApi<'Candlestick'> | null;
  ma20: ISeriesApi<'Line'> | null;
  ma50: ISeriesApi<'Line'> | null;
  bbUpper: ISeriesApi<'Line'> | null;
  bbMiddle: ISeriesApi<'Line'> | null;
  bbLower: ISeriesApi<'Line'> | null;
}>({
  candlestick: null,
  ma20: null,
  ma50: null,
  bbUpper: null,
  bbMiddle: null,
  bbLower: null,
});

// Saat membuat tiap series (di dalam useEffect inisialisasi chart yang sudah ada):
seriesRefs.current.candlestick = chart.addCandlestickSeries({ /* ...opsi existing... */ });
seriesRefs.current.ma20 = chart.addLineSeries({ color: '#5EA1FF', lineWidth: 1 });
seriesRefs.current.ma50 = chart.addLineSeries({ color: '#FFB800', lineWidth: 1 });
// bbUpper/bbMiddle/bbLower dibuat kondisional, hanya jika toggle Bollinger aktif
// (pola sama seperti logic toggle existing di chart controls)
```

### 3.3 Kode — Handler Tooltip

```typescript
// Excerpt dari CandlestickChart.tsx — pemasangan tooltip, ditambahkan di dalam
// useEffect yang sama tempat chart & series diinisialisasi

useEffect(() => {
  if (!chartContainerRef.current) return;

  // ...inisialisasi chart & series yang sudah ada (tidak diulang di sini)...

  // --- Pembuatan elemen tooltip ---
  const tooltipEl = document.createElement('div');
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.display = 'none';
  tooltipEl.style.pointerEvents = 'none'; // supaya tooltip tidak menghalangi interaksi mouse
  tooltipEl.style.zIndex = '10';
  tooltipEl.className =
    'rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs shadow-lg';
  chartContainerRef.current.appendChild(tooltipEl);

  // --- Handler crosshair move ---
  const handleCrosshairMove = (param: MouseEventParams) => {
    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.y < 0 ||
      !chartContainerRef.current
    ) {
      tooltipEl.style.display = 'none';
      return;
    }

    const candle = seriesRefs.current.candlestick
      ? (param.seriesData.get(seriesRefs.current.candlestick) as CandlestickData | undefined)
      : undefined;
    if (!candle) {
      tooltipEl.style.display = 'none';
      return;
    }

    const ma20 = seriesRefs.current.ma20
      ? (param.seriesData.get(seriesRefs.current.ma20) as LineData | undefined)
      : undefined;
    const ma50 = seriesRefs.current.ma50
      ? (param.seriesData.get(seriesRefs.current.ma50) as LineData | undefined)
      : undefined;
    const bbUpper = seriesRefs.current.bbUpper
      ? (param.seriesData.get(seriesRefs.current.bbUpper) as LineData | undefined)
      : undefined;
    const bbLower = seriesRefs.current.bbLower
      ? (param.seriesData.get(seriesRefs.current.bbLower) as LineData | undefined)
      : undefined;

    const isPositive = candle.close >= candle.open;
    const closeColorClass = isPositive ? 'text-positive' : 'text-negative';

    // Baris OHLC selalu tampil; baris MA/Bollinger hanya jika seriesnya aktif DAN
    // punya nilai pada titik waktu ini (bisa undefined di awal data karena
    // window MA belum terisi, mis. MA50 butuh 50 hari histori dulu)
    tooltipEl.innerHTML = `
      <div class="mb-1 text-text-muted">${formatDate(param.time)}</div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span class="text-text-secondary">O</span><span class="text-text-primary">${candle.open.toFixed(2)}</span>
        <span class="text-text-secondary">H</span><span class="text-text-primary">${candle.high.toFixed(2)}</span>
        <span class="text-text-secondary">L</span><span class="text-text-primary">${candle.low.toFixed(2)}</span>
        <span class="text-text-secondary">C</span><span class="${closeColorClass}">${candle.close.toFixed(2)}</span>
        ${ma20?.value !== undefined ? `<span class="text-text-secondary">MA20</span><span style="color:#5EA1FF">${ma20.value.toFixed(2)}</span>` : ''}
        ${ma50?.value !== undefined ? `<span class="text-text-secondary">MA50</span><span style="color:#FFB800">${ma50.value.toFixed(2)}</span>` : ''}
        ${bbUpper?.value !== undefined ? `<span class="text-text-secondary">BB Upper</span><span class="text-text-primary">${bbUpper.value.toFixed(2)}</span>` : ''}
        ${bbLower?.value !== undefined ? `<span class="text-text-secondary">BB Lower</span><span class="text-text-primary">${bbLower.value.toFixed(2)}</span>` : ''}
      </div>
    `;

    // --- Posisi tooltip mengikuti kursor, dengan offset kecil ---
    const containerWidth = chartContainerRef.current.clientWidth;
    const tooltipWidth = tooltipEl.offsetWidth || 160;
    const offsetX = 12;
    let left = param.point.x + offsetX;
    if (left + tooltipWidth > containerWidth) {
      left = param.point.x - tooltipWidth - offsetX; // pindah ke kiri kursor jika kepepet kanan
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${param.point.y + offsetX}px`;
    tooltipEl.style.display = 'block';
  };

  chart.subscribeCrosshairMove(handleCrosshairMove);

  return () => {
    chart.unsubscribeCrosshairMove(handleCrosshairMove);
    tooltipEl.remove();
    // ...cleanup chart.remove() yang sudah ada tetap dipertahankan...
  };
}, [/* dependency array existing, tidak berubah */]);
```

> **Catatan implementasi:** `formatDate()` di atas mengacu ke utilitas format tanggal yang
> **sudah ada** di project (dipakai di berbagai komponen lain seperti `WatchlistTable.tsx`) —
> bukan fungsi baru yang perlu ditulis dari nol.

### 3.4 Penanganan Kasus MA Belum Terisi

Karena `MA50` butuh minimal 50 hari data historis sebelum menghasilkan nilai (baris-baris awal
dataset akan `NaN`/`undefined`), tooltip **wajib** menyembunyikan baris MA20/MA50 secara
individual saat nilainya `undefined` pada titik waktu ter-hover — **bukan** menampilkan "N/A"
atau angka `0` yang menyesatkan. Kode di §3.3 sudah menangani ini lewat pengecekan
`ma20?.value !== undefined` per baris.

### 3.5 Performa

`subscribeCrosshairMove()` ter-trigger pada **setiap** pergerakan mouse di area chart — handler
harus tetap ringan (murni update `innerHTML` dan posisi CSS, tanpa network request atau
komputasi berat). Kode di §3.3 sudah konsisten dengan prinsip ini: seluruh data yang dibutuhkan
(`param.seriesData`) sudah tersedia langsung dari event, tanpa perlu fetch tambahan — selaras
dengan pola "tidak ada endpoint baru" yang konsisten dipraktikkan di seluruh dokumen desain
project ini.

---

## 4. Ringkasan Perubahan Kode

| File | Perubahan |
|---|---|
| `frontend/components/chart/CandlestickChart.tsx` (existing, dari `Documentation-Program.md` §7.4) | Tambah state referensi series (§3.2), tambah pembuatan elemen tooltip + handler `subscribeCrosshairMove()` (§3.3), tambah cleanup `unsubscribeCrosshairMove()` |
| Tidak ada perubahan backend | Seluruh data tooltip berasal dari data yang **sudah** di-fetch untuk merender chart itu sendiri (`get_history()` + `add_all_indicators()`, existing) — murni penambahan presentasi di sisi klien |

---

## 5. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] Apakah tooltip perlu menampilkan **Volume** juga (data ini sudah ada di `get_history()`
      existing, tapi belum disebutkan eksplisit dalam permintaan awal) — mudah ditambah sebagai
      baris tambahan di §3.3 jika diperlukan.
- [ ] Apakah tooltip untuk panel **RSI** dan **MACD** (2 panel terpisah di bawah panel harga,
      terlihat di screenshot) juga perlu tooltip serupa — dokumen ini baru mencakup panel harga
      utama (OHLC + MA + Bollinger). Jika ya, pola yang sama (§3.3) bisa direplikasi untuk
      `subscribeCrosshairMove()` di instance chart RSI/MACD masing-masing (chart terpisah,
      instance `IChartApi` berbeda per panel).
- [ ] Format tanggal di tooltip (§3.3, `formatDate()`) — apakah perlu beda format untuk
      interval intraday (jam:menit) vs harian (tanggal saja), mengikuti pola yang mungkin sudah
      ada di komponen chart existing untuk sumbu waktu.
- [ ] Untuk mobile/touch device — `subscribeCrosshairMove()` tetap ter-trigger oleh touch event
      di `lightweight-charts`, tapi perlu dicek apakah posisi tooltip (§3.3, offset dari kursor)
      perlu penyesuaian untuk layar sentuh (misal ukuran font lebih besar, posisi tidak
      tertutup jari).

---

## 6. Dokumen Terkait

- `2026-09-08_ChartPage_v1.md` — halaman Chart tempat `CandlestickChart.tsx` dipasang
- `2026-09-08_AnalysisPage_v1.md` §3.2 — sub-menu Overview Stocks yang juga memakai chart yang
  sama (screenshot referensi permintaan ini)
- `Documentation-Program.md` §7.4 — `CandlestickChart.tsx`, komponen existing yang diperluas
- [`lightweight-charts` — Tooltips](https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips)
  — pola resmi yang diikuti di §3
- [`MouseEventParams`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams)
  — struktur `seriesData` yang jadi dasar §2.3