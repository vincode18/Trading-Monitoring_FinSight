# Enhancement — System Setup: JWT Auth + CORS + Rate Limiting

> **Versi Dokumen:** 1.0
> **Terkait:** `Documentation-Program.md` §7.5 (Batasan: Autentikasi & Rate-limiting belum ada),
> `Environment/Enhancement-system-setup_DatabaseSupabase.md` (model `User` sudah tersedia)
> **Status:** 🔜 Diusulkan — belum diimplementasikan
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Backend/Frontend Developer, AI agent yang melanjutkan implementasi

---

## 1. Latar Belakang

Tiga batasan keamanan berikut sudah tercatat sejak lama sebagai risiko terbuka di
`Documentation-Program.md` §7.5 dan belum ditutup:

| Area | Kondisi saat ini |
|---|---|
| Autentikasi | **Tidak ada** — seluruh endpoint `backend/app/api/*.py` terbuka tanpa proteksi |
| CORS | `allow_methods=["*"]` dan `allow_headers=["*"]` di `backend/app/main.py` — terlalu longgar untuk production |
| Rate limiting | Tidak ada proteksi di endpoint apa pun, termasuk `/api/market/search` dan `/api/chart/*` yang paling berat memanggil `yfinance` |

Model database untuk auth (`User`, dengan field `passwordHash`, `role` enum `ADMIN`/`MEMBER`) **sudah
ada** di `backend/prisma/schema.prisma` sejak
`Environment/Enhancement-system-setup_DatabaseSupabase.md` — enhancement ini hanya perlu
memanfaatkannya, tidak perlu migrasi schema baru.

Enhancement ini menutup ketiga area sekaligus karena saling berkaitan: guard endpoint (Auth) butuh
CORS yang benar untuk header `Authorization`, dan endpoint yang paling sering dipanggil publik
(`search`, `chart`) adalah kandidat utama untuk rate limiting.

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

- [ ] Tambah dependency ke `backend/requirements.txt`: `passlib[bcrypt]==1.7.4`,
      `python-jose[cryptography]==3.3.0` (baris ini sudah ada sebagai komentar placeholder di
      `requirements.txt` — tinggal di-uncomment & pin versi).
- [ ] Buat `backend/app/core/security.py` — fungsi:
      - `hash_password(password: str) -> str` (bcrypt via `passlib.context.CryptContext`)
      - `verify_password(plain: str, hashed: str) -> bool`
      - `create_access_token(data: dict, expires_minutes: int) -> str` (JWT encode, `python-jose`)
      - `decode_access_token(token: str) -> dict | None` (JWT decode + validasi expiry, tangkap
        `JWTError`)
- [ ] Tambah schema baru di `backend/app/api/schemas.py`:
      - `RegisterRequest` (`email`, `name`, `password`)
      - `LoginRequest` (`email`, `password`)
      - `TokenResponse` (`access_token`, `token_type="bearer"`, `expires_in`)
      - `UserResponse` (`id`, `email`, `name`, `role`) — **tanpa** `passwordHash`, jangan pernah
        dikembalikan ke client
- [ ] Buat `backend/app/api/auth.py` — router baru:
      - `POST /api/auth/register` — cek email belum terdaftar (`db.user.find_unique`), hash
        password, `db.user.create()`, return `UserResponse`
      - `POST /api/auth/login` — cari user by email, `verify_password()`, jika valid buat token via
        `create_access_token()`, return `TokenResponse`
      - Kedua endpoint pakai instance `db` dari `app/core/db.py` yang sudah ada (Prisma singleton)
- [ ] Buat `backend/app/core/deps.py` — dependency `get_current_user()`:
      - Baca header `Authorization: Bearer <token>` (pakai `fastapi.security.HTTPBearer` atau
        `OAuth2PasswordBearer`)
      - `decode_access_token()` → jika gagal/expired, raise `HTTPException(401)`
      - Ambil user dari DB berdasarkan `sub` (user id) di payload token, raise `401` jika tidak
        ditemukan (mis. user sudah dihapus)
      - Return objek user (dipakai sebagai `Depends(get_current_user)` di endpoint yang diproteksi)
