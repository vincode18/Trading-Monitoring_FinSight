# Enhancement Design — Global Search (Command Palette)

> **Versi Dokumen:** 1.0
> **File Code:** `2026-09-08_GlobalSearch_v1`
> **Terkait:** `design_DashboardPage_v1.md` §4.3 (`lib/marketConfig.ts`), §3 (posisi sidebar &
> menu Chart); referensi visual "Trading Monitor" dark search bar dan "Command Palette" terminal
> **Status:** ✅ Diimplementasikan
> **Terakhir Diperbarui:** 21 September 2026
> **Audiens:** Frontend Developer, Backend Developer

---

## 1. Latar Belakang

Permintaan: tambahkan **Global Search** berupa pop-up command palette, dipicu dari sub-menu
**Chart** (lihat screenshot 1 — halaman Chart BBCA.JK yang sudah berjalan sesuai
`design_DashboardPage_v1.md`), dengan referensi visual command palette bergaya trading terminal
profesional (screenshot 2).

Prompt desain yang diberikan (65 kata) menjadi acuan visual utama:

> *"Design a sleek dark-mode Global Search interface for a professional Trading Monitor
> Platform. Create a prominent search bar with instant symbol, company, index, and asset
> results. Add tab filters for Watchlist, US Markets, Indonesia Market, Asian Markets,
> Commodities, Forex, Crypto, and Indices. Organize results into grouped sections with ticker,
> name, price, daily change, market status, and compact neon-green highlights."*

Dokumen ini menerjemahkan prompt tersebut menjadi spesifikasi yang **realistis terhadap
kapasitas backend saat ini** — beberapa elemen di referensi visual (screenshot 2) melebihi
cakupan data yang tersedia dari `yfinance` yang sudah jadi fondasi project ini. Bagian yang
melebihi cakupan ditandai eksplisit di §2.3, bukan diam-diam diasumsikan sudah bisa.

### 1.1 Non-Goals
- **Bukan** fitur eksekusi order/trading (referensi visual punya elemen "Fast Entry",
  "Smart Alert Buy/Sell Ladder" — ini fitur order-entry trading terminal sungguhan, di luar
  cakupan aplikasi riset pasar yang sudah ditetapkan sejak `PRD.md`).
- **Bukan** sistem korelasi aset otomatis ("Trending Correlated Assets" di referensi) — butuh
  model analitik tersendiri, tidak tersedia dari `yfinance`.
- **Bukan** feed berita streaming real-time ("News Wire", "Streaming Dispatch") — project ini
  memakai `get_news_for_symbol()` (existing, polling, bukan push/streaming).
- Tidak mengubah struktur tab market (US/Indonesia/Crypto) yang sudah ditetapkan di
  `design_DashboardPage_v1.md` §4.2 — Global Search **menggunakan kembali** struktur itu,
  bukan membuat kategorisasi market paralel yang berbeda.

---

## 2. Cakupan Fitur

### 2.1 Trigger & Posisi

- **Trigger:** Ikon/tombol search di header sub-menu **Chart** (lihat screenshot 1 — area
  dropdown selector simbol `BBCA.JK ▾` di kiri atas grafik adalah kandidat lokasi tombol trigger,
  atau tombol search terpisah di sebelahnya).
- **Keyboard shortcut:** `Cmd/Ctrl + K` — konvensi umum command palette (terlihat juga di
  referensi screenshot 2, area kanan atas `Ctrl+K` sebagai salah satu hotkey yang ditampilkan).
- **Tampilan:** Modal overlay di tengah layar, dengan backdrop gelap semi-transparan menutupi
  konten di belakangnya — bukan dropdown inline, supaya fokus pencarian tidak terganggu elemen
  chart/indikator di belakang.
- **Menutup modal:** Tombol `×`, klik di luar area modal, atau tombol `Esc`.

### 2.2 Yang Bisa Diimplementasikan Langsung (Reuse Fondasi Existing)

