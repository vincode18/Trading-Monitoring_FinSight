# Enhancement Design — Chart Page v1

> **Versi Dokumen:** 1.0
> **File Code:** `2026-09-08_ChartPage_v1`
> **Terkait:** `2026-09-08_GlobalSearch_v1.md` §2.1, §4.5 (trigger & integrasi Global Search ke
> halaman Chart); `2026-09-07_DashboardPage_v1.1.md` §3–4 (pola perbaikan layout full-width,
> dijadikan acuan konsistensi di dokumen ini)
> **Status:** ✅ Diimplementasikan
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Frontend Developer

---

## 1. Latar Belakang

Review screenshot halaman Chart (simbol `^IXIC` — NASDAQ Composite, tampilan 6M) menemukan
3 masalah:

1. **Dropdown selector simbol (`BBCA.JK ▾`) sudah redundan** — sejak Global Search
   (`2026-09-08_GlobalSearch_v1.md`) dirancang sebagai cara utama berpindah simbol dari halaman
   Chart, dropdown ini tidak lagi diperlukan sebagai jalur navigasi kedua.
2. **Dropdown menunjukkan state yang salah** — screenshot menunjukkan dropdown bertuliskan
   `BBCA.JK`, padahal chart yang aktif ditampilkan adalah `^IXIC` (NASDAQ Composite, terlihat
   jelas dari judul `^IXIC NASDAQ Composite 27,030.02` di bawahnya). Dropdown tidak
   ter-sinkronisasi dengan `selectedSymbol` yang sebenarnya aktif di halaman.
3. **Layout tidak full-width** — konten Chart (grafik, panel MA50/MA200) tidak memanfaatkan
   lebar layar penuh, mengulang pola masalah yang sudah pernah ditemukan dan diperbaiki untuk
   Dashboard Page (`2026-09-07_DashboardPage_v1.1.md` §3.1).

Dokumen ini adalah spesifikasi perbaikan untuk ketiga masalah tersebut, sekaligus dua permintaan
tambahan: search bar dibuat lebih *wide* (menonjol, sesuai perannya sebagai satu-satunya jalur
pencarian simbol setelah dropdown dihapus), dan indikator `MA50`/`MA200` dipindah sejajar
dengan judul halaman (`Chart`), bukan lagi menempel di pojok kanan atas terpisah dari konteks.

### 1.1 Non-Goals
- Tidak mengubah logic perhitungan MA50/MA200 itu sendiri — murni perubahan posisi/layout
  elemen yang menampilkannya.
- Tidak mengubah struktur 3-panel chart (Harga, RSI, MACD) yang sudah berjalan sesuai
  `2026-09-06_DashboardPage_v1.md` §5.3 (Panel Movers) dan skema chart existing — dokumen ini
  fokus ke header/toolbar halaman, bukan area grafik itu sendiri.
- Tidak mengubah cara kerja Global Search — dokumen ini hanya menegaskan **posisi final**
  trigger-nya di halaman Chart, detail fungsionalitas tetap merujuk penuh ke
  `2026-09-08_GlobalSearch_v1.md`.

---

## 2. Ringkasan Perbaikan

| # | Masalah | Perbaikan |
|---|---|---|
| 1 | Dropdown selector simbol redundan & ter-desync | Dihapus total dari header Chart |
| 2 | Layout tidak full-width | Terapkan pola fix yang sama seperti Dashboard (`design_DashboardPage_v1.1.md` §3.1) |
| 3 | Search bar kurang menonjol | Diperbesar (*wide*), mengisi ruang yang sebelumnya dipakai dropdown |
| 4 | `MA50`/`MA200` terpisah dari konteks judul | Dipindah sejajar dengan judul `Chart`/nama simbol, bukan pojok kanan atas terpisah |

---

## 3. Perbaikan #1 — Hapus Dropdown Selector Simbol

### 3.1 Alasan Penghapusan