- [ ] Terapkan `get_current_user()` sebagai guard ke endpoint yang butuh login — untuk rilis awal,
      endpoint yang **wajib** diproteksi:
      - Endpoint watchlist per-user (**belum ada** — akan dibuat saat migrasi `localStorage` →
        database, lihat `Documentation-Program.md` §7.5). Sampai endpoint itu ada,
        `market/chart/news` **tetap publik** (read-only, tidak menyentuh data pribadi).
      - Endpoint baru `GET /api/auth/me` (opsional, memudahkan testing) — return `UserResponse`
        dari `get_current_user()` saat ini.
- [ ] Tambah `JWT_SECRET_KEY` **random yang kuat** ke `.env` (bukan placeholder kosong seperti di
      `backend/.env.example` saat ini) — generate dengan `python -c "import secrets;
      print(secrets.token_urlsafe(64))"`, simpan hanya di `.env` lokal/secret manager, **jangan**
      commit ke Git.
- [ ] Register router `auth.py` di `backend/app/main.py` (`app.include_router(auth.router)`,
      sejajar dengan `market.router`, `chart.router`, `news.router`).
- [ ] Update `frontend/lib/api.ts` — kirim token di header `Authorization: Bearer <token>` untuk
      request yang butuh auth (tambah opsi di `fetchJson()`, ambil token dari state/`localStorage`).
- [ ] Update `frontend/` — form login/register sederhana (bisa reuse UI shell dari
      `Environment/Enhancement-Design-1-UXVisual.md` §4.3) + simpan token di `localStorage` untuk
      versi awal (dicatat sebagai **batasan sementara** — migrasi ke httpOnly cookie disarankan
      sebelum produksi, lihat §5).

### B. CORS Diperketat

- [ ] Di `backend/app/main.py`, ganti `allow_methods=["*"]` → daftar eksplisit `["GET", "POST"]`
      (endpoint saat ini hanya pakai dua method ini; tambah `PUT`/`DELETE` nanti kalau endpoint
      watchlist per-user butuh update/hapus).
- [ ] Ganti `allow_headers=["*"]` → daftar eksplisit `["Content-Type", "Authorization"]`.
- [ ] Pastikan `CORS_ORIGINS` di `.env` **production** nanti diisi domain asli (bukan
      `http://localhost:3000` seperti default di `backend/.env.example` saat ini) — tidak perlu
      perubahan kode, hanya perubahan nilai environment variable saat deploy.

### C. Rate Limiting

- [ ] Tambah dependency `slowapi` ke `backend/requirements.txt`.
- [ ] Setup `Limiter` di `backend/app/main.py`:
      - `limiter = Limiter(key_func=get_remote_address)`
      - `app.state.limiter = limiter`
      - Daftarkan `app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)`
- [ ] Terapkan limit per-endpoint via decorator `@limiter.limit(...)` — prioritas sesuai beban ke
      `yfinance`:
      - `GET /api/market/search` — endpoint paling sering dipanggil saat user mengetik (autocomplete)
      - `GET /api/chart/{symbol}` — request historis terberat (`yfinance.Ticker().history()`)
      - `POST /api/market/watchlist` dan `GET /api/news/{symbol}` — prioritas kedua
- [ ] Tentukan angka limit wajar untuk rilis awal: **30 request/menit per IP** untuk endpoint di
      atas (bisa disesuaikan berdasarkan observasi traffic nyata setelah live — dicatat sebagai
      angka awal, bukan final).

### D. Verifikasi Akhir

- [ ] `python3 -m py_compile` semua file baru (`security.py`, `deps.py`, `auth.py`, perubahan di
      `main.py`, `schemas.py`) — cek sintaks sebelum commit.