| Elemen dari Prompt Desain | Sumber Data / Implementasi |
|---|---|
| Search bar dengan hasil instan simbol/perusahaan | `search_symbol()` — fungsi **existing** di `market_data.py`, sudah dipakai di `Sidebar.tsx` untuk pencarian watchlist |
| Tab filter **Watchlist** | Watchlist personal pengguna (existing, `localStorage` per `design_DashboardPage_v1.1.md`) |
| Tab filter **US Markets**, **Indonesia**, **Crypto** | Reuse `moverPoolSymbols` dari `lib/marketConfig.ts` (existing, dari `design_DashboardPage_v1.1.md` §5.2) — filter hasil pencarian terhadap pool simbol per market |
| Tab filter **Forex** | Reuse `forexPairs` dari `lib/marketConfig.ts` (existing, dari `design_DashboardPage_v1.1.md` §3) |
| Tab filter **Indices** | Index utama per market (`^GSPC`, `^JKSE`, dst., dari `design_DashboardPage_v1.md` §4.4) + index tambahan lain yang bisa dicari via `search_symbol()` |
| Harga, perubahan harian, badge warna hijau/merah | `get_quote_snapshot()` — fungsi **existing**, dipanggil untuk tiap hasil pencarian yang tampil |
| Highlight neon-green pada elemen aktif/terpilih | Token `positive` (`#00E676`) — **sudah** jadi standar warna project sejak `Enhancement-Design-1-Visual-Business.md` §3.2, tinggal diterapkan konsisten |

### 2.3 Yang TIDAK Bisa Diimplementasikan Langsung — Penyesuaian dari Referensi

> Bagian ini membedakan realita cakupan project dari elemen visual referensi (screenshot 2) yang
> tidak bisa langsung ditiru 1:1 karena data/fiturnya belum ada.

| Elemen di Referensi Visual | Kendala | Penyesuaian yang Diusulkan |
|---|---|---|
| Tab filter **"Asian Markets"** terpisah dari Indonesia | Project saat ini hanya punya 3 market (US/Indonesia/Crypto) — belum ada definisi pool simbol untuk "Asia" secara umum (Jepang, Korea, Singapura, dll) | **Tidak disertakan** di rilis pertama. Jika dibutuhkan, perlu dokumen enhancement terpisah untuk mendefinisikan pool "Asian Markets" terlebih dulu (di luar cakupan dokumen ini) |
| Tab filter **"Commodities"** | `yfinance` mendukung simbol komoditas (`GC=F` untuk emas, `CL=F` untuk minyak, dst.), tapi **belum ada** pool/daftar komoditas yang didefinisikan di `marketConfig.ts` manapun | Ditambahkan sebagai kategori baru dengan daftar terbatas (lihat §3.3) — bukan filter dinamis penuh, karena belum ada sumber "semua komoditas" yang terstruktur dari `yfinance` |
| Kolom **"Market Status"** (dari prompt desain: *"...price, daily change, market status..."*) | `QuoteSnapshot.market_state` (existing field, dari `Documentation-Program.md` §4.1) **sudah tersedia** — ini sebenarnya **bisa** langsung dipakai, dipindahkan dari §2.3 ke konfirmasi berikut: ✅ field ini valid dipakai | — |
| Badge index membership (`S&P 500`, `NASDAQ`, `IDX`, `L45`, `SPOT`, `PERP` di screenshot 2) | `search_symbol()` (existing) mengembalikan `exchange` dan `type`, tapi **tidak** mengembalikan keanggotaan index spesifik (misal "apakah AAPL bagian dari S&P 500") — itu butuh data tambahan yang tidak tersedia dari `yfinance.Search()` | Badge disederhanakan memakai field yang **memang tersedia**: `exchange` (`NASDAQ`, `IDX`) dan `type` (`EQUITY`, `CRYPTOCURRENCY`, `INDEX`) — bukan meniru badge index membership dari referensi |
| **Quick Discovery & Pulse** (panel kanan di screenshot 2: Fast Entry, Smart Alert, Benchmark, News Wire, Streaming Dispatch, Trending Correlated Assets) | Seluruh panel ini adalah fitur **trading terminal aktif** (order entry, alert engine, correlation model, news streaming) — bukan fitur pencarian, dan jauh di luar cakupan §1.1 (Non-Goals) | **Tidak disertakan sama sekali.** Ini bukan bagian dari "Global Search", melainkan modul terpisah yang tidak ada dalam roadmap manapun sejauh ini (`PRD.md`) |
| Field koefisien korelasi (`COEFF > 0.42` di referensi) | Butuh model analitik korelasi antar-aset — tidak ada di `technical.py` maupun rencana manapun | Tidak disertakan (bagian dari Quick Discovery & Pulse yang di-exclude) |