Dropdown `BBCA.JK ▾` awalnya berfungsi sebagai cara memilih simbol yang ditampilkan di chart.
Sejak Global Search dirancang (`2026-09-08_GlobalSearch_v1.md`), fungsi ini sepenuhnya digantikan
oleh modal command palette yang **lebih cepat** (keyboard shortcut `Cmd/Ctrl+K`, pencarian
instan lintas kategori) dan **lebih konsisten** (satu jalur pencarian simbol yang sama dipakai
di seluruh aplikasi, bukan dua cara berbeda untuk tujuan yang sama).

Screenshot yang direview juga menunjukkan **bug nyata** akibat mempertahankan dua sumber
kebenaran (dropdown vs `selectedSymbol` yang sesungguhnya aktif) — dropdown menampilkan
`BBCA.JK` padahal chart menampilkan `^IXIC`. Ini kemungkinan besar terjadi karena dropdown
memakai state lokal miliknya sendiri yang tidak ter-refresh saat simbol berubah lewat jalur lain
(misal dari Global Search, atau dari klik simbol di Dashboard/Watchlist yang mengarahkan ke
halaman Chart). Menghapus dropdown menghapus sumber bug ini sepenuhnya, bukan sekadar
menambal sinkronisasinya.

### 3.2 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Header halaman Chart (existing) | Hapus elemen dropdown `<select>`/komponen pemilih simbol beserta state lokalnya |
| `selectedSymbol` | Tetap satu-satunya sumber kebenaran untuk simbol aktif, diperbarui **hanya** lewat Global Search (§4) atau navigasi dari halaman lain (Dashboard/Watchlist) |

---

## 4. Perbaikan #2 — Search Bar Lebih Wide, Menggantikan Ruang Dropdown

### 4.1 Posisi & Ukuran

Trigger Global Search (tombol `🔍 Search ⌘K`, sudah ada di screenshot sebagai elemen terpisah
di sebelah dropdown) **dipindah mengisi ruang yang sebelumnya dipakai dropdown**, sekaligus
diperbesar lebarnya — bukan lagi tombol kecil berdampingan dengan dropdown, melainkan satu
search bar yang menonjol sebagai satu-satunya cara mengganti simbol di halaman ini.

**Sebelum (dari screenshot):**
```
[ BBCA.JK ▾ ]  [ 🔍 Search  ⌘K ]
   (dropdown)      (tombol kecil)
```

**Sesudah:**
```
[ 🔍  Cari simbol, perusahaan, atau index...                    ⌘K ]
  (satu search bar wide, menggantikan kedua elemen sebelumnya)
```

### 4.2 Perilaku

- Klik di mana saja pada search bar ini membuka modal Global Search penuh (bukan input teks
  langsung di tempat) — konsisten dengan spesifikasi modal di
  `2026-09-08_GlobalSearch_v1.md` §3.1.
- Placeholder teks menampilkan hint pencarian, bukan simbol yang sedang aktif (berbeda dari
  dropdown lama yang menampilkan simbol terpilih) — karena simbol yang sedang aktif sudah
  ditampilkan jelas di judul halaman tepat di bawahnya (`^IXIC NASDAQ Composite 27,030.02`,
  §5).
- Shortcut `⌘K`/`Ctrl+K` tetap ditampilkan di ujung kanan search bar sebagai afiwordansi visual,
  sesuai pola yang sudah ada di screenshot dan referensi command palette
  (`2026-09-08_GlobalSearch_v1.md` §3.1).

### 4.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Trigger Global Search (existing sebagai tombol kecil, dari `2026-09-08_GlobalSearch_v1.md` §4.5) | Restyle jadi search bar penuh, menempati ruang bekas dropdown (§3) |
| CSS width | Lebar mengikuti sisa ruang header setelah judul `Chart` — proporsi disesuaikan saat implementasi, prinsip: search bar adalah elemen paling menonjol di baris kontrol ini |

---