- [ ] Update `PRD/Documentation-Program.md` §7.5 — pindahkan baris "Autentikasi" dan
      "Rate-limiting" dari kolom "Yang Masih Perlu Dikerjakan" ke status selesai, dengan referensi
      ke dokumen ini.
- [ ] Update `ai-trading-dashboard/README-Tahap2.md` — tambah bagian cara pakai token saat testing
      manual via Swagger UI (`/docs`): klik tombol **Authorize**, isi `Bearer <access_token>` hasil
      `POST /api/auth/login`, baru endpoint yang diproteksi bisa dicoba dari UI Swagger.

---

## 4. Struktur File Setelah Implementasi

| Path | Status | Fungsi |
|---|---|---|
| `backend/app/core/security.py` | Baru | Hash/verify password, encode/decode JWT |
| `backend/app/core/deps.py` | Baru | Dependency `get_current_user()` untuk guard endpoint |
| `backend/app/api/auth.py` | Baru | `POST /api/auth/register`, `POST /api/auth/login`, (opsional) `GET /api/auth/me` |
| `backend/app/api/schemas.py` | Diperluas | `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse` |
| `backend/app/main.py` | Diperluas | Register `auth.router`, CORS diperketat (§3.B), setup `Limiter` (§3.C) |
| `backend/app/core/db.py` | Dipakai ulang, tidak berubah | Prisma singleton — dipanggil dari `auth.py` untuk query `User` |
| `backend/prisma/schema.prisma` | Dipakai ulang, tidak berubah | Model `User` (`passwordHash`, `role`) sudah cukup untuk auth dasar |
| `backend/.env` | Diperluas | `JWT_SECRET_KEY` (nilai asli, bukan placeholder), `JWT_EXPIRE_MINUTES` |
| `frontend/lib/api.ts` | Diperluas | Kirim header `Authorization` di request yang butuh auth |
| `frontend/` (komponen baru) | Baru | Form login/register (lihat §4.3 `Enhancement-Design-1-UXVisual.md`) |

---

## 5. Batasan & Catatan Keamanan

- **Token di `localStorage`** adalah kompromi untuk rilis awal — rentan terhadap XSS dibanding
  httpOnly cookie. Dicatat eksplisit sebagai utang teknis; migrasi ke cookie `httpOnly` +
  `SameSite=Strict` disarankan sebelum onboarding pengguna publik/berbayar (selaras Tahap 3).
- **Endpoint publik (`market/chart/news`) sengaja tidak digembok** di rilis awal ini — semuanya
  read-only dan tidak mengekspos data pribadi. Menggembok semuanya sekaligus akan mempersulit
  testing dan tidak menambah keamanan berarti untuk data pasar yang memang publik.
- **Rate limit per-IP** (bukan per-user) berarti pengguna di belakang NAT/proxy yang sama bisa
  saling memengaruhi kuota — batasan yang diketahui, cukup untuk mencegah abuse dasar, bukan
  proteksi level enterprise.
- **`JWT_SECRET_KEY` wajib digenerate ulang** kalau pernah tidak sengaja ter-commit/terekspos di
  chat/log — selaras catatan keamanan yang sama di
  `Environment/Enhancement-system-setup_DatabaseSupabase.md` §6 untuk password database.
- Password **tidak pernah** dikembalikan di response manapun (`UserResponse` tidak menyertakan
  `passwordHash`) — pastikan review manual sebelum merge kalau ada endpoint baru yang
  mengembalikan objek `User` mentah dari Prisma.

---

## 6. Dokumen Terkait

- `PRD/Documentation-Program.md` §7.5 — daftar batasan Tahap 2 yang ditutup enhancement ini.
- `Environment/Enhancement-system-setup_DatabaseSupabase.md` — model `User`/`Role` yang dipakai.
- `Environment/Enhancement-Design-1-UXVisual.md` §4.3 — desain UI Login/Sign Up.
- `Environment/Enhancement-Design-2-Technical.md` §5 — catatan bahwa OAuth (Google/Apple/Microsoft)
  ditunda sampai auth dasar (dokumen ini) selesai.