**Ringkasan keputusan:** Dokumen ini mengadopsi **struktur interaksi** dari referensi visual
(search bar prominent, tab filter, grouped results, neon-green highlight) tapi **tidak**
mengadopsi elemen trading-terminal aktif (order entry, alerts, correlation, news streaming) yang
ada di panel kanan referensi — itu di luar cakupan produk riset pasar yang sudah ditetapkan.

---

## 3. Spesifikasi Desain

### 3.1 Layout Modal

```
┌──────────────────────────────────────────────────────────────────┐
│  🔍  [ ketik simbol, nama perusahaan, atau index...          ]  × │
├──────────────────────────────────────────────────────────────────┤
│  [Semua] [Watchlist] [US] [Indonesia] [Crypto] [Forex] [Indices]  │  ← tab filter
│  [Commodities]                                                     │     (scroll horizontal
├──────────────────────────────────────────────────────────────────┤       jika tidak muat)
│  WATCHLIST SAYA                                                    │  ← grouped section
│  ┌────────────────────────────────────────────────────────────┐  │     (hanya tampil jika
│  │ BBCA.JK   PT Bank Central Asia Tbk      6,225.00   -1.19%  │  │      ada hasil match)
│  │ IDX · EQUITY                             REGULAR            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  HASIL LAINNYA                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ NVDA      NVIDIA Corp                     $878.35   +3.42%  │  │
│  │ NASDAQ · EQUITY                          REGULAR             │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ BTC-USD   Bitcoin USD                  $67,840.00  +4.12%   │  │
│  │ CCC · CRYPTOCURRENCY                     24/7                │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  ↑↓ navigasi   ↵ buka chart   Esc tutup                            │
└──────────────────────────────────────────────────────────────────┘
```

- Baris hasil aktif (fokus keyboard) mendapat border/background `panel-hover` + garis kiri
  tipis warna `positive`, konsisten dengan pola highlight di `WatchlistTable.tsx` (existing).
- Angka perubahan harian memakai warna `positive`/`negative` (existing token) — bukan hijau
  untuk semua entri seperti kesan visual di screenshot 2, karena itu tidak sesuai fungsi warna
  sebagai indikator naik/turun yang sudah jadi prinsip desain sejak `Enhancement-Design-1-Visual-Business.md`
  §3.2 ("Merah **hanya** untuk data negatif... tidak pernah dipakai sebagai warna UI dekoratif").

### 3.2 Grouped Sections

Hasil dikelompokkan berdasar sumber, urutan prioritas:

1. **Watchlist Saya** — simbol dari watchlist personal yang cocok dengan query, selalu di atas
2. **Hasil Lainnya** — hasil dari `search_symbol()` yang belum ada di watchlist, diurutkan
   berdasar relevansi bawaan `yfinance.Search()`

Jika tab filter market tertentu aktif (misal "Indonesia"), section "Hasil Lainnya" difilter
hanya menampilkan simbol yang match pool `moverPoolSymbols.indonesia` DAN cocok dengan query —
bukan memanggil `search_symbol()` global lalu filter belakangan (lihat §4.2 untuk detail teknis).

### 3.3 Tab Filter — Daftar Final