## 5. Perbaikan #3 — Reposisi MA50/MA200 Sejajar dengan Judul

### 5.1 Masalah

Indikator `MA50 26,086.55` dan `MA200 —` (screenshot: pojok kanan atas, terpisah jauh dari judul
`Chart` maupun judul simbol `^IXIC NASDAQ Composite`) kehilangan konteks visual — pengguna harus
melihat ke ujung layar berlawanan untuk menghubungkan angka ini dengan simbol yang sedang dilihat.

### 5.2 Perbaikan

Pindahkan blok `MA50`/`MA200` ke **baris yang sama dengan judul halaman** (`Chart`), rata kanan
pada baris judul itu sendiri — bukan lagi baris terpisah di pojok kanan atas yang jauh dari
konteks.

**Sebelum (dari screenshot):**
```
Chart                                          [ MA50 26,086.55  MA200 — ]
[ dropdown ]  [ search ]
```

**Sesudah:**
```
Chart                                          [ MA50 26,086.55  MA200 — ]
[ 🔍  search bar wide...                                              ]
^IXIC   NASDAQ Composite   27,030.02   +507.47 (+1.91%)
```

Posisi `MA50`/`MA200` **tetap** di kanan (tidak dipindah ke kiri/tengah), perubahannya murni soal
**baris** tempat elemen ini berada — disejajarkan satu baris dengan teks judul `Chart`, alih-alih
mengambang sendiri di pojok kanan atas yang secara visual terputus dari judul maupun search bar
di bawahnya.

### 5.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Header halaman Chart (existing) | Restrukturisasi flex/grid: judul `Chart` (kiri) dan blok `MA50`/`MA200` (kanan) berada dalam satu baris flex yang sama, search bar (§4) diletakkan di baris terpisah persis di bawahnya |

---

## 6. Perbaikan #4 — Layout Full-Width

### 6.1 Masalah

Konsisten dengan temuan yang sama persis di Dashboard Page (`2026-09-07_DashboardPage_v1.1.md`
§3.1) — konten halaman Chart (grafik candlestick, panel RSI, panel MACD) kemungkinan besar
dibatasi oleh `max-width` yang sama di level wrapper konten utama, karena kedua halaman berbagi
struktur dashboard-shell yang sama (sidebar tetap + area konten kanan).

### 6.2 Perbaikan

Terapkan **perbaikan yang identik** dengan yang sudah dispesifikasikan untuk Dashboard Page:

- Hapus/pastikan tidak ada `max-w-*` di wrapper konten utama halaman Chart.
- Ganti dengan `flex-1` — konten mengisi penuh sisa ruang setelah sidebar, dengan padding
  horizontal wajar (`px-6` sampai `px-8`).
- Chart candlestick (`lightweight-charts`, dari `Documentation-Program.md` §7.4) otomatis
  melebar mengikuti container-nya — tidak perlu perubahan pada komponen chart itu sendiri,
  karena `lightweight-charts` sudah dirancang responsif terhadap ukuran container.

> **Catatan konsistensi:** Ini **bukan** perbaikan baru yang didesain dari nol — murni
> menerapkan pola fix yang sudah ditetapkan dan didokumentasikan di
> `2026-09-07_DashboardPage_v1.1.md` §3.1, pada halaman yang berbeda (Chart, bukan Dashboard).
> Jika kedua halaman berbagi komponen layout-shell yang sama (kemungkinan besar, mengingat
> sidebar dan struktur header serupa), perbaikan ini mungkin **otomatis berlaku untuk
> keduanya** sekaligus dari satu perubahan di komponen shell — perlu dicek saat implementasi
> apakah Dashboard dan Chart benar-benar berbagi wrapper yang sama atau punya wrapper terpisah
> yang masing-masing perlu diperbaiki sendiri-sendiri.

### 6.3 Perubahan Kode

