# Enhancement Design — Fundamental Analysis Enrichment & Shareholder Analysis

> **Versi Dokumen:** 1.1 — menambahkan referensi resmi `yfinance.financials` (Financials API
> group) untuk mengonfirmasi parameter method income statement/balance sheet/cashflow yang
> sebelumnya hanya didasarkan pada penamaan konvensi umum
> **File Code:** `2026-09-21_FundamentalStrategy_v1`
> **Terkait:** `2026-09-08_AnalysisPage_v1.md` §5 (Tab "Fundamental Analysis" — dokumen ini
> memperkaya isi sub-tab yang sudah ada dan menambah 1 sub-tab baru), UI existing dari
> screenshot (tab `Earnings, Margins, Balance Sheet, Cash Flow, Valuation, Dividends, Trend` —
> sudah lebih maju dari rancangan awal §5.1, dokumen ini menyelaraskan)
> **Sumber Referensi:**
> 1. `Panduan_BOT_HQSaham_20240115.pdf` — section **FUNDAMENTAL ANALISYS** (hal. 41-42),
>    **HOLDER** (hal. 26-27), **MINERVINI** (hal. 32) — diverifikasi lewat ekstraksi teks +
>    rasterisasi visual halaman 41. Sumber untuk **konsep pengelompokan rasio** (§1.1) dan daftar
>    23 item data yang jadi acuan §2.
> 2. `yfinance.financials` API group (`ranaroussi.github.io/yfinance/reference/yfinance.financials.html`)
>    — `get_income_stmt()`, `get_balance_sheet()`, `get_cashflow()` beserta parameter resminya.
>    Sumber untuk **konfirmasi cara memanggil API** (§2.8), melengkapi §3.4 yang mencatat bahwa
>    struktur *baris/field isi* data (nama akun laporan keuangan) tetap belum terdokumentasi.
> **Status:** 🔜 Diusulkan — belum diimplementasikan. Parameter method (`freq`, `as_dict`,
> `pretty`) sudah terkonfirmasi resmi (§2.8); nama baris/field isi data finansial dan
> shareholder **masih perlu diverifikasi manual** (lihat §2.9, §3.4)
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 1. Latar Belakang

### 1.1 Temuan dari PDF Sumber

`Panduan_BOT_HQSaham_20240115.pdf` punya satu section utuh berjudul **"FUNDAMENTAL ANALISYS"**
(halaman 41-42) yang mendaftar **23 item data laporan keuangan** dan **8 kategori rasio**
(command `/FUNDA1` sampai `/FUNDA8`), plus section terpisah **"HOLDER"** (halaman 26-27) yang
mencakup analisis kepemilikan saham. Berikut kutipan lengkap yang relevan.

**Dari halaman 41 (kutipan langsung):**
```
FUNDAMENTAL ANALISYS
...
Kode Data Fundamental:
1. TotalAsset.                  9.  EBITDA.                    17. EV/EBITDA.
2. Pinjaman JangkaPendek.       10. Biaya Bunga.                18. Debt to Equity Ratio [DER].
3. Pinjaman JangkaPanjang.      11. Earnings per Share [EPS].   19. Debt to Capital Ratio [DTCR].
4. Total Ekuitas.               12. Price to Earnings Ratio [PER]. 20. Debt/EBITDA.
5. Pendapatan.                  13. Book Value per Share [BVPS]. 21. EBITDA/IntExps.
6. Laba Kotor.                  14. Price to Book Value [PBV].  22. Asset Turn Over.
7. Laba Usaha.                  15. Return on Assets [ROA].     23. Net Profit Margin.
8. Laba Bersih.                 16. Return on Equity [ROE].

4. /FUNDA1 (KODE SAHAM). Menampilkan Valuation Ratios
5. /FUNDA2 (KODE SAHAM). Menampilkan Profitability.
6. /FUNDA3 (KODE SAHAM). Perintah menampilkan Per Share Data.
7. /FUNDA4 (KODE SAHAM). Perintah menampilkan Management Effectiveness.
8. /FUNDA5 (KODE SAHAM). Perintah menampilkan Growth.
9. /FUNDA6 (KODE SAHAM). Perintah menampilkan Financial Strength.
10. /FUNDA7 (KODE SAHAM). Perintah menampilkan Efficiency.
11. /FUNDA8 (KODE SAHAM). Perintah menampilkan Dividend.
```

