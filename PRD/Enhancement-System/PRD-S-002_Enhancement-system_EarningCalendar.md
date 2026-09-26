# Enhancement Design — Dashboard Page v1.3

> **Versi Dokumen:** 1.3.1 — menggantikan pendekatan `Ticker().earnings_dates` per-simbol di
> `design_DashboardPage_v1.2.md` §3.2–3.3 dengan `yfinance.Calendars`; menambahkan struktur card
> ringkas di Dashboard (§3.5) dan halaman detail penuh di sub-menu Analysis (§3.6) mengikuti
> referensi UI List View/Calendar View
> **Terkait:** `design_DashboardPage_v1.2.md` (basis yang direvisi), `design_DashboardPage_v1.md`
> §5.6 (spesifikasi awal Earnings Calendar), §3 (posisi menu Analysis di sidebar)
> **Status:** ✅ Diimplementasikan (hybrid US Calendars + IDX per-simbol; card Dashboard + halaman Analysis)
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 1. Latar Belakang

Saat menyusun v1.2, pendekatan yang dirancang adalah **loop per-simbol** — memanggil
`Ticker(symbol).earnings_dates` untuk tiap simbol di pool market, lalu menggabungkan hasilnya.
Pendekatan ini valid, tapi kurang efisien: satu request terpisah per simbol, dan bergantung pada
daftar pool simbol yang sudah didefinisikan manual (`moverPoolSymbols`, dari
`design_DashboardPage_v1.1.md` §5.2).

Ditemukan bahwa `yfinance` versi terbaru (`1.7.0` ke atas) menyediakan **class `Calendars`**
yang didesain khusus untuk kebutuhan ini — mengambil kalender **market-wide** (earnings, IPO,
stock splits, economic events) tanpa perlu tahu daftar simbol sebelumnya:

```python
import yfinance as yf
calendars = yf.Calendars()
earnings_calendar = calendars.get_earnings_calendar(limit=50)
```

Dokumen ini **menggantikan** rancangan §3.2–3.3 di v1.2 dengan pendekatan ini, karena secara
konsep jauh lebih sesuai dengan kebutuhan "Earnings Calendar per market" yang sudah dibahas
sejak `design_DashboardPage_v1.md` §5.6 — tidak perlu lagi mengelola pool simbol manual untuk
tujuan spesifik ini (pool `moverPoolSymbols` tetap dipertahankan untuk widget lain seperti
Market Movers dan Sector Performance, tidak dihapus).

### 1.1 Non-Goals
- Tidak mengubah widget lain di luar Earnings Calendar.
- Tidak menggantikan `Ticker().earnings_dates` di tempat lain jika ada pemakaian lain di luar
  konteks dashboard ini (dokumen ini spesifik untuk widget Earnings Calendar di Dashboard Page).
- Fitur tambahan yang ikut terbongkar dari `Calendars` (`get_economic_events_calendar()`,
  `get_ipo_info_calendar()`, `get_splits_calendar()`) **tidak diimplementasikan** di dokumen
  ini — hanya dicatat sebagai temuan untuk potensi enhancement terpisah (lihat §5).

---

## 2. Detail Teknis `yfinance.Calendars`

### 2.1 Constructor & Parameter

```python
yf.Calendars(start=None, end=None, session=None)
```

| Parameter | Default | Deskripsi |
|---|---|---|
| `start` | Hari ini | Tanggal mulai, format string/datetime/date, contoh `"2026-09-20"` |
| `end` | `start + 7 hari` | Tanggal akhir |
| `session` | — | Objek `requests.Session`, opsional |

**Penting:** Default `end` sudah **persis 7 hari** dari `start` — cocok langsung dengan
kebutuhan window mingguan yang sudah ditetapkan sejak v1 §5.6, tanpa perlu parameter tambahan
seperti `days_ahead` yang dirancang manual di v1.2 §3.4.

### 2.2 Method `get_earnings_calendar()`

```python
calendars.get_earnings_calendar(
    market_cap: float | None = None,
    filter_most_active: bool = True,
    start=None,
    end=None,
    limit=12,
    offset=0,
    force=False,
) -> DataFrame
```