| Komponen | Perubahan |
|---|---|
| Wrapper konten halaman Chart | Sama seperti §3.1 di `design_DashboardPage_v1.1.md` — hapus `max-w-*`, ganti `flex-1` |
| `CandlestickChart.tsx` (existing) | Tidak ada perubahan kode — melebar otomatis mengikuti container yang sudah diperbaiki |

---

## 7. Susunan Header Halaman Chart (ASCII Wireframe)

Gambaran utuh susunan header setelah seluruh perbaikan §3–6 diterapkan, mengikuti konvensi
ASCII wireframe yang sudah dipakai di `2026-09-06_DashboardPage_v1.md` §3:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STATUS STRIP — ticker berjalan (tidak berubah, existing)                     │
└────────────────────────────────────────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────────────────────────────┐
│          │  Chart                                    MA50 26,086.55  MA200 — │  ← §5, sejajar
│          │  ┌───────────────────────────────────────────────────────────┐  │
│ SIDEBAR  │  │ 🔍  Cari simbol, perusahaan, atau index...           ⌘K   │  │  ← §4, wide
│          │  └───────────────────────────────────────────────────────────┘  │     (dropdown
│ Dashboard│                                                                    │     dihapus, §3)
│ Watchlist│  ^IXIC   NASDAQ Composite   27,030.02   +507.47 (+1.91%)          │
│ Chart    │                                                                    │
│ News     │  [ 5D 1M 3M 6M 1Y 5Y ]              INDICATORS [ MA ] [Bollinger] │
│ Analysis │  ┌───────────────────────────────────────────────────────────┐  │
│          │  │                                                             │  │
│  SA      │  │                    [ grafik candlestick, full-width ]      │  │  ← §6
│ Admin    │  │                                                             │  │
│ [Logout] │  └───────────────────────────────────────────────────────────┘  │
│          │  RSI (14) ...                                                     │
│          │  MACD ...                                                         │
└──────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 8. Ringkasan Perubahan Kode

| File/Komponen | Perubahan |
|---|---|
| Header halaman Chart (existing, nama file spesifik perlu dicek saat implementasi — kemungkinan `ChartPage.tsx` atau bagian dari halaman utama sesuai struktur Tahap 2) | Hapus dropdown selector simbol (§3); restrukturisasi flex agar judul `Chart` + `MA50`/`MA200` satu baris (§5); search bar dipindah jadi elemen wide di baris terpisah (§4) |
| Wrapper konten halaman Chart | Hapus `max-w-*`, ganti `flex-1` (§6) — sama seperti fix di `design_DashboardPage_v1.1.md` §3.1 |
| Trigger Global Search (dari `2026-09-08_GlobalSearch_v1.md` §4.5) | Restyle dari tombol kecil menjadi search bar penuh (§4.3) |

---

## 9. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] Apakah Dashboard Page dan Chart Page berbagi satu wrapper layout-shell yang sama (§6.2) —
      menentukan apakah fix full-width ini perlu dikerjakan sekali di komponen bersama, atau
      dua kali secara terpisah di masing-masing halaman.
- [ ] Lebar pasti search bar (§4.1) — apakah mengisi penuh sisa ruang header setelah judul
      `Chart`, atau dibatasi lebar maksimum tertentu supaya tidak terasa terlalu panjang di
      layar ultra-wide.
- [ ] Apakah halaman lain yang juga punya header serupa (jika ada) perlu perbaikan yang sama,
      atau dokumen ini murni cakupan halaman Chart saja sesuai permintaan awal.

---

## 10. Dokumen Terkait

- `2026-09-08_GlobalSearch_v1.md` §2.1, §3.1, §4.5 — spesifikasi lengkap Global Search yang
  posisinya ditegaskan ulang di dokumen ini
- `2026-09-07_DashboardPage_v1.1.md` §3.1 — pola perbaikan layout full-width yang direplikasi
  di §6
- `2026-09-06_DashboardPage_v1.md` §3 — konvensi ASCII wireframe yang diikuti di §7