# Enhancement — System Setup: JWT Auth + CORS + Rate Limiting

> **Versi Dokumen:** 1.2
> **Terkait:** `Documentation-Program.md` §7.5–§7.6,
> `Environment/Enhancement-system-setup_DatabaseSupabase.md` (model `User`)
> **Status:** ✅ JWT Auth dasar diimplementasikan — 🔜 session cookie lihat §6 / Program §7.6
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Backend/Frontend Developer, AI agent yang melanjutkan implementasi

---

## 1. Latar Belakang

Tiga batasan keamanan berikut sudah tercatat sejak lama sebagai risiko terbuka di
`Documentation-Program.md` §7.5 dan ditutup oleh implementasi di checklist §3:

| Area | Kondisi saat ini |
|---|---|
| Autentikasi | **Ada** — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (Bearer JWT); market/chart/news tetap publik (read-only) |
| CORS | `allow_methods=["GET","POST"]`, `allow_headers=["Content-Type","Authorization"]` di `backend/app/main.py` |
| Rate limiting | `slowapi` — **30/minute per IP** pada search, chart, watchlist POST, news, serta register/login |

Model database untuk auth (`User`, dengan field `passwordHash`, `role` enum
`SYSTEM_ADMIN`/`ADMIN`/`MEMBER`) **sudah ada** di `backend/prisma/schema.prisma`.

---

## 2. Flow Thinking

```
[ Susun checklist implementasi Auth + CORS + Rate Limiting ]
      |
      v
[ Auth: butuh model User (sudah ada di schema), password hash,
  JWT encode/decode, endpoint register/login, dependency guard ]
      |
      v
[ CORS: cukup persempit config yang sudah ada di main.py ]
      |
      v
[ Rate Limiting: butuh library (slowapi) + middleware + limit per-endpoint ]
      |
      v
[ Urutkan berdasar dependency: Auth paling banyak file baru,
  CORS paling cepat, Rate Limiting di tengah ]
```

**Alasan urutan pengerjaan (A → B → C):**
1. **Auth (A)** dikerjakan lebih dulu karena paling banyak file baru dan jadi dasar untuk header
   `Authorization` yang perlu diizinkan CORS di langkah berikutnya.
2. **CORS (B)** paling cepat — hanya mengetatkan konfigurasi yang sudah ada, dan sudah tahu daftar
   header yang dibutuhkan (`Authorization`, `Content-Type`) setelah Auth selesai.
3. **Rate Limiting (C)** diletakkan di tengah/akhir karena independen dari Auth secara teknis
   (limit per-IP, bukan per-user), tapi baru masuk akal diprioritaskan setelah endpoint yang lebih
   sensitif (auth, chart, search) jelas.

---

## 3. Checklist Implementasi

### A. Auth JWT (Register/Login/Otorisasi)

- [x] Tambah dependency ke `backend/requirements.txt`: `passlib[bcrypt]==1.7.4`,
      `python-jose[cryptography]==3.3.0` (di-uncomment & pin versi). Hash runtime pakai
      `bcrypt` langsung (kompatibel dengan seed users; passlib tetap di requirements).
- [x] Buat `backend/app/core/security.py` — `hash_password`, `verify_password`,
      `create_access_token`, `decode_access_token`.
- [x] Tambah schema di `backend/app/api/schemas.py`: `RegisterRequest`, `LoginRequest`,
      `TokenResponse`, `UserResponse` (tanpa `passwordHash`).
- [x] Buat `backend/app/api/auth.py` — `POST /register`, `POST /login`, `GET /me`.
- [x] Buat `backend/app/core/deps.py` — `get_current_user()` via Bearer JWT.
- [x] Guard: `GET /api/auth/me` wajib login; market/chart/news tetap publik.
- [x] `JWT_SECRET_KEY` kuat di `.env` lokal (jangan commit); `.env.example` berisi placeholder +
      perintah generate.
- [x] Register router `auth` di `backend/app/main.py`.
- [x] `frontend/lib/api.ts` — opsi `auth: true` + `Authorization: Bearer`; token di
      `localStorage` key `trading-dashboard-token`.