| Parameter | Default | Relevansi untuk Dashboard |
|---|---|---|
| `market_cap` | `None` | Cutoff kapitalisasi pasar (USD) — berpotensi dipakai untuk filter "hanya perusahaan besar" agar daftar tidak kebanjiran simbol kecil yang kurang relevan |
| `filter_most_active` | `True` | Filter saham yang aktif diperdagangkan — **defaultnya sudah aktif**, cocok dipertahankan agar hasil relevan |
| `start`, `end` | Ikut constructor | Bisa di-override per panggilan, tidak perlu instansiasi ulang `Calendars` untuk window berbeda |
| `limit` | `12` | **Perlu dinaikkan** untuk kebutuhan dashboard — YF membatasi maksimum `100` per panggilan |
| `offset` | `0` | Untuk pagination jika hasil lebih dari `limit` |
| `force` | `False` | Jika `True`, re-query walau cache internal `yfinance` sudah ada — relevan dipertimbangkan bersama `ttl_cache` yang sudah dipakai project (lihat §3.3) |

### 2.3 Status Verifikasi — Diperbarui dari Contoh Pemakaian Nyata

> ⚠️ **Keterbatasan yang masih berlaku:** Sandbox tempat dokumen ini disusun **tidak punya akses
> jaringan** ke domain Yahoo Finance, sehingga `get_earnings_calendar()` tidak bisa dijalankan
> langsung dari sini. Namun, contoh kode pemakaian nyata (disertakan oleh pengguna dokumen ini,
> mengonfirmasi beberapa poin di bawah) memberi kepastian tambahan tanpa perlu eksekusi langsung.

**Sudah terkonfirmasi** (dari contoh kode nyata):

- [x] Kolom `"Reported EPS"` ada persis dengan nama itu (kapitalisasi dan spasi termasuk),
      terbukti dari pola `df[df["Reported EPS"].isnull()]` untuk filter earnings yang belum
      dilaporkan — pola ini valid dan **berguna langsung** untuk kebutuhan "upcoming events"
      di card Dashboard (lihat §3.5).
- [x] Selain method `get_earnings_calendar()`, ada **property** `calendar.earnings_calendar`
      yang mengambil data dengan parameter default constructor — lebih ringkas dipakai kalau
      tidak butuh filter kustom per panggilan.
- [x] `yf.Calendars()` bisa diinstansiasi dengan `start`/`end` sebagai objek `datetime` langsung
      (bukan hanya string), terbukti dari `yf.Calendars(today, day_after_tomorrow)`.
- [x] Pola nyata untuk kebutuhan "earnings dalam beberapa hari ke depan, belum dilaporkan" sudah
      ada contoh utuhnya (variabel `unreported_df`), termasuk logic praktis menyesuaikan window
      saat hari Jumat (`is_friday`) supaya window tetap mencakup hari kerja berikutnya, bukan
      cuma akhir pekan kosong — pola ini relevan diadopsi untuk window "7 hari ke depan" di
      dokumen ini, meski kebutuhan dashboard tidak seketat itu (lihat §3.2 revisi).

**Masih BELUM terverifikasi** (belum ada bukti langsung dari contoh yang diberikan):

- [ ] Nama kolom lain selain `"Reported EPS"` — kemungkinan besar mengikuti pola serupa
      (`"Symbol"`, `"Company"`, `"EPS Estimate"`, `"Earnings Date"`), tapi **belum ada
      konfirmasi eksplisit**, jadi kode di §3.1 tetap ditandai sebagai dugaan yang perlu dicek.
- [ ] Apakah hasil `get_earnings_calendar()` **mencakup simbol IDX** (`.JK`) — masih jadi
      penentu utama pendekatan hybrid di §3.2.
- [ ] Format nilai `market_cap` (`100_000_000` di contoh — apakah ini USD absolut atau unit
      lain perlu tetap dicek, meski format angkanya sudah memberi petunjuk kuat berupa USD).
- [ ] Perilaku `limit` mendekati batas `100`.
- [ ] Tipe data kolom tanggal (`"Earnings Date"` — string, `datetime`, atau `Timestamp`).

---

## 3. Perubahan Implementasi

