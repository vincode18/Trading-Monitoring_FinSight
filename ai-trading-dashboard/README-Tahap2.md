# AI Trading Dashboard — Tahap 2 (Frontend + Backend)

Versi web app dengan **frontend Next.js** (dark mode, dense analytical UI) dan
**backend FastAPI** terpisah. Ini melanjutkan dashboard Streamlit di Tahap 1
(`app/` di root) — logic data & indikator sama persis, hanya dipindah ke
arsitektur client-server supaya siap multi-user dan bisa di-hosting.

## Struktur

```
ai-trading-dashboard/
├── app/            # Tahap 1: Dashboard Streamlit (tetap ada, tidak terpakai lagi di Tahap 2)
├── backend/        # Tahap 2: REST API (FastAPI)
│   └── app/
│       ├── main.py           # Entry point
│       ├── api/               # Routes: market, chart, news
│       ├── services/          # market_data.py, news_data.py (Yahoo Finance)
│       ├── indicators/        # technical.py (MA/RSI/MACD/Bollinger)
│       ├── core/cache.py      # TTL cache in-memory
│       └── config/settings.py
└── frontend/       # Tahap 2: Web UI (Next.js + Tailwind + lightweight-charts)
    ├── app/                    # Pages (App Router)
    ├── components/             # Sidebar, WatchlistTable, CandlestickChart, dst.
    ├── lib/                    # API client, formatter
    └── types/                  # TypeScript types (mirror Pydantic schemas)
```

## Cara Menjalankan (Development)

Perlu **2 terminal terpisah** — backend dan frontend jalan sebagai proses berbeda.

### Terminal 1 — Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend jalan di `http://localhost:8000`. Cek dokumentasi API otomatis di
`http://localhost:8000/docs`.

### Terminal 2 — Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

> **Node.js:** pakai versi **18–22 LTS** (disarankan 20). Node 25+ sering gagal load SWC.

Frontend jalan di `http://localhost:3000`.

> **Penting:** Backend harus sudah jalan duluan sebelum frontend melakukan
> fetch data, kalau tidak akan muncul error koneksi di watchlist/chart.

## Desain Visual

Tema **dark mode analitis** — dirancang untuk kepadatan data tinggi ala terminal
trading, bukan tampilan konsumen yang lapang:

| Elemen | Nilai |
|---|---|
| Background utama | `#0E1117` |
| Panel/card | `#161B22` |
| Border | `#2A313C` |
| Aksen positif (naik) | `#00E676` |
| Aksen negatif (turun) | `#FF5252` |
| Font UI | Inter |
| Font angka/data | JetBrains Mono |

Chart candlestick pakai **`lightweight-charts`** — library sumber terbuka dari
TradingView sendiri, dipilih supaya visual & interaksi (zoom, crosshair, pan)
terasa familiar seperti platform trading profesional, bukan chart generik.

## Alur Data

```
Browser (Next.js)
   │  fetch (SWR, polling tiap 30 detik)
   ▼
FastAPI backend  ──────►  yfinance  ──────►  Yahoo Finance
   │
   ▼
Indikator dihitung di backend (technical.py)
   │
   ▼
JSON response ──► Frontend render (lightweight-charts, table, dst.)
```

Watchlist pengguna saat ini disimpan di **localStorage browser** (belum
terhubung ke akun/database) — ini akan digantikan oleh penyimpanan per-user
di Supabase setelah autentikasi (Tahap 2 lanjutan / Tahap 3) diimplementasikan
sesuai `Documentation-Program.md` §8 dan §7.

## Known Issues / Catatan Jujur

- **`npm audit`** akan menampilkan beberapa advisory Next.js/PostCSS. Sebagian
  besar berkaitan dengan fitur yang **tidak dipakai** di app ini (Server
  Actions, Middleware, Image Optimizer). Versi `next` sudah dikunci ke
  `14.2.35`, yang menutup CVE kritis RCE (CVE-2025-66478) dan DoS
  (CVE-2025-55184) dari advisory Desember 2025. Sebelum deploy produksi,
  jalankan `npm audit` ulang dan evaluasi apakah perlu upgrade ke Next.js 15.x.
- **`lightweight-charts` versi 4.x** dipakai (bukan 5.x) — API-nya beda
  (`chart.addCandlestickSeries()` vs `chart.addSeries(CandlestickSeries)`
  di v5). Kalau nanti upgrade ke v5, seluruh `components/CandlestickChart.tsx`
  perlu disesuaikan API call-nya.
- Auth belum ada — endpoint backend saat ini **terbuka tanpa proteksi**.
  Jangan deploy ke publik sebelum JWT/auth middleware ditambahkan (lihat
  roadmap Tahap 2 di `PRD.md`).

## Langkah Selanjutnya

Lihat `Documentation-Program.md` §7 dan §8 untuk detail migrasi database
(Supabase + Prisma) dan area yang perlu di-refactor sebelum production.
