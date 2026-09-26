# Enhancement — System Setup: Database Supabase

> **Versi Dokumen:** 1.1
> **Terkait:** `Documentation-Program.md` §8 (Setup Database — Supabase + Prisma ORM)
> **Status:** ✅ Migrasi `init` berhasil — tabel sudah ada di Supabase
> **Terakhir Diperbarui:** 6 September 2026

---

## 1. Ringkasan Progres

| Langkah | Status |
|---|---|
| 1. Buat project Supabase | ✅ Selesai |
| 2. Ambil connection string (pooler port 6543 + 5432) | ✅ Selesai |
| 3. Install Prisma Client Python + tulis `schema.prisma` final | ✅ Selesai |
| 4. Jalankan `prisma generate` | ✅ Selesai |
| 5. Jalankan `prisma migrate dev --name init` | ✅ Selesai (`20260905185848_init`) |
| 6. Verifikasi tabel muncul di Supabase | ✅ Selesai — `users`, `watchlist_items`, `subscriptions`, `payments` |

---

## 2. Detail Project Supabase

| Item | Nilai |
|---|---|
| Nama Project | `ai-trading-dashboard` |
| Project ID | `kcizqggwxwocyomisgjh` |
| Region | `ap-southeast-1` (Singapore) |
| Environment | `main` — ditandai **PRODUCTION** di dashboard Supabase |

> ⚠️ Hindari `prisma migrate reset` di environment production setelah ada data sungguhan.

---

## 3. Connection String

Shared Pooler (`aws-0-ap-southeast-1.pooler.supabase.com`):

| Variabel | Port | Fungsi |
|---|---|---|
| `DATABASE_URL` | `6543` | Runtime aplikasi (transaction pooler) |
| `DIRECT_URL` | `5432` | Migrasi Prisma (session pooler) |

Password di connection string harus **percent-encoded** jika berisi karakter spesial (`@` → `%40`).

Isi di `backend/.env` saja — **jangan** commit password ke Git / dokumen / chat.

---

## 4. Artefak di Repo

| Path | Fungsi |
|---|---|
| `backend/prisma/schema.prisma` | Schema User / Watchlist / Subscription / Payment |
| `backend/prisma/migrations/20260905185848_init/` | SQL migrasi awal |
| `backend/app/core/db.py` | Prisma Client singleton + connect/disconnect |
| `backend/app/main.py` | FastAPI `lifespan` membuka/menutup DB |
| `backend/.env.example` | Template tanpa password |
| `backend/scripts/verify_db.py` | Cek daftar tabel (opsional) |

### Model

- `User` — `id`, `email`, `name`, `passwordHash`, `role`, timestamps  
- `WatchlistItem` — per-user symbols (`@@unique([userId, symbol])`)  
- `Subscription` — tier Free/Pro/Premium, status, payment method  
- `Payment` — Midtrans (`midtransOrderId`, `midtransRawPayload`) + Transfer Bank (`bankProofUrl`, verifikasi Admin)

Tabel fisik (snake_case): `users`, `watchlist_items`, `subscriptions`, `payments`.

---

## 5. Cara Ulang Generate / Migrasi (jika schema berubah)

```bash
cd backend
pip install -r requirements.txt
# pastikan .env sudah berisi DATABASE_URL + DIRECT_URL
prisma generate
prisma migrate dev --name <nama_perubahan>
```

---

## 6. Catatan Keamanan

- Password database **hanya** di `.env` lokal / secret manager hosting.
- Project berstatus PRODUCTION — aktifkan **RLS** di Supabase sebelum data user sungguhan.
- Jika password pernah terpapar di chat, **ganti password database** di Supabase lalu update `.env`.

---

## 7. Langkah Berikutnya (API)

Setelah DB siap, lanjut implementasi endpoint yang memakai Prisma:

- [ ] Register / login (JWT)
- [ ] CRUD watchlist per-user (ganti `localStorage` frontend)
- [ ] Baca/update subscription tier
- [ ] Webhook Midtrans + verifikasi transfer bank (Admin)