### 3.1 Fungsi Baru di `market_data.py` (Menggantikan Rancangan v1.2 §3.2)

```python
import yfinance as yf

def get_earnings_calendar_market_wide(
    start: str | None = None,
    end: str | None = None,
    limit: int = 50,
    only_unreported: bool = True,
) -> list[dict]:
    """
    Ambil earnings calendar market-wide via yfinance.Calendars (bukan loop
    per-simbol seperti rancangan v1.2). Nama kolom lain selain "Reported EPS"
    masih DUGAAN — lihat design_DashboardPage_v1.3.md §2.3 untuk status
    verifikasi lengkap.

    only_unreported: jika True, filter hanya earnings yang belum dilaporkan
    (kolom "Reported EPS" masih kosong) — pola ini SUDAH terkonfirmasi valid
    dari contoh pemakaian nyata (df[df["Reported EPS"].isnull()]), cocok untuk
    kebutuhan "upcoming events" di card Dashboard (§3.5) dan sub-menu Analysis
    (§3.6), bukan earnings yang sudah lewat.
    """
    calendars = yf.Calendars(start=start, end=end)
    try:
        df = calendars.get_earnings_calendar(limit=limit, filter_most_active=True)
    except Exception:
        return []  # YF gagal/kosong — jangan crash endpoint, return list kosong

    if df is None or df.empty:
        return []

    if only_unreported:
        df = df[df["Reported EPS"].isnull()]  # kolom ini SUDAH terkonfirmasi (§2.3)

    # TODO saat implementasi: sesuaikan nama kolom lain setelah verifikasi §2.3.
    # Kerangka di bawah adalah DUGAAN untuk kolom selain "Reported EPS".
    results = []
    for _, row in df.iterrows():
        results.append({
            "symbol": row.get("Symbol") or row.get("symbol"),
            "company_name": row.get("Company") or row.get("companyshortname"),
            "date": str(row.get("Earnings Date") or row.get("startdatetime")),
            "eps_estimate": row.get("EPS Estimate"),
            "reported_eps": row.get("Reported EPS"),  # None jika belum dilaporkan
        })
    return results
```

**Perbedaan dari v1.2 §3.2:**

| Aspek | v1.2 (`Ticker().earnings_dates`, per-simbol) | v1.3 (`Calendars`, market-wide) |
|---|---|---|
| Input | Perlu daftar simbol (`moverPoolSymbols`) | Tidak perlu daftar simbol sama sekali |
| Jumlah request | 1 request per simbol (loop) | 1 request untuk banyak hasil sekaligus |
| Ketergantungan pool manual | Ya — bergantung `moverPoolSymbols` sudah benar | Tidak — YF yang menentukan simbol aktif via `filter_most_active` |
| Filter kualitas hasil | Tidak ada (semua simbol di pool ditampilkan apa adanya) | Ada `market_cap` dan `filter_most_active` bawaan |
| Cakupan pasar | Bergantung isi `moverPoolSymbols` per market (bisa dikontrol penuh) | **Belum diketahui** apakah mencakup IDX atau US-only (§2.3) |

### 3.2 Pendekatan Hybrid — Rekomendasi Sementara Sampai §2.3 Terverifikasi

Karena cakupan pasar `Calendars` untuk simbol non-US **belum terverifikasi**, direkomendasikan
pendekatan **hybrid** sampai ada kepastian:

```
JIKA verifikasi (§2.3) menunjukkan Calendars mencakup IDX:
    → Pakai get_earnings_calendar_market_wide() untuk SEMUA tab (US, Indonesia)
    → Fungsi per-simbol dari v1.2 (§3.2) tidak diperlukan lagi, bisa dihapus

JIKA verifikasi menunjukkan Calendars HANYA mencakup US:
    → Tab US: pakai get_earnings_calendar_market_wide() (v1.3, lebih efisien)
    → Tab Indonesia: tetap pakai pendekatan per-simbol dari v1.2 §3.2
      (Ticker().earnings_dates, loop moverPoolSymbols.indonesia)
    → Tab Crypto: tetap disembunyikan (v1.2 §3.6, earnings tidak relevan untuk crypto)
```

