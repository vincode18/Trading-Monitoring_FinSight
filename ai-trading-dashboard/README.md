# AI Trading Dashboard

Dashboard riset trading dengan data real-time-ish dari Yahoo Finance:
harga, grafik candlestick, indikator teknikal (MA, RSI, MACD, Bollinger Bands),
dan berita terkait simbol.

**Tahap aktif: Tahap 2** — frontend Next.js + backend FastAPI.
Tahap 1 (Streamlit di `app/`) tetap ada sebagai referensi/fallback.

## Cara Menjalankan — Tahap 2 (Recommended)

Perlu **2 terminal** — backend dan frontend berjalan terpisah.

### Terminal 1 — Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000` — API docs: `http://localhost:8000/docs`

### Terminal 2 — Frontend (Next.js)

> **Node.js 18–22 LTS** (disarankan 20). Node 25+ sering gagal load SWC binary.

```bash
cd frontend
npm install
copy .env.example .env.local  # Windows
# cp .env.example .env.local  # Mac/Linux
npm run dev
```

Frontend: `http://localhost:3000`

> Backend harus sudah jalan sebelum frontend fetch data.

Detail lengkap: lihat [`README-Tahap2.md`](./README-Tahap2.md).

## Cara Menjalankan — Tahap 1 (Streamlit, fallback)

```bash
pip install -r requirements.txt
copy .env.example .env
streamlit run app/main.py
```

Browser: `http://localhost:8501`

## Struktur Project

```
ai-trading-dashboard/
├── app/            # Tahap 1: Dashboard Streamlit (referensi/fallback)
├── backend/        # Tahap 2: REST API (FastAPI)
│   └── app/
│       ├── main.py
│       ├── api/           # market, chart, news
│       ├── services/      # Yahoo Finance + news
│       ├── indicators/    # MA/RSI/MACD/Bollinger
│       └── core/cache.py  # TTL cache in-memory
└── frontend/       # Tahap 2: Web UI (Next.js + Tailwind + lightweight-charts)
    ├── app/
    ├── components/
    ├── lib/
    └── types/
```

## Roadmap

### ✅ Tahap 1 — Dashboard Lokal
- Streamlit, single-user, data via `yfinance`

### ✅ Tahap 2 — Web App (sebagian)
- Backend FastAPI + Frontend Next.js (dark analytical UI)
- Chart via TradingView `lightweight-charts`
- Watchlist di `localStorage` (belum per-akun)
- 🔜 Auth JWT, Supabase + Prisma, hosting cloud

### 🔜 Tahap 3 — Subscription & Billing
- Role Admin/Member, Midtrans + Transfer Bank

## Catatan Penting

- **Bukan API resmi:** `yfinance` memakai endpoint Yahoo yang tidak resmi.
- **Bukan nasihat keuangan:** sinyal teknikal bersifat deskriptif, bukan rekomendasi beli/jual.
- **Data tertunda:** bukan feed real-time untuk high-frequency trading.
- **Jangan deploy publik** sebelum auth & rate-limiting ditambahkan.