- [x] Wire `AuthCard` (login/signup) ke `/api/auth/login` dan `/api/auth/register`.

### B. CORS Diperketat

- [x] `allow_methods=["GET", "POST"]` di `main.py`.
- [x] `allow_headers=["Content-Type", "Authorization"]`.
- [x] Catatan: `CORS_ORIGINS` production harus domain asli (env only).

### C. Rate Limiting

- [x] Dependency `slowapi==0.1.9` di `requirements.txt`.
- [x] `Limiter` di `app/core/rate_limit.py` + `app.state.limiter` + handler di `main.py`.
- [x] `@limiter.limit("30/minute")` pada:
      - `GET /api/market/search`
      - `GET /api/chart/{symbol}`
      - `POST /api/market/watchlist`
      - `GET /api/news/{symbol}`
      - (bonus) `POST /api/auth/register` dan `POST /api/auth/login`

### D. Verifikasi Akhir

- [x] `python -m py_compile` untuk file auth/CORS/rate-limit terkait.
- [x] Update `PRD/Documentation-Program.md` §7.5.
- [x] Update `ai-trading-dashboard/README-Tahap2.md` — cara Authorize di Swagger.

---

## 4. Struktur File Setelah Implementasi

| Path | Status | Fungsi |
|---|---|---|
| `backend/app/core/security.py` | Baru | Hash/verify password, encode/decode JWT |
| `backend/app/core/deps.py` | Baru | Dependency `get_current_user()` untuk guard endpoint |
| `backend/app/core/rate_limit.py` | Baru | Instance `Limiter` bersama |
| `backend/app/api/auth.py` | Baru | `POST /register`, `POST /login`, `GET /me` |
| `backend/app/api/schemas.py` | Diperluas | Schema auth |
| `backend/app/main.py` | Diperluas | Auth router, CORS ketat, rate limit handler |
| `frontend/lib/api.ts` | Diperluas | Auth helpers + Bearer header |
| `frontend/components/auth/AuthCard.tsx` | Diperluas | Wire ke API auth |

---

## 5. Batasan & Catatan Keamanan

- **Token di `localStorage`** adalah kompromi untuk rilis awal — rentan terhadap XSS dibanding
  httpOnly cookie. **Next step formal:** `PRD/Documentation-Program.md` **§7.6** (requirement C-1…C-9 + checklist).
  Migrasi ke cookie `HttpOnly` + `SameSite` wajib sebelum onboarding pengguna publik/berbayar.
- **Endpoint publik (`market/chart/news`) sengaja tidak digembok** — read-only, data pasar publik.
- **Rate limit per-IP** (bukan per-user) — pengguna di belakang NAT bisa saling memengaruhi kuota.
- **`JWT_SECRET_KEY` wajib digenerate ulang** kalau pernah tidak sengaja ter-commit/terekspos.
- Password **tidak pernah** dikembalikan di response (`UserResponse` tanpa `passwordHash`).

---

## 6. Next Enhancement — httpOnly Cookie Session

Status: 🔜 Belum diimplementasikan (checklist lengkap di `Documentation-Program.md` §7.6).

Ringkasnya:

1. Login/register set cookie `HttpOnly` (jangan andalkan body token ke `localStorage`).
2. `POST /api/auth/logout` clear cookie.
3. Frontend `credentials: 'include'`; hapus key `trading-dashboard-token`.
4. Mitigasi CSRF (`SameSite` ± CSRF token) didokumentasikan.
5. Hapus notes UI di `AuthCard` setelah Definition of Done §7.6 terpenuhi.

---

## 7. Dokumen Terkait

- `PRD/Documentation-Program.md` §7.5 (item #1–#2) dan **§7.6** — requirement + next steps cookie.
- `PRD/PRD.md` §4.2 — baris "Session storage (httpOnly cookie)".
- `ai-trading-dashboard/README-Tahap2.md` — testing Swagger Authorize (Bearer; akan diganti setelah §7.6).