Kedua fungsi (`get_earnings_calendar_market_wide()` dari dokumen ini dan
`get_earnings_calendar()` per-simbol dari v1.2 §3.2) **tetap ditulis keduanya** di
`market_data.py` — endpoint yang memutuskan mana yang dipanggil berdasarkan `market` yang
diminta, mengikuti hasil verifikasi §2.3.

### 3.3 Caching

`Calendars.get_earnings_calendar()` punya parameter `force` yang menyiratkan ada **cache
internal di level `yfinance` sendiri** (perilaku persis caching itu belum terverifikasi — apakah
per-instance `Calendars()`, per-proses, atau ada TTL tertentu). Ini perlu diselaraskan dengan
`ttl_cache` yang sudah jadi pola project (`app/core/cache.py`, dari `Documentation-Program.md`
§7.3):

- **Rekomendasi:** tetap bungkus `get_earnings_calendar_market_wide()` dengan `@ttl_cache`
  seperti fungsi service lain, dengan TTL lebih panjang (misal 1 jam, bukan `CACHE_TTL_SECONDS`
  default 60 detik) — mengingat jadwal earnings tidak berubah-ubah dalam hitungan menit.
- Biarkan `force=False` (default) pada pemanggilan `get_earnings_calendar()` di dalam fungsi
  service — cukup andalkan `ttl_cache` di level aplikasi, tidak perlu memaksa re-query internal
  `yfinance` setiap saat.

### 3.4 Endpoint — Perubahan dari v1.2 §3.4

Endpoint tetap `GET /api/market/earnings-calendar?market={market}`, tapi implementasi di
baliknya bercabang sesuai hasil verifikasi §2.3 (lihat pseudocode §3.2). Parameter `days_ahead`
dari v1.2 tetap dipertahankan, tapi kini diteruskan sebagai `start`/`end` ke `Calendars` untuk
tab yang memakai jalur market-wide.

Skema respons (§3.5 di v1.2, termasuk field `is_watchlist`) **tidak berubah** — perubahan ini
murni di lapisan cara data diambil, bukan bentuk data yang dikirim ke frontend.

### 3.5 Card Earnings Calendar di Dashboard — Tampilan Simple

**Tujuan:** Ringkasan cepat di halaman Dashboard, bukan tabel lengkap — cukup untuk pengguna
tahu "ada berapa earnings penting minggu ini" tanpa memenuhi layar dashboard yang sudah padat
(lihat `design_DashboardPage_v1.md` §3, ASCII wireframe dashboard).

**Isi card:**
- Judul `Earnings Calendar` + subjudul `7 hari ke depan`.
- Daftar ringkas maksimal **5 entri** (bukan seluruh hasil), diurutkan berdasar tanggal
  terdekat, memakai `only_unreported=True` (§3.1) supaya hanya menampilkan yang **belum**
  dilaporkan — konsisten dengan tujuan "stay ahead of market moves", bukan riwayat earnings
  yang sudah lewat.
- Tiap baris: logo/inisial perusahaan (placeholder jika logo tidak tersedia), simbol, tanggal
  singkat (`Kamis, 25 Sep`), badge waktu (`Pre-Market` / `After-Market` jika data tersedia dari
  kolom yang setara `startdatetimetype` — lihat catatan verifikasi tambahan di §2.3).
- Tombol **`More Details`** di bagian bawah card — mengarahkan ke sub-menu baru di halaman
  Analysis (§3.6), bukan modal/expand di tempat, supaya tabel detail yang lebih lengkap (kolom
  Market Cap, Expected/Actual EPS, Revenue, Surprise %) tidak perlu dipaksakan masuk ke card
  sempit di Dashboard.
- Filter cakupan: mengikuti `selectedMarket` tab aktif, sama seperti widget lain (konsisten
  dengan pola scoping di `design_DashboardPage_v1.1.md` §5–§6). Untuk tab Crypto, card ini tetap
  disembunyikan (keputusan v1.2 §3.6 tidak berubah — earnings tidak relevan untuk crypto).

**Perubahan Kode:**

