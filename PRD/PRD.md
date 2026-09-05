# Product Requirements Document (PRD)
## AI Trading Dashboard

> **Versi Dokumen:** 2.0
> **Status:** Tahap 1 Selesai — Tahap 2 Sebagian (Next.js + FastAPI) — Tahap 3 Direncanakan
> **Terakhir Diperbarui:** 5 September 2026

---

## 1. Ringkasan Eksekutif

AI Trading Dashboard adalah aplikasi berbasis web untuk memantau harga pasar (saham, crypto, index) secara real-time-ish, menganalisis kondisi teknikal, dan membaca berita terkait — dirancang untuk investor/trader ritel yang butuh satu tempat terpusat untuk riset sebelum mengambil keputusan trading.

Produk dibangun secara bertahap:
1. **Tahap 1 (Selesai):** Dashboard lokal Streamlit, single-user
2. **Tahap 2 (Sebagian):** Web app Next.js + FastAPI — UI & API sudah jalan; auth/DB/hosting masih menyusul
3. **Tahap 3 (Direncanakan):** Model bisnis subscription dengan role Admin/Member dan pembayaran via Transfer Bank & Midtrans

---

## 2. Latar Belakang & Masalah yang Diselesaikan

### 2.1 Masalah
Investor ritel di Indonesia sering harus:
- Membuka banyak tab/aplikasi berbeda untuk cek harga, grafik, berita, dan indikator teknikal secara terpisah
- Membayar layanan data premium yang mahal untuk kebutuhan riset dasar
- Kesulitan memantau banyak simbol/saham sekaligus dalam satu tampilan yang ringkas

### 2.2 Solusi
Dashboard terpusat yang menggabungkan harga, grafik candlestick, indikator teknikal standar, dan berita — dalam satu tampilan, dengan watchlist yang bisa menampung banyak simbol sekaligus.

### 2.3 Target Pengguna
| Persona | Kebutuhan |
|---|---|
| Trader ritel harian | Pantau banyak simbol, butuh sinyal teknikal cepat |
| Investor jangka menengah/panjang | Butuh berita & tren MA/RSI untuk keputusan entry/exit |
| Pemula belajar trading | Butuh visualisasi yang mudah dibaca tanpa berlangganan platform mahal |

---

## 3. Tujuan Produk (Goals)

1. Menyediakan data harga & grafik yang cukup real-time untuk kebutuhan riset (bukan eksekusi order berkecepatan tinggi)
2. Menyederhanakan pembacaan indikator teknikal bagi pengguna non-teknis
3. Menjadi fondasi produk SaaS berlangganan yang relevan untuk pasar Indonesia (metode pembayaran lokal)

### 3.1 Non-Goals (Di Luar Cakupan Saat Ini)
- **Bukan** platform eksekusi order (tidak terhubung ke broker/exchange untuk transaksi jual-beli)
- **Bukan** penyedia sinyal/rekomendasi finansial berlisensi
- **Bukan** feed data real-time murni untuk high-frequency trading

---

## 4. Ruang Lingkup per Tahap

### 4.1 Tahap 1 — Dashboard Lokal ✅ *(Sudah Diimplementasikan)*

| Fitur | Deskripsi | Status |
|---|---|---|
| Watchlist multi-simbol | Tambah/hapus simbol saham/crypto/index, cari via nama | ✅ |
| Snapshot harga | Harga terkini, perubahan harian (nominal & persen) | ✅ |
| Grafik candlestick | OHLC dengan pilihan periode & interval | ✅ |
| Indikator teknikal | MA20, MA50, EMA, RSI14, MACD, Bollinger Bands | ✅ |
| Ringkasan sinyal teknikal | Interpretasi berbasis aturan (bukan rekomendasi finansial) | ✅ |
| Berita per simbol | Daftar berita terkait dari Yahoo Finance + fallback Google News RSS | ✅ |
| Multi-bahasa/lokasi | Default watchlist mencakup saham IDX (`.JK`) | ✅ |

### 4.2 Tahap 2 — Web App Multi-User 🟡 *(Sebagian Diimplementasikan)*

| Fitur | Deskripsi | Status | Prioritas |
|---|---|---|---|
| Backend API terpisah (FastAPI) | Pisahkan logic dari tampilan, expose REST endpoint | ✅ | Tinggi |
| Frontend custom (Next.js, dark mode) | UI analitis dense ala terminal trading, chart via TradingView `lightweight-charts` | ✅ | Tinggi |
| Autentikasi pengguna | Register, login, JWT session | 🔜 Belum ada — semua endpoint masih terbuka | Tinggi |
| Watchlist per akun (database) | Saat ini masih `localStorage` browser (per-device, bukan per-akun) | 🔜 Perlu Supabase + `user_id` | Tinggi |
| Migrasi sumber data | Evaluasi API berbayar (Polygon.io/Alpha Vantage/Twelve Data) untuk stabilitas skala | 🔜 Belum, masih `yfinance` | Sedang |
| Hosting cloud | Deploy ke VPS/Railway/Render dengan domain sendiri | 🔜 Belum di-deploy, masih local dev | Tinggi |
| Riwayat & preferensi user | Simpan preferensi tampilan, histori simbol yang dilihat | 🔜 Belum | Rendah |