**Dari halaman 42 (screening rasio gabungan, kutipan langsung):**
```
22. /SF. Menampilkan annualized rasio finansial saham.
23. /SF (RASIO FA)(TANDA > ATAU <)(NILAI). Menampilkan saham sesuai dengan rasio fundamental
    yang dicari. Contoh screening saham dengan market cap diatas Rp. 1 Trilyun: /SF CAP>1.
    SCREENING GABUNGAN (PER, DER, PBV, ROE, EVEBITDA, BVPS, CAP).
    Contoh: /SF PBV>0 PBV<1 DER>0 DER<1 ROE>10 EVEBITDA<10 KOMPAS100.
```

**Dari halaman 26-27 (section HOLDER, kutipan ringkas):**
```
HOLDER
1. /FD (KODE SAHAM) (N BULAN). Menampilkan Foreign vs Domestic dengan interval periode bulan.
3. /FYB (KODE SAHAM) (TAHUN). Menampilkan top holder full year, tersedia data dari 2011.
4. /KPM X,Y. Menampilkan presentase kepemilikan masyarakat dalam suatu saham pada rentang x% s.d. y%.
5. /KPO (NAMA ORANG). Menampilkan list pemegang saham perorangan diatas 5%.
6. /KPS (KODE SAHAM). Menampilkan para shareholders yang kepemilikannya diatas 5%.
7. /O (KODE SAHAM) (F/D).Y.M. Menampilkan komposisi kepemilikan asing dan/atau domestik.
8. /OT (KODE SAHAM) (O).(P).(I). Menampilkan komposisi kepemilikan saham berdasar tipe investor:
   1. Individu, 2. Perusahaan Efek, 3. Reksa Dana, 4. Dana Pensiun, 5. Investor Perusahaan,
   6. Investor Bank, 7. Investor Asuransi, 8. Investor Yayasan, 9. Investor Lainnya.
```

### 1.2 Kaitan dengan "Strategi Buy Berdasarkan Laporan Keuangan"

PDF **tidak** memiliki satu section berjudul eksplisit "strategi buy fundamental" — tapi ada 2
mekanisme screening yang **fungsinya persis itu**:

1. **`/SF` (Screening Fundamental)** — kombinasi filter multi-rasio (contoh dari PDF: `PBV<1
   DER<1 ROE>10 EVEBITDA<10` — saham murah, utang rendah, profitabilitas tinggi, valuasi
   murah terhadap EBITDA). Ini **pola screening value-investing klasik**, bukan strategi
   bernama tunggal.
2. **`/SCORE MVF` (Minervini Fundamental)** — score fundamental berdasar kriteria Mark
   Minervini (halaman 32 PDF), tapi PDF **tidak merinci formula scoring**-nya, hanya menyebut
   "score fundamental yang baik" tanpa breakdown kriteria.

Dokumen ini mengambil **pola `/SF`** sebagai dasar "Strategy Trading Fundamental" karena
parameternya eksplisit tercantum di PDF (23 rasio + kombinasi filter), sementara `/SCORE MVF`
tidak bisa direplikasi karena formulanya tidak diungkap di dokumen sumber.

### 1.3 Cakupan Dokumen Ini

1. **Perkaya isi 7 sub-tab existing** (`Earnings, Margins, Balance Sheet, Cash Flow, Valuation,
   Dividends, Trend` — dari screenshot UI yang sudah berjalan) dengan rasio-rasio dari daftar 23
   item PDF yang belum tercakup di rancangan awal `2026-09-08_AnalysisPage_v1.md` §5.1.
2. **Tambah grafik** di tiap sub-tab (bar chart untuk data historis per-periode, line chart
   untuk tren) — sesuai permintaan eksplisit, karena rancangan awal §5.1 baru berupa angka
   snapshot tanpa visualisasi.
3. **Tambah sub-tab baru "Shareholder Analysis"** berdasar `yfinance.Ticker.get_major_holders()`
   dan fungsi terkait — melengkapi cakupan section HOLDER dari PDF.
4. **Tambah sub-tab baru "Screener Strategy"** (opsional, §4) — mereplikasi konsep `/SF` sebagai
   alat bantu, bukan sinyal beli/jual otomatis.

### 1.4 Non-Goals
- Tidak mereplikasi command bot Telegram (`/FUNDA1`-`/FUNDA8`, `/SF`, `/KPS`, dst.) secara
  langsung — dokumen ini mengambil **konsep pengelompokan rasio**, bukan mengkloning UX bot.