| Komponen | Perubahan |
|---|---|
| `EarningsCalendar.tsx` (dari v1 §5.6, direvisi lagi di v1.2 §4/§6.2) | Disederhanakan jadi ringkasan 5-entri + tombol `More Details`, bukan tabel penuh |
| Endpoint `/api/market/earnings-calendar` | Tambah parameter `limit` (default `5`) dan `only_unreported` (default `true`) khusus untuk pemanggilan dari card Dashboard |
| Routing frontend | Tombol `More Details` mengarah ke `/analysis/earnings-calendar` (§3.6) |

### 3.6 Sub-menu "Earnings Calendar" di Menu Analysis — Tampilan Detail

**Tujuan:** Halaman detail penuh, terpisah dari Dashboard, untuk pengguna yang ingin eksplorasi
mendalam — mengikuti referensi UI yang diberikan (List View, Calendar View, filter tanggal,
kolom data lengkap).

**Struktur halaman** (route baru, misal `/analysis/earnings-calendar`, ditambahkan sebagai
sub-item di menu sidebar **Analysis** yang sudah ada — lihat `design_DashboardPage_v1.md` §3
untuk posisi menu Analysis di sidebar):

#### a) Header & Kontrol Filter
- Judul `Earnings Calendar` + subjudul deskriptif (mengikuti nada referensi: ringkas, jelas
  manfaatnya).
- Toggle **List View** / **Calendar View** (dua mode tampilan, lihat §3.6b dan §3.6c).
- Quick filter tanggal: `Yesterday`, `Today`, `Tomorrow`, `This Week`, `Next Week` — tombol
  pill sesuai referensi, masing-masing men-set `start`/`end` yang dikirim ke endpoint (§3.1).
- Date range picker kustom (kalender dua-bulan side-by-side, sesuai referensi gambar 2) untuk
  rentang tanggal bebas, sebagai alternatif quick filter.
- Kolom pencarian (`Search`) — filter sisi-klien terhadap simbol/nama perusahaan yang sudah
  termuat di halaman (tidak memerlukan endpoint pencarian baru, cukup `.filter()` di frontend
  terhadap hasil yang sudah di-fetch).

#### b) List View (Tabel Detail)

Kolom mengikuti referensi UI secara langsung:

| Kolom | Sumber Data | Catatan |
|---|---|---|
| Company | `company_name` (§3.1) | Ditampilkan dengan logo/inisial di kiri, mirip referensi |
| Date | `date` (§3.1) | Format `DD/MM/YYYY` sesuai referensi, atau disesuaikan lokal ID |
| Time | Badge Pre-Market/After-Market | **Belum terverifikasi** — perlu cek apakah `Calendars` punya kolom setara `startdatetimetype` (lihat §2.3), yang di `yahoo_earnings_calendar` lama disebut `TAS`/`AMC`. Jika tidak tersedia, kolom ini disembunyikan, bukan ditampilkan kosong |
| Market Cap | Field tambahan — **perlu ditentukan sumbernya**; `Calendars` sendiri punya parameter `market_cap` untuk filter input, tapi belum jelas apakah market cap tiap perusahaan ikut ada di kolom hasil (§2.3) atau perlu dilengkapi dari `get_quote_snapshot()` (existing) per simbol hasil |
| Expected EPS | `eps_estimate` (§3.1) | — |
| Actual EPS | `reported_eps` (§3.1) | Kosong (`-`) jika `only_unreported=True` dipakai; halaman detail ini **tidak** memfilter unreported saja (beda dari card Dashboard di §3.5), supaya histori surprise % tetap bisa dilihat |
| Expected Revenue | Field tambahan — **status sama seperti Market Cap**, perlu verifikasi apakah tersedia langsung dari `Calendars` atau perlu sumber lain |
| Actual Revenue | Sama seperti Expected Revenue | — |
| Surprise | Turunan: `reported_eps - eps_estimate` | Dihitung di frontend/backend, bukan field langsung |
| Surprise % | Turunan: `(Surprise / eps_estimate) * 100` | Warna hijau/merah mengikuti token `positive`/`negative` (konsisten seluruh dashboard, dari `Enhancement-Design-1-Visual-Business.md` §3.2) |