| Tab | Sumber Filter | Catatan |
|---|---|---|
| **Semua** | Tidak difilter, hasil `search_symbol()` apa adanya | Tab default saat modal dibuka |
| **Watchlist** | Watchlist personal (existing) | — |
| **US Markets** | `moverPoolSymbols.us` (existing) | — |
| **Indonesia** | `moverPoolSymbols.indonesia` (existing) | — |
| **Crypto** | `moverPoolSymbols.crypto` (existing) | — |
| **Forex** | `forexPairs` gabungan semua market (existing) | — |
| **Indices** | Index utama per market + index tambahan umum (`^DJI`, `^IXIC`, `^RUT`, dll) | Daftar index tambahan perlu didefinisikan sebagai array statis baru di `marketConfig.ts` |
| **Commodities** *(baru)* | Daftar terbatas, didefinisikan manual: `GC=F` (Gold), `SI=F` (Silver), `CL=F` (Crude Oil), `NG=F` (Natural Gas) | **Bukan** pencarian dinamis semua komoditas — hanya 4 simbol umum yang paling relevan untuk trader ritel, sesuai keterbatasan yang dicatat di §2.3 |

> Tab **"Asian Markets"** dari referensi visual **tidak disertakan** — lihat alasan di §2.3.

### 3.4 Konten per Baris Hasil

| Elemen | Sumber Field |
|---|---|
| Ticker | `symbol` (dari `search_symbol()` atau `QuoteSnapshot.symbol`) |
| Nama perusahaan/aset | `name` |
| Exchange & tipe aset (badge kecil) | `exchange`, `type` — contoh: `IDX · EQUITY`, `NASDAQ · EQUITY`, `CCC · CRYPTOCURRENCY` |
| Harga terkini | `QuoteSnapshot.last_price` (perlu dipanggil per hasil yang tampil — lihat performa di §4.3) |
| Perubahan harian | `QuoteSnapshot.change_pct`, warna `positive`/`negative` |
| Status pasar | `QuoteSnapshot.market_state` (existing field — `REGULAR`, `CLOSED`, dll) |

---

## 4. Spesifikasi Teknis & Kode

### 4.1 Komponen Frontend

```
frontend/components/GlobalSearch/
├── GlobalSearchModal.tsx       # Komponen utama: modal, keyboard handling, state
├── SearchTabs.tsx                # Tab filter horizontal (§3.3)
├── SearchResultGroup.tsx         # Wrapper "Watchlist Saya" / "Hasil Lainnya" (§3.2)
├── SearchResultRow.tsx           # Satu baris hasil (§3.4)
└── useGlobalSearch.ts            # Custom hook: state query, debounce, fetch, keyboard nav
```

### 4.2 Fungsi Baru di `useGlobalSearch.ts`