- Tidak mengimplementasikan `/SCORE MVF` (Minervini Fundamental Score) — formulanya tidak
  terungkap di PDF sumber, di luar cakupan dokumen ini.
- Tidak mengimplementasikan `/RATING` (Morning Star Quantitative Star Rating) atau `/VAL`
  (Graham Number/Peter Lynch Value) — kedua ini butuh model valuasi intrinsik terpisah yang
  lebih kompleks, didaftarkan sebagai ide lanjutan di §6, bukan cakupan wajib.
- Tidak menjamin kelengkapan data untuk saham IDX — konsisten dengan catatan berulang di
  dokumen sebelumnya (`2026-09-08_AnalysisPage_v1.md` §5.2) bahwa data fundamental `yfinance`
  lebih lengkap untuk saham US.

---

## 2. Perkaya Sub-Tab Existing dengan Grafik

Berdasar 7 tab yang sudah terlihat di screenshot UI (`Earnings, Margins, Balance Sheet, Cash
Flow, Valuation, Dividends, Trend`), berikut pemetaan ke 23 item data PDF dan penambahan grafik
untuk masing-masing.

### 2.1 Tab "Earnings"

| Item dari PDF | Jenis Grafik yang Ditambahkan |
|---|---|
| Pendapatan (Revenue), Laba Kotor, Laba Usaha, Laba Bersih, EPS | **Bar chart** per kuartal (4-8 kuartal terakhir) — satu bar per kuartal, opsional toggle Annually/Quarterly (mengikuti pola `/FC` PDF: parameter `A` atau `Q`) |
| Laba Bersih vs kuartal setahun sebelumnya (YoY) | **Bar chart berdampingan** (grouped bar) — kuartal ini vs kuartal sama tahun lalu, mengikuti konsep `/PQ` (prediksi net profit kuartal berikutnya dibanding kuartal sama tahun lalu) |

### 2.2 Tab "Margins"

| Item dari PDF | Jenis Grafik yang Ditambahkan |
|---|---|
| Net Profit Margin | **Line chart** tren beberapa kuartal/tahun terakhir |
| (Baru, turunan) Gross Margin = Laba Kotor / Pendapatan | **Line chart**, dihitung dari 2 field existing (Laba Kotor, Pendapatan) — bukan field langsung dari PDF, tapi rasio umum yang natural masuk kategori "Margins" |
| (Baru, turunan) Operating Margin = Laba Usaha / Pendapatan | **Line chart**, sama pola dengan Gross Margin |

### 2.3 Tab "Balance Sheet"

| Item dari PDF | Jenis Grafik yang Ditambahkan |
|---|---|
| Total Asset, Total Ekuitas, Pinjaman Jangka Pendek, Pinjaman Jangka Panjang | **Stacked bar chart** — Ekuitas + Total Liabilitas (pinjaman pendek+panjang) bertumpuk per periode, memvisualisasikan struktur modal |
| Debt to Equity Ratio (DER), Debt to Capital Ratio (DTCR) | **Line chart** tren rasio utang dari waktu ke waktu |

### 2.4 Tab "Cash Flow" (Sudah Ada di Screenshot — Operating CF, Free CF, CapEx)

| Item dari Screenshot/PDF | Jenis Grafik yang Ditambahkan |
|---|---|
| Operating Cash Flow, Free Cash Flow, CapEx (sudah tampil sebagai angka di screenshot) | **Bar chart** historis per kuartal — saat ini di screenshot baru snapshot 3 angka tunggal, ditambah riwayat multi-kuartal dalam bentuk bar chart |

### 2.5 Tab "Valuation"

| Item dari PDF | Jenis Grafik yang Ditambahkan |
|---|---|
| PER, PBV, EV/EBITDA, BVPS | **Line chart** tren rasio valuasi dari waktu ke waktu — memvisualisasikan apakah saham sedang "murah" atau "mahal" relatif terhadap histori sendiri (konsep sama dengan `/PEBAND` di PDF, meski PE Band asli pakai band atas/bawah dari rata-rata historis, bukan garis tunggal) |

### 2.6 Tab "Dividends"

| Item dari PDF | Jenis Grafik yang Ditambahkan |
|---|---|
| Deviden history (`/DV`, `/DVDHIST`) | **Bar chart** nilai dividen per tahun/periode pembagian |