> ⚠️ **Catatan penting:** Kolom **Market Cap**, **Expected Revenue**, dan **Actual Revenue**
> yang muncul di referensi UI **belum ada kepastian sumbernya** dari `yfinance.Calendars` — ini
> ditambahkan ke daftar verifikasi §2.3 sebagai temuan baru dari permintaan ini. Jika kolom-kolom
> tersebut tidak tersedia di hasil `get_earnings_calendar()`, opsi penanganannya: (a) sembunyikan
> kolom tersebut dari tabel, (b) lengkapi dengan panggilan tambahan ke `get_quote_snapshot()`
> (existing, py `market_data.py`) per simbol untuk Market Cap saja — tapi ini mengembalikan
> masalah "1 request per simbol" yang justru coba dihindari dengan pindah ke `Calendars` (§1).
> Keputusan ini didaftarkan sebagai pertanyaan terbuka di §6.

#### c) Calendar View (Tampilan Grid per Hari)

Mengikuti referensi UI (gambar 3): grid horizontal, satu kolom per hari, masing-masing kolom
menampilkan ikon/logo perusahaan yang earnings di hari itu, dikelompokkan per sesi
(`Pre-Market`, `After-Market`) jika data waktu tersedia (lihat catatan kolom Time di §3.6b).

- Navigasi maju/mundur (`<` `>`) menggeser rentang tanggal yang ditampilkan, mengikuti pola
  referensi (geser per periode, bukan per hari satuan).
- Header tiap kolom: tanggal + jumlah total earnings hari itu (`20 Earnings`, sesuai referensi).
- Klik satu ikon perusahaan → detail ringkas (tooltip atau slide-over panel), bukan navigasi
  halaman baru — mempertahankan konteks grid saat eksplorasi.
- Grid ini **secara visual lebih padat** dibanding List View — cocok untuk pengguna yang ingin
  melihat sebaran earnings mingguan sekilas sebelum menyelami detail per perusahaan di List View.

**Perubahan Kode (Halaman Baru):**

| Komponen | Perubahan |
|---|---|
| Route baru `/analysis/earnings-calendar` | Halaman detail penuh, terpisah dari Dashboard |
| Menu sidebar **Analysis** | Tambah sub-item `Earnings Calendar` |
| `EarningsCalendarDetail.tsx` (baru) | Komponen halaman utama, mengatur state List/Calendar view, filter tanggal |
| `EarningsListView.tsx` (baru) | Tabel detail (§3.6b) |
| `EarningsCalendarGridView.tsx` (baru) | Grid per-hari (§3.6c) |
| Endpoint `/api/market/earnings-calendar` | Dipanggil ulang dari halaman ini **tanpa** `only_unreported` dan **tanpa** `limit=5` — parameter berbeda dari pemanggilan card Dashboard (§3.5), tapi endpoint yang sama (parameter opsional membedakan perilaku) |

---

## 4. Ringkasan Perubahan Kode

| File | Perubahan |
|---|---|
| `app/services/market_data.py` | Tambah `get_earnings_calendar_market_wide()` dengan parameter `only_unreported` (§3.1); fungsi per-simbol dari v1.2 §3.2 **tetap ada**, dipakai kondisional (§3.2) |
| `app/core/cache.py` | Tidak ada perubahan struktur, hanya pemakaian TTL lebih panjang untuk fungsi baru ini (§3.3) |
| `app/api/market.py` | Logic endpoint `/earnings-calendar` bercabang berdasar `market` dan hasil verifikasi §2.3; tambah parameter `limit`, `only_unreported` |
| `app/api/schemas.py` | Tambah field `reported_eps`; kolom tambahan (Market Cap, Revenue) menunggu keputusan §3.6b |
| `EarningsCalendar.tsx` (Dashboard, direvisi) | Disederhanakan jadi card ringkas 5-entri + tombol `More Details` (§3.5) |
| `EarningsCalendarDetail.tsx`, `EarningsListView.tsx`, `EarningsCalendarGridView.tsx` (baru) | Halaman detail penuh di sub-menu Analysis (§3.6) |
| Menu sidebar **Analysis** | Tambah sub-item baru `Earnings Calendar` |

---

## 5. Temuan Tambahan (Di Luar Cakupan Dokumen Ini)

