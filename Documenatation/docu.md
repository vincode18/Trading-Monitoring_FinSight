# AI Trading Dashboard — Dokumentasi Enhancement Tahap 2

> **Versi:** 2.0  
> **Tanggal:** 5 September 2026  
> **Status:** Frontend Next.js + Backend FastAPI telah diintegrasikan ke project utama

---

## 1. Ringkasan Enhancement

Tahap 2 meng-upgrade **My Trading Dashboard** dari aplikasi Streamlit monolitik (Tahap 1)
menjadi arsitektur **client–server**:

| Lapisan | Teknologi | Port | Peran |
|---|---|---|---|
| Frontend | Next.js 14 + Tailwind + `lightweight-charts` | `3000` | UI native web, dark analytical |
| Backend | FastAPI + yfinance + pandas | `8000` | REST API harga, chart, berita |
| Legacy | Streamlit (`app/`) | `8501` | Referensi/fallback Tahap 1 |

Logic data & indikator **sama** dengan Tahap 1; yang berubah adalah cara presentasi
dan komunikasi (REST JSON, bukan re-render script Streamlit).

---

## 2. Apa yang Sudah Diimplementasikan

- [x] Backend FastAPI: `/api/market/*`, `/api/chart/*`, `/api/news/*`, `/api/health`
- [x] Frontend Next.js: Sidebar, Watchlist, Candlestick (MA/RSI/MACD/Bollinger), News, Signal Summary
- [x] Polling harga & chart tiap 30 detik (SWR)
- [x] Watchlist tersimpan di `localStorage` browser
- [x] CORS untuk `http://localhost:3000`
- [x] TTL cache in-memory di backend (pengganti `st.cache_data`)
- [x] Dokumentasi teknis di `PRD/Documentation-Program.md` §7
- [x] README Tahap 2 di `ai-trading-dashboard/README-Tahap2.md`

## 3. Belum Selesai (Roadmap Lanjutan)

- [x] Database Supabase + Prisma (`users`, `watchlist_items`, `subscriptions`, `payments`) — lihat `Environment/Enhancement-system-setup_DatabaseSupabase.md`
- [ ] Autentikasi JWT (register/login)
- [ ] Watchlist per-user di database (ganti `localStorage`)
- [ ] Rate-limiting API
- [ ] Deploy cloud (VPS / Railway / Render)
- [ ] Evaluasi API data berbayar (Polygon / Alpha Vantage / Twelve Data)

---

## 4. Cara Menjalankan (Development)

Jalankan dari folder `ai-trading-dashboard/`.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs  

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

- UI: http://localhost:3000  

Pastikan `NEXT_PUBLIC_API_URL=http://localhost:8000` di `frontend/.env.local`.

---

## 5. Alur Data

```
Browser (Next.js :3000)
   │  fetch via lib/api.ts (SWR, refresh 30s)
   ▼
FastAPI (:8000)
   │  api/market.py | api/chart.py | api/news.py
   ▼
services/ + indicators/
   │
   ▼
yfinance → Yahoo Finance
feedparser → Google News RSS (fallback berita)
```

---

## 6. Endpoint API Utama

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/market/quote/{symbol}` | Snapshot harga 1 simbol |
| `POST` | `/api/market/watchlist` | Body `{ "symbols": [...] }` → quotes batch |
| `GET` | `/api/market/search?q=` | Cari simbol |
| `GET` | `/api/chart/{symbol}?period=&interval=` | Candle + indikator + signal |
| `GET` | `/api/news/{symbol}` | Berita terkait simbol |

---

## 7. Komponen Frontend Utama

| File | Tanggung Jawab |
|---|---|
| `app/page.tsx` | Orkestrasi state, SWR fetch, layout dashboard |
| `components/Sidebar.tsx` | Cari / tambah / hapus simbol |
| `components/WatchlistTable.tsx` | Tabel dense + warna naik/turun |
| `components/CandlestickChart.tsx` | 3 panel lightweight-charts (harga, RSI, MACD) |
| `components/ChartControls.tsx` | Periode, interval, toggle Bollinger |
| `components/NewsPanel.tsx` | Daftar berita |
| `components/SignalSummary.tsx` | Ringkasan kondisi teknikal |
| `lib/api.ts` | Satu-satunya client HTTP ke backend |

---

## 8. Design Tokens (Dark Analytical)

| Token | Nilai |
|---|---|
| Background | `#0E1117` |
| Panel | `#161B22` |
| Border | `#2A313C` |
| Naik | `#00E676` |
| Turun | `#FF5252` |
| Font UI | Inter |
| Font data | JetBrains Mono |

---

## 9. Struktur Folder Setelah Upgrade

```
ai-trading-dashboard/          ← project app
├── app/                       ← Tahap 1 Streamlit (tetap)
├── backend/                   ← Tahap 2 FastAPI (BARU)
├── frontend/                  ← Tahap 2 Next.js (BARU)
├── README.md
└── README-Tahap2.md

Documenatation/
└── docu.md                    ← dokumen ini (panduan enhancement)

PRD/
├── PRD.md                     ← status Tahap 2 diperbarui
├── Documentation-Program.md   ← arsitektur teknis lengkap (§7 Tahap 2)
└── Documentation-Business.md
```

---

## 10. Dokumen Terkait

| Dokumen | Isi |
|---|---|
| `PRD/PRD.md` | Ruang lingkup produk & status fitur per tahap |
| `PRD/Documentation-Program.md` | Arsitektur, flow proses, API, setup Supabase/Prisma |
| `PRD/Documentation-Business.md` | Model bisnis & billing |
| `ai-trading-dashboard/README-Tahap2.md` | Quick start backend + frontend |

---

## 11. Checklist Verifikasi Upgrade

- [x] `backend/` dan `frontend/` ada di dalam `ai-trading-dashboard/`
- [x] Backend jalan di port 8000, `/api/health` mengembalikan `{"status":"ok"}`
- [x] Frontend jalan di port 3000 tanpa error koneksi
- [ ] Watchlist menampilkan harga (hijau/merah)
- [ ] Klik simbol → chart candlestick + RSI + MACD ter-render
- [ ] Tab Berita menampilkan item atau pesan kosong yang jelas
- [ ] Refresh browser → watchlist masih ada (localStorage)

---

## 12. Troubleshooting Windows (`npm install` / Next.js)

### Node version
Pakai **Node.js 18–22 LTS** (disarankan 20). Node 25+ sering gagal load binary SWC (`not a valid Win32 application`). File `.nvmrc` di `frontend/` berisi `20`.

### EPERM / antivirus
Jika `npm install` gagal dengan **EPERM** saat copy `@next/swc-win32-x64-msvc`:

1. Tutup semua proses `node`
2. Hapus `frontend/node_modules` lalu jalankan ulang `npm install`
3. Alternatif: unduh SWC manual lalu extract ke `node_modules/@next/swc-win32-x64-msvc/`

### Menjalankan Next tanpa `.bin`
```bash
node node_modules/next/dist/bin/next dev
```