> Detail teknis lengkap arsitektur frontend/backend ada di `Documentation-Program.md` §7. Batasan yang belum diselesaikan (auth, DB, rate-limiting) didaftar di §7.5 dokumen yang sama — **jangan deploy ke publik sebelum item-item itu ditutup.**

### 4.3 Tahap 3 — Subscription & Billing 🔜 *(Direncanakan)*

| Fitur | Deskripsi | Prioritas |
|---|---|---|
| Role **Admin** | Kelola user, lihat semua transaksi, atur paket & harga | Tinggi |
| Role **Member** | Akses fitur sesuai level langganan aktif | Tinggi |
| Paket langganan (tiers) | Contoh: Free (watchlist terbatas), Pro, Premium (fitur penuh) | Tinggi |
| Pembayaran — Transfer Bank | Member upload bukti transfer manual, Admin verifikasi & aktivasi | Tinggi |
| Pembayaran — Midtrans | Otomatis: QRIS, Virtual Account, e-wallet, kartu kredit | Tinggi |
| Notifikasi status pembayaran | Email/in-app saat pembayaran diverifikasi/ditolak | Sedang |
| Dashboard Admin | Statistik user aktif, pendapatan, status langganan | Sedang |
| Pembatasan fitur per tier | Enforce limit watchlist/fitur sesuai paket yang dibeli | Tinggi |

---

## 5. User Stories

### Tahap 1 (Implemented)
- **Sebagai** pengguna, **saya ingin** menambah simbol saham ke watchlist saya, **agar** saya bisa memantau harga beberapa saham sekaligus.
- **Sebagai** pengguna, **saya ingin** melihat grafik candlestick dengan indikator RSI/MACD, **agar** saya bisa menilai kondisi teknikal saham tanpa alat eksternal.
- **Sebagai** pengguna, **saya ingin** membaca berita terkait simbol yang saya pantau, **agar** saya paham konteks pergerakan harga.

### Tahap 2 (Planned)
- **Sebagai** pengguna, **saya ingin** login ke akun saya, **agar** watchlist saya tersimpan dan bisa diakses dari perangkat manapun.

### Tahap 3 (Planned)
- **Sebagai** calon member, **saya ingin** membayar langganan lewat QRIS/transfer bank, **agar** saya bisa mengakses fitur premium sesuai preferensi metode pembayaran saya.
- **Sebagai** Admin, **saya ingin** memverifikasi bukti transfer bank secara manual, **agar** member yang membayar lewat metode non-otomatis tetap bisa diaktifkan.
- **Sebagai** Admin, **saya ingin** melihat dashboard status semua langganan, **agar** saya bisa memantau pendapatan dan member aktif.

---

## 6. Model Bisnis (Ringkasan)

Detail lengkap ada di `Documentation-Business.md`. Ringkasan:
- Model **Freemium + Subscription tier** (Free / Pro / Premium)
- Target pasar: Indonesia, dengan metode pembayaran lokal (Transfer Bank manual, Midtrans untuk otomatisasi)
- Monetisasi murni dari biaya langganan bulanan/tahunan, **tidak ada iklan**

---

## 7. Batasan & Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| `yfinance` memakai endpoint tidak resmi Yahoo Finance | Bisa berhenti berfungsi/berubah sewaktu-waktu | Evaluasi API berbayar di Tahap 2 sebelum scale-up |
| Data bisa delay beberapa menit | Tidak cocok untuk eksekusi order presisi tinggi | Sudah dikomunikasikan jelas ke user via disclaimer di UI |
| Rate-limit saat banyak user simultan | Dashboard lambat/gagal load | Caching (`st.cache_data`) sudah diterapkan di Tahap 1; pertimbangkan message queue/cache layer terpusat di Tahap 2 |
| Kepatuhan regulasi finansial (OJK) | Produk bisa dianggap memberi nasihat investasi | Disclaimer tegas di setiap tampilan sinyal; tidak ada rekomendasi beli/jual eksplisit |
| Keamanan data pembayaran (Tahap 3) | Kebocoran data kartu/transaksi | Gunakan Midtrans (PCI-DSS compliant), jangan simpan data kartu sendiri |

---

## 8. Metrik Keberhasilan (Success Metrics)

### Tahap 1
- Dashboard bisa menampilkan data untuk watchlist >10 simbol tanpa error
- Waktu load halaman < 5 detik untuk watchlist standar

### Tahap 2
- Waktu respons API < 1 detik untuk request watchlist
- Uptime backend > 99%

### Tahap 3
- Konversi Free → Paid tier
- Waktu verifikasi pembayaran manual (Transfer Bank) < 24 jam
- Tingkat keberhasilan pembayaran otomatis (Midtrans) > 95%

---

## 9. Dependensi Dokumen Terkait

- **`Documentation-Business.md`** — Detail model bisnis, struktur harga, alur billing, kebutuhan operasional
- **`Documentation-Program.md`** — Detail teknis, arsitektur kode, flow proses, struktur data
- **`../Documenatation/docu.md`** — Panduan ringkas Enhancement Tahap 2 (cara jalan, checklist, endpoint)
- **`../ai-trading-dashboard/README-Tahap2.md`** — Quick start backend + frontend