```typescript
// frontend/components/GlobalSearch/useGlobalSearch.ts
import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { MARKET_CONFIG } from '@/lib/marketConfig';
import type { SymbolSearchResult, QuoteSnapshot } from '@/types/market';

type SearchTab = 'all' | 'watchlist' | 'us' | 'indonesia' | 'crypto' | 'forex' | 'indices' | 'commodities';

const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'CL=F', 'NG=F'];
const EXTRA_INDEX_SYMBOLS = ['^DJI', '^IXIC', '^RUT'];

export function useGlobalSearch(watchlist: string[]) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [rawResults, setRawResults] = useState<SymbolSearchResult[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteSnapshot>>({});
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Debounce query — hindari panggil search_symbol() di tiap keystroke
  useEffect(() => {
    if (query.trim().length < 2) {
      setRawResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const results = await api.searchSymbol(query); // reuse endpoint existing
      setRawResults(results);
      setLoading(false);
    }, 250); // 250ms debounce, standar untuk search-as-you-type

    return () => clearTimeout(timeout);
  }, [query]);

  // Filter hasil berdasar tab aktif (§3.3) — dilakukan di sisi klien terhadap
  // rawResults yang sudah ter-fetch, BUKAN memanggil endpoint berbeda per tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return rawResults;

    const poolMap: Record<Exclude<SearchTab, 'all' | 'watchlist'>, string[]> = {
      us: MARKET_CONFIG.us.moverPoolSymbols,
      indonesia: MARKET_CONFIG.indonesia.moverPoolSymbols,
      crypto: MARKET_CONFIG.crypto.moverPoolSymbols,
      forex: [...MARKET_CONFIG.us.forexPairs, ...MARKET_CONFIG.indonesia.forexPairs],
      indices: [
        MARKET_CONFIG.us.mainIndex.symbol,
        MARKET_CONFIG.indonesia.mainIndex.symbol,
        MARKET_CONFIG.crypto.mainIndex.symbol,
        ...EXTRA_INDEX_SYMBOLS,
      ],
      commodities: COMMODITY_SYMBOLS,
    };

    if (activeTab === 'watchlist') {
      return rawResults.filter((r) => watchlist.includes(r.symbol));
    }

    const pool = poolMap[activeTab];
    return rawResults.filter((r) => pool.includes(r.symbol));
  }, [rawResults, activeTab, watchlist]);

  // Ambil quote (harga, change%, market_state) hanya untuk hasil yang benar-benar
  // ditampilkan — bukan seluruh rawResults, untuk batasi jumlah request (§4.3)
  useEffect(() => {
    const symbolsToFetch = filteredResults.slice(0, 10).map((r) => r.symbol);
    if (symbolsToFetch.length === 0) return;

    api.getWatchlistQuotes(symbolsToFetch).then((results) => {
      const map: Record<string, QuoteSnapshot> = {};
      results.forEach((q) => { map[q.symbol] = q; });
      setQuotes(map);
    });
  }, [filteredResults]);

  // Pisahkan grup Watchlist vs Hasil Lainnya (§3.2)
  const groupedResults = useMemo(() => {
    const inWatchlist = filteredResults.filter((r) => watchlist.includes(r.symbol));
    const others = filteredResults.filter((r) => !watchlist.includes(r.symbol));
    return { inWatchlist, others };
  }, [filteredResults, watchlist]);

  return {
    query, setQuery,
    activeTab, setActiveTab,
    groupedResults, quotes, loading,
    activeIndex, setActiveIndex,
  };
}
```

**Catatan implementasi:**
- Fungsi ini **tidak menambah endpoint backend baru** — murni reuse `api.searchSymbol()` dan
  `api.getWatchlistQuotes()` yang **sudah ada** (`lib/api.ts`, dari `Documentation-Program.md`
  §7.4), dengan filtering/grouping dilakukan di sisi klien.
- Debounce 250ms adalah nilai umum untuk search-as-you-type, bukan nilai yang sudah diuji khusus
  untuk project ini — bisa disesuaikan saat implementasi jika terasa terlalu cepat/lambat.

### 4.3 Pertimbangan Performa

**Masalah potensial:** Memanggil `get_quote_snapshot()` untuk **setiap** hasil pencarian yang
tampil bisa memperlambat modal jika query menghasilkan banyak match sekaligus.

**Mitigasi yang diterapkan di §4.2:**
- Quote hanya di-fetch untuk maksimal **10 hasil pertama** yang benar-benar ditampilkan
  (`filteredResults.slice(0, 10)`), bukan seluruh hasil mentah dari `search_symbol()`.
- Fetch harga memakai endpoint `POST /api/market/watchlist` (existing, **sudah** mendukung
  banyak simbol sekaligus dalam satu request) — bukan memanggil `get_quote_snapshot()`
  satu-satu per hasil, menghindari N-request untuk N-hasil.

### 4.4 Keyboard Navigation

| Tombol | Aksi |
|---|---|
| `Cmd/Ctrl + K` | Buka modal (dari mana saja di halaman Chart) |
| `↑` / `↓` | Pindah fokus antar hasil (termasuk lintas grup Watchlist → Hasil Lainnya) |
| `Enter` | Buka simbol terpilih — set sebagai simbol aktif di Chart (reuse state `selectedSymbol` yang sudah ada di halaman Dashboard/Chart), tutup modal |
| `Esc` | Tutup modal tanpa memilih |
| `Tab` | Pindah ke tab filter berikutnya (mengikuti pola "Tab: Next Category" di referensi visual) |