Saat membaca dokumentasi `Calendars`, ditemukan 3 method lain yang berpotensi relevan untuk
enhancement masa depan, dicatat di sini untuk referensi tapi **tidak diimplementasikan**:

| Method | Kegunaan Potensial | Catatan |
|---|---|---|
| `get_economic_events_calendar()` | Persis kebutuhan "Economic Events Calendar" yang **sempat dieksplorasi dan ditolak** di `design_DashboardPage_v1.2.md` §1 (karena dikira harus scraping) — ternyata **ada versi resminya** di `yfinance` | Perlu diskusi ulang apakah keputusan v1.2 §1 masih berlaku, mengingat asumsi "harus scraping" sudah terbukti keliru |
| `get_ipo_info_calendar()` | Kalender IPO — relevan untuk trader yang tertarik saham baru listing | Belum pernah dibahas di dokumen manapun sebelumnya, murni temuan baru |
| `get_splits_calendar()` | Kalender stock split — bisa melengkapi Golden/Death Cross Alert (v1 §5.5) karena stock split mempengaruhi pembacaan chart harga | Berpotensi jadi widget kecil tambahan |

> **Catatan penting:** Temuan `get_economic_events_calendar()` ini **membatalkan sebagian
> alasan** di balik keputusan `design_DashboardPage_v1.2.md` §1 poin 1 ("bukan API, murni
> scraping"). Keputusan **konsolidasi ke Earnings Calendar saja** (v1.2 §1.1) sebenarnya masih
> bisa dipertahankan dengan alasan lain yang tetap valid (§1 poin 2: relevansi rendah untuk
> target pengguna Indonesia/US/Crypto yang sudah distrukturkan). Tapi ini keputusan yang
> sebaiknya **dikonfirmasi ulang**, bukan diasumsikan otomatis masih berlaku — didaftarkan
> sebagai pertanyaan terbuka di §6.

---

## 6. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] **Prioritas tertinggi:** jalankan verifikasi §2.3 di lingkungan dengan akses internet
      penuh sebelum menulis kode final — seluruh dokumen ini bergantung pada hasil verifikasi
      itu untuk menentukan jalur mana (market-wide penuh vs hybrid) yang dipakai.
- [ ] **Sumber kolom Market Cap, Expected Revenue, Actual Revenue** (§3.6b) — apakah tersedia
      langsung dari `Calendars.get_earnings_calendar()`, atau perlu dilengkapi dari sumber lain
      (dengan konsekuensi kembali ke pola "1 request per simbol" yang coba dihindari dokumen ini).
- [ ] **Sumber kolom Time (Pre-Market/After-Market)** (§3.6b) — apakah `Calendars` punya field
      setara `startdatetimetype` dari `yahoo_earnings_calendar` lama, atau kolom ini perlu
      disembunyikan dari UI jika tidak tersedia.
- [ ] Apakah keputusan "tidak ada widget Economic Events" di v1.2 §1.1 perlu ditinjau ulang,
      mengingat `get_economic_events_calendar()` ternyata tersedia resmi (§5)?
- [ ] Apakah `get_ipo_info_calendar()` dan `get_splits_calendar()` (§5) layak dijadikan usulan
      widget baru terpisah, di luar cakupan dokumen ini?
- [ ] Nilai `market_cap` cutoff yang wajar untuk filter (§2.2) — perlu ditentukan setelah tahu
      unit/format parameternya dari verifikasi §2.3.
- [ ] Perilaku interaksi klik ikon perusahaan di Calendar View (§3.6c) — tooltip ringkas atau
      slide-over panel; keduanya disebutkan sebagai opsi tapi belum diputuskan final.

---

## 7. Dokumen Terkait

- `design_DashboardPage_v1.2.md` — dokumen yang direvisi sebagian oleh dokumen ini (§3.2–3.3)
- `design_DashboardPage_v1.md` §5.6 — spesifikasi awal Earnings Calendar
- `design_DashboardPage_v1.1.md` §5.2 — `moverPoolSymbols`, tetap dipertahankan untuk widget lain
- `Documentation-Program.md` §7.3 — pola `ttl_cache` yang direferensikan di §3.3