### 2.7 Tab "Trend" (Sudah Ada di Screenshot)

Tab ini kemungkinan besar sudah menampilkan grafik RSI/MACD (terlihat dari screenshot kedua,
meski itu di bagian Technical Analysis) — untuk versi Fundamental, "Trend" diisi:

| Item | Jenis Grafik |
|---|---|
| Revenue & Net Income bersama dalam satu chart | **Line chart ganda** (2 garis, sumbu Y sama atau dual-axis) — tren pertumbuhan pendapatan vs laba bersih dalam satu pandangan, melengkapi §2.1 yang memecah per-item |

### 2.8 Sumber Data Resmi — Parameter Method (Terkonfirmasi)

Berbeda dari `get_major_holders()` dkk. di §3 (dokumentasi minim), grup **Financials** di
`yfinance` **punya** halaman parameter resmi yang terisi lengkap. Berikut yang terkonfirmasi
langsung dari `ranaroussi.github.io/yfinance/reference/yfinance.financials.html` dan
sub-halaman method-nya:

| Method | Parameter | Nilai `freq` yang Diterima |
|---|---|---|
| `Ticker.get_income_stmt(as_dict=False, pretty=False, freq='yearly')` | `as_dict`, `pretty`, `freq` | `"yearly"`, `"quarterly"`, **atau `"trailing"`** (TTM — trailing twelve months) |
| `Ticker.get_balance_sheet(as_dict=False, pretty=False, freq='yearly')` | `as_dict`, `pretty`, `freq` | `"yearly"` atau `"quarterly"` **saja** — **tidak** ada opsi `"trailing"` (balance sheet adalah snapshot per titik waktu, bukan akumulasi 12 bulan, jadi konsep TTM tidak berlaku di sini) |
| `Ticker.get_cashflow(as_dict=False, pretty=False, freq='yearly')` | `as_dict`, `pretty`, `freq` | Mengikuti pola sama seperti `get_income_stmt` (tersedia varian `ttm_cashflow` sebagai property terpisah di daftar API, mengindikasikan `"trailing"` juga didukung — **pola ini konsisten tapi parameter persisnya belum di-cross-check langsung ke halaman `get_cashflow`**, lihat §2.9) |

**Implikasi untuk kode:** Toggle **Annually/Quarterly** yang disebut di §2.1 (mengikuti konsep
`/FC` PDF dengan parameter `A`/`Q`) **bisa langsung dipetakan** ke parameter `freq` resmi ini —
`freq="yearly"` untuk toggle "Annually", `freq="quarterly"` untuk toggle "Quarterly". Untuk tab
Cash Flow (§2.4) yang di screenshot sudah menampilkan angka TTM-style (`77.51T`, dst.), opsi
`freq="trailing"` pada `get_income_stmt`/kemungkinan `get_cashflow` **relevan langsung dipakai**
sebagai sumber, bukan perlu dihitung manual dari data quarterly.

**Parameter `pretty=True`** juga berguna langsung — memformat nama baris jadi lebih mudah
dibaca (kemungkinan mengubah `netIncome` jadi `Net Income`, dst.), berpotensi mengurangi
kebutuhan mapping manual nama field ke label UI yang sebelumnya diasumsikan perlu di
`2026-09-08_AnalysisPage_v1.md` §7.

### 2.9 Yang MASIH Belum Terverifikasi (Meski Parameter Method Sudah Jelas)

Penting dibedakan: dokumentasi resmi §2.8 mengonfirmasi **cara memanggil** method-nya (parameter
apa saja yang diterima), tapi **tidak** mengonfirmasi **isi baris data** yang dikembalikan:

- [ ] Nama baris/akun persis di DataFrame hasil (`"Total Revenue"`? `"TotalRevenue"`? apakah
      cocok 1:1 dengan istilah PDF seperti "Pendapatan", "Laba Kotor", dst.) — halaman referensi
      resmi tidak menampilkan contoh output, hanya signature parameter.
- [ ] Apakah `pretty=True` benar-benar menghasilkan nama baris yang sesuai ekspektasi UI, atau
      tetap perlu mapping manual tambahan (istilah `yfinance` adalah istilah akuntansi Inggris
      umum, belum tentu sama persis dengan istilah PDF yang berbahasa Indonesia — misal "Laba
      Usaha" vs kemungkinan nama `yfinance`-nya "Operating Income").
- [ ] Cakupan data untuk simbol IDX (`.JK`) — parameter `freq="trailing"` dan `pretty=True`
      terkonfirmasi *ada* sebagai fitur API, tapi tidak berarti data IDX otomatis lengkap.
      Checklist verifikasi cakupan IDX yang sudah dicatat di
      `2026-09-08_AnalysisPage_v1.md` §5.2 **tetap berlaku penuh**.
- [ ] Parameter `get_cashflow` belum di-cross-check langsung ke halaman resminya (baru
      diasumsikan konsisten dengan `get_income_stmt` berdasar pola penamaan API yang serupa) —
      perlu 1 pengecekan tambahan untuk kepastian penuh.

### 2.10 Kode — Fungsi Backend Memakai Parameter Resmi

```python
# backend/app/services/market_data.py — fungsi baru, menggantikan pendekatan
# get_fundamentals_snapshot() yang dirancang di 2026-09-08_AnalysisPage_v1.md §7
# (yang belum eksplisit memakai parameter freq/pretty resmi)

def get_financial_statement(
    symbol: str,
    statement: str,  # "income_stmt" | "balance_sheet" | "cashflow"
    freq: str = "quarterly",  # "yearly" | "quarterly" | "trailing" (income_stmt only, §2.8)
) -> dict | None:
    """
    Ambil satu laporan keuangan dengan freq eksplisit, memakai parameter resmi
    yfinance (dikonfirmasi di 2026-09-21_FundamentalStrategy_v1.md §2.8).

    PENTING: freq="trailing" HANYA valid untuk statement="income_stmt" (dan
    kemungkinan "cashflow", belum terverifikasi penuh — lihat §2.9). Untuk
    statement="balance_sheet", freq="trailing" akan error karena API resmi
    tidak mendukungnya (balance sheet = snapshot, bukan akumulasi periode).

    pretty=True dipakai supaya nama baris lebih mudah dipetakan ke label UI,
    TAPI kecocokan istilah dengan UI Bahasa Indonesia (§2.9) tetap perlu dicek
    manual — pretty=True belum tentu menghasilkan istilah yang pas untuk
    ditampilkan langsung tanpa mapping tambahan.
    """
    ticker = yf.Ticker(symbol)

    method_map = {
        "income_stmt": ticker.get_income_stmt,
        "balance_sheet": ticker.get_balance_sheet,
        "cashflow": ticker.get_cashflow,
    }
    method = method_map.get(statement)
    if method is None:
        raise ValueError(f"statement tidak dikenal: {statement}")

    if statement == "balance_sheet" and freq == "trailing":
        # Dicegah eksplisit di sini, bukan dibiarkan error mentah dari yfinance,
        # supaya pesan errornya jelas menjelaskan batasan API (§2.8)
        raise ValueError("freq='trailing' tidak didukung untuk balance_sheet")

    try:
        df = method(freq=freq, pretty=True)
    except Exception:
        return None

    if df is None or df.empty:
        return None

    # Konversi ke format {periode: {nama_baris: nilai}} untuk dikonsumsi frontend
    # sebagai data bar/line chart (§2.1-2.7)
    return {
        "symbol": symbol,
        "statement": statement,
        "freq": freq,
        "periods": [str(col) for col in df.columns],
        "data": df.to_dict(),
    }
```

---

## 3. Sub-Tab Baru — Shareholder Analysis

### 3.1 Tujuan

Melengkapi section **HOLDER** dari PDF (halaman 26-27) yang saat ini belum tercakup sama sekali
di `2026-09-08_AnalysisPage_v1.md` §5. Menampilkan siapa saja pemegang saham utama, komposisi
institusional vs individu, dan aktivitas insider.

### 3.2 Struktur Konten

| Bagian | Isi | Sumber |
|---|---|---|
| **Major Holders Breakdown** | Persentase kepemilikan oleh insider, institusi, dan publik | `yfinance.Ticker.get_major_holders()` |
| **Top Institutional Holders** | Tabel nama institusi + jumlah saham + persentase kepemilikan | `yfinance.Ticker.institutional_holders` |
| **Insider Transactions** | Riwayat transaksi jual/beli oleh komisaris/direksi (mirip konsep `/DTLNPB`/`/DTLNPS` di PDF — net buy/sell insider) | `yfinance.Ticker.insider_transactions` |
| **Ownership Composition Chart** | **Pie/donut chart** — visualisasi persentase Insider vs Institutional vs Public, mengikuti konsep `/O`/`/OT` PDF (komposisi Foreign/Domestik per tipe investor) | Turunan dari Major Holders Breakdown |

### 3.3 Kode — Fungsi Backend Baru

```python
# backend/app/services/market_data.py — fungsi baru

def get_shareholder_analysis(symbol: str) -> dict | None:
    """
    Gabungan data kepemilikan saham: major holders breakdown, top institutional
    holders, dan insider transactions terbaru.

    PENTING: struktur field return yfinance untuk ketiga sumber ini TIDAK
    terdokumentasi rinci di dokumentasi resmi (ranaroussi.github.io hanya
    menampilkan signature method, tanpa detail kolom) - field di bawah adalah
    dugaan awal berdasar konvensi penamaan yfinance yang umum, WAJIB
    diverifikasi terhadap respons live sebelum dianggap final (lihat SS3.4).
    """
    ticker = yf.Ticker(symbol)
    result = {"symbol": symbol}

    try:
        major = ticker.get_major_holders()
        if major is not None and not major.empty:
            result["major_holders"] = major.to_dict()
    except Exception:
        result["major_holders"] = None

    try:
        institutional = ticker.institutional_holders
        if institutional is not None and not institutional.empty:
            result["institutional_holders"] = institutional.head(10).to_dict("records")
    except Exception:
        result["institutional_holders"] = None

    try:
        insider = ticker.insider_transactions
        if insider is not None and not insider.empty:
            result["insider_transactions"] = insider.head(10).to_dict("records")
    except Exception:
        result["insider_transactions"] = None

    return result
```

### 3.4 Checklist Verifikasi Wajib Sebelum Implementasi

Konsisten dengan pola kehati-hatian yang sudah diterapkan berulang di dokumen desain
sebelumnya (`2026-09-07_DashboardPage_v1.3.md` §2.3 untuk `yfinance.Calendars`,
`2026-09-08_AnalysisPage_v1.md` §5 untuk data fundamental umum,
`2026-09-21_BillWilliamsProfitunity_v1.md` §2.4 untuk formula indikator):

- [ ] **Prioritas tertinggi:** Jalankan kode berikut di lingkungan dengan akses internet penuh
      untuk melihat struktur kolom persis sebelum menulis parsing final:
      ```python
      import yfinance as yf
      t = yf.Ticker("AAPL")  # coba juga simbol IDX, misal "BBCA.JK", untuk cek cakupan
      print(t.get_major_holders())
      print(t.institutional_holders)
      print(t.insider_transactions)
      ```
- [ ] Konfirmasi apakah data ini tersedia untuk simbol IDX (`.JK`) — mengikuti pola yang sudah
      berulang ditemukan (Earnings Calendar, data fundamental) bahwa cakupan `yfinance` untuk
      IDX kerap lebih sempit dibanding US. **Kemungkinan besar sub-tab ini akan kosong/terbatas
      untuk saham Indonesia** — perlu penanganan UI yang jelas untuk kasus ini (pesan "data
      tidak tersedia", bukan tabel kosong tanpa keterangan).
- [ ] Konfirmasi nama kolom persis di `institutional_holders` (dugaan: `Holder`, `Shares`,
      `pctHeld`/`% Out`) dan `insider_transactions` (dugaan: `Insider`, `Position`, `Shares`,
      `Transaction`, `Value`) — nama field di kode §3.3 belum final.

### 3.5 Batasan Kepatuhan

Data insider transaction **bukan** sinyal beli/jual — murni informasi publik hasil pelaporan
regulator (SEC untuk US, OJK untuk Indonesia). UI wajib membingkai ini sebagai **informasi
transparansi kepemilikan**, bukan "insider sedang bullish/bearish" — konsisten dengan prinsip
kepatuhan yang sudah ditegaskan berulang (`Documentation-Business.md` §5).

---

## 4. Sub-Tab Baru (Opsional) — Fundamental Screener Strategy

### 4.1 Tujuan

Mereplikasi **konsep** `/SF` dari PDF (§1.2) — kombinasi filter multi-rasio fundamental — sebagai
alat bantu riset personal terhadap simbol yang sedang dilihat, **bukan** sebagai screener
lintas-pasar (itu di luar cakupan halaman Analysis yang fokus per-simbol).

### 4.2 Konsep — Bukan Screener, Tapi "Fit Check"

Karena halaman Analysis Overview berkonteks **satu simbol** (bukan screening lintas ribuan
saham seperti `/SF` di bot), dokumen ini mengadaptasi konsepnya jadi **"Fundamental Fit Check"**:
menampilkan apakah simbol yang sedang dilihat memenuhi kriteria value-investing umum, dengan
kriteria yang bisa diatur pengguna.

```python
# backend/app/services/market_data.py — fungsi baru

def check_fundamental_criteria(symbol: str, criteria: dict) -> dict:
    """
    Fit-check sederhana: bandingkan rasio fundamental simbol terhadap kriteria
    yang diberikan pengguna. Meniru KONSEP /SF dari PDF (kombinasi filter
    PBV/DER/ROE/EVEBITDA), diadaptasi untuk konteks satu simbol.

    criteria contoh: {"pbv_max": 1, "der_max": 1, "roe_min": 10, "evebitda_max": 10}
    Field rasio bergantung pada get_fundamentals_snapshot() dari
    2026-09-08_AnalysisPage_v1.md §7 checklist verifikasi — field PBV/DER/ROE/EVEBITDA
    belum tentu semuanya tersedia langsung dari yfinance, sebagian mungkin perlu
    dihitung manual dari income_stmt/balance_sheet (lihat catatan di
    2026-09-08_AnalysisPage_v1.md §5, status verifikasi serupa).
    """
    fundamentals = get_fundamentals_snapshot(symbol)  # existing, dari AnalysisPage_v1.md §7
    if fundamentals is None:
        return {"symbol": symbol, "available": False}

    results = {}
    for key, threshold in criteria.items():
        # Implementasi pembanding per kriteria — kerangka, bukan final
        # (bergantung field mana yang benar-benar tersedia setelah verifikasi)
        pass

    return {"symbol": symbol, "available": True, "criteria_results": results}
```

> ⚠️ **Status:** Sub-tab ini paling bergantung pada verifikasi field fundamental yang **belum
> selesai** (lihat `2026-09-08_AnalysisPage_v1.md` §7, checklist yang sama juga berlaku di sini)
> — kerangka fungsi di atas sengaja tidak diisi logic pembanding lengkap sampai field-field
> sumbernya (PBV, DER, ROE, EVEBITDA dari `yfinance`) terverifikasi persis namanya.

### 4.3 Batasan Kepatuhan

Hasil "Fit Check" **wajib** dibingkai sebagai alat bantu penyaringan berdasar kriteria yang
**pengguna sendiri tentukan** — bukan rekomendasi FinSight. Berbeda dari `simple_signal()` atau
Sentiment Gauge yang formulanya ditentukan sistem, di sini **pengguna** yang mengatur ambang
batas (`pbv_max`, `roe_min`, dst.), sehingga hasilnya adalah cerminan kriteria pengguna sendiri,
bukan penilaian independen FinSight — perbedaan ini perlu tersampaikan jelas di UI/copy.

---

## 5. Ringkasan Perubahan Kode

| File | Perubahan |
|---|---|
| `backend/app/services/market_data.py` | Fungsi baru: `get_financial_statement()` (§2.10, memakai parameter `freq`/`pretty` resmi), `get_shareholder_analysis()` (§3.3), `check_fundamental_criteria()` (§4.2, opsional) |
| `backend/app/api/schemas.py` | Response model baru untuk ketiga fungsi di atas |
| `backend/app/api/market.py` (atau `analysis.py`) | Endpoint baru: `GET /api/analysis/financials/{symbol}?statement=...&freq=...` (§2.10), `GET /api/analysis/shareholders/{symbol}`, opsional `POST /api/analysis/fundamental-fit/{symbol}` |
| Frontend — 7 sub-tab existing (Earnings, Margins, Balance Sheet, Cash Flow, Valuation, Dividends, Trend) | Tambah komponen grafik (bar/line chart) sesuai pemetaan §2 — reuse library chart yang sudah dipakai project (`lightweight-charts` atau charting library lain yang sudah ada di `frontend/package.json`); fetch data via endpoint `/financials` dengan `freq` sesuai toggle Annually/Quarterly/TTM (§2.8) |
| `frontend/components/analysis/ShareholderAnalysisPanel.tsx` (baru) | Render Major Holders breakdown, tabel Institutional Holders, tabel Insider Transactions, pie chart komposisi (§3.2) |
| `frontend/components/analysis/FundamentalFitCheck.tsx` (baru, opsional) | UI untuk atur kriteria + hasil fit-check (§4) |
| Sub-tab navigasi Analysis Overview | Tambah `Shareholder Analysis` (dan opsional `Screener Strategy`) ke daftar sub-tab tab Fundamental Analysis |

---

## 6. Ide Lanjutan (Di Luar Cakupan Rilis Pertama)

| Ide | Sumber PDF | Catatan |
|---|---|---|
| **PE Band** (pita valuasi atas/bawah dari rata-rata historis PER) | `/PEBAND` | Lebih kompleks dari line chart PER biasa di §2.5 — butuh perhitungan band, bukan garis tunggal |
| **Graham Number & Peter Lynch Value** | `/VAL` | Butuh model valuasi intrinsik terpisah, effort lebih besar |
| **Morning Star Quantitative Rating** | `/RATING` | Bergantung data pihak ketiga (Morning Star) yang kemungkinan tidak tersedia gratis via `yfinance` — perlu riset sumber data terpisah |
| **Minervini Fundamental Score** | `/SCORE MVF` | Formula tidak terungkap di PDF sumber, perlu riset independen jika ingin direplikasi |
| **Sector/Index Comparison** | `/PC` (performance comparative idxsektor vs IHSG) | Berpotensi melengkapi Sector Heatmap yang sudah ada (`2026-09-06_DashboardPage_v1.md` §5.2), tapi dari sudut pandang fundamental bukan harga |

---

## 7. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] **Prioritas tertinggi:** Jalankan checklist verifikasi §3.4 sebelum implementasi
      Shareholder Analysis — struktur data `yfinance` untuk holder/insider belum terverifikasi.
- [ ] Apakah sub-tab "Screener Strategy" (§4) masuk rilis pertama, atau ditunda sampai field
      fundamental (`2026-09-08_AnalysisPage_v1.md` §7) selesai diverifikasi lebih dulu?
- [ ] Library charting mana yang dipakai untuk bar/line chart di §2 — apakah reuse
      `lightweight-charts` (sudah dipakai untuk candlestick) atau library terpisah yang lebih
      cocok untuk bar chart sederhana (candlestick chart library kurang natural untuk bar chart
      biasa).
- [ ] Untuk simbol non-equity (crypto, index, forex) — seluruh tab Fundamental Analysis
      (termasuk Shareholder Analysis baru ini) perlu disembunyikan otomatis, konsisten dengan
      catatan di `2026-09-08_AnalysisPage_v1.md` §5.1 soal "UI perlu menyembunyikan panel ini
      otomatis untuk simbol non-equity".
- [ ] Apakah `pretty=True` (§2.8, §2.10) menghasilkan nama baris yang cukup baik dipakai
      langsung sebagai label UI, atau tetap perlu kamus mapping manual Inggris→Indonesia
      (misal "Operating Income" → "Laba Usaha") supaya konsisten dengan istilah PDF sumber.
- [ ] Konfirmasi eksplisit apakah `freq="trailing"` juga didukung `get_cashflow()`
      (§2.9) — saat ini baru diasumsikan berdasar pola API yang serupa, belum di-cross-check
      langsung ke halaman dokumentasi resminya.

---

## 8. Dokumen Terkait

- `2026-09-08_AnalysisPage_v1.md` §5, §7 — Tab Fundamental Analysis rancangan awal & checklist
  verifikasi field yang berlaku juga untuk dokumen ini
- `2026-09-07_DashboardPage_v1.3.md` §2.3 — pola checklist verifikasi yang direplikasi di §3.4
- `2026-09-21_BillWilliamsProfitunity_v1.md` — dokumen lain dari sumber PDF yang sama, pola
  pemisahan "dari PDF" vs "pengetahuan umum" yang direplikasi di §1.1–1.2 dokumen ini
- `yfinance.financials` (`ranaroussi.github.io/yfinance/reference/yfinance.financials.html`) —
  referensi resmi parameter `get_income_stmt()`/`get_balance_sheet()`/`get_cashflow()` (§2.8)
- `Documentation-Business.md` §5 — kebutuhan disclaimer, berlaku untuk §3.5 dan §4.3