### 4.5 Integrasi ke Halaman Chart

| Komponen Existing | Perubahan |
|---|---|
| Halaman Chart (dari `design_DashboardPage_v1.md` §3, area dropdown `BBCA.JK ▾`) | Tambah tombol ikon search di sebelah dropdown selector simbol, memicu `GlobalSearchModal` |
| `lib/marketConfig.ts` (existing) | Tambah konstanta `COMMODITY_SYMBOLS`, `EXTRA_INDEX_SYMBOLS` (§4.2) |
| Global keyboard listener | Tambah listener `Cmd/Ctrl+K` di level layout aplikasi (bukan hanya halaman Chart), supaya shortcut konsisten dipakai dari halaman manapun — **catatan cakupan:** trigger *tombol* eksplisit diminta khusus di sub-menu Chart, tapi *shortcut keyboard* secara wajar diharapkan bekerja global, mengikuti konvensi command palette pada umumnya |

---

## 5. Ringkasan Perubahan Kode

| File | Perubahan |
|---|---|
| `frontend/components/GlobalSearch/*.tsx` (baru, 4 file) | Komponen modal, tabs, grouped result, result row (§4.1) |
| `frontend/components/GlobalSearch/useGlobalSearch.ts` (baru) | Logic state, debounce, filter, fetch quotes (§4.2) |
| `lib/marketConfig.ts` (existing, ditambah) | `COMMODITY_SYMBOLS`, `EXTRA_INDEX_SYMBOLS` (§3.3, §4.2) |
| Halaman Chart (existing) | Tambah tombol trigger search di header (§4.5) |
| Layout aplikasi (existing) | Tambah global keyboard listener `Cmd/Ctrl+K` (§4.5) |
| **Backend** | **Tidak ada perubahan** — seluruh fitur ini murni reuse `search_symbol()` dan `get_quote_snapshot()`/`get_multiple_snapshots()` yang sudah ada |

---

## 6. Yang Belum Diputuskan (Perlu Konfirmasi Lanjutan)

- [ ] Apakah tombol trigger search perlu tersedia juga di halaman lain (Dashboard, Watchlist,
      News), atau memang dikhususkan hanya di sub-menu Chart sesuai permintaan awal? (§4.5
      mengasumsikan shortcut keyboard tetap global, tapi tombol UI eksplisit hanya di Chart)
- [ ] Daftar final `EXTRA_INDEX_SYMBOLS` (§4.2) — apakah 3 index tambahan (`^DJI`, `^IXIC`,
      `^RUT`) sudah cukup, atau perlu index lain (misal `^VIX`, index IDX sektoral)?
- [ ] Daftar final `COMMODITY_SYMBOLS` (§3.3) — apakah 4 komoditas (Gold, Silver, Crude Oil,
      Natural Gas) sudah representatif, atau perlu ditambah (misal Copper `HG=F`)?
- [ ] Apakah tab **"Asian Markets"** perlu diusulkan sebagai dokumen enhancement terpisah di
      masa depan (§2.3), atau memang di luar rencana produk untuk saat ini?
- [ ] Nilai debounce 250ms (§4.2) — perlu diuji langsung apakah terasa responsif atau perlu
      disesuaikan.

---

## 7. Dokumen Terkait

- `design_DashboardPage_v1.md` §3, §4.3 — struktur sidebar, `MARKET_CONFIG` yang direuse
- `design_DashboardPage_v1.1.md` §5.2 — `moverPoolSymbols`, sumber utama filter tab market
- `Documentation-Program.md` §4.1, §7.4 — `search_symbol()`, `get_quote_snapshot()`, `lib/api.ts`
  yang seluruhnya direuse tanpa perubahan backend
- `Enhancement-Design-1-Visual-Business.md` §3.2 — prinsip warna `positive`/`negative`, dipakai
  konsisten di hasil pencarian (§3.1)