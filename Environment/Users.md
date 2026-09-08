# Environment — Sample Users & Role Access

> **Versi:** 1.0  
> **Terakhir diperbarui:** 6 September 2026  
> **Tujuan:** Kredensial sample untuk login development + matriks hak akses role  
> **Status auth API:** UI shell sudah ada (`/login`, `/signup`) — JWT wiring menyusul; akun di bawah sudah di-seed ke Supabase `users`

---

## 1. Ringkasan Role

| Role (enum DB) | Label UI | Fokus | Scope |
|---|---|---|---|
| `SYSTEM_ADMIN` | System Admin | **Read All** — audit & oversight seluruh sistem | Baca semua data operasional, user, transaksi, log; tidak untuk operasi bisnis harian |
| `ADMIN` | Admin | **Maintain data & business users** | Kelola member/business users, verifikasi pembayaran, paket langganan, konten sistem |
| `MEMBER` | Member / Business User | Pakai produk sesuai tier | Watchlist, chart, analysis sesuai paket Free/Pro/Premium |

---

## 2. Matriks Hak Akses

| Capability | System Admin | Admin | Member |
|---|---|---|---|
| Login ke dashboard aplikasi | ✅ | ✅ | ✅ |
| Baca seluruh data user | ✅ Read | ✅ | ❌ (hanya milik sendiri) |
| Baca seluruh transaksi / subscription | ✅ Read | ✅ | ❌ (hanya milik sendiri) |
| Baca laporan / audit sistem | ✅ | 🔶 Ringkas | ❌ |
| Buat / edit / nonaktifkan business users (Member) | ❌ (read-only) | ✅ | ❌ |
| Verifikasi transfer bank / Midtrans | ❌ (read-only) | ✅ | Upload bukti saja |
| Ubah harga paket & fitur tier | ❌ (read-only) | ✅ | ❌ |
| Ubah default watchlist / pengumuman | ❌ (read-only) | ✅ | ❌ |
| Ubah role System Admin lain | ❌ (kecuali proses khusus) | ❌ | ❌ |
| Kelola watchlist pribadi | ✅ | ✅ | ✅ |

**Prinsip:** System Admin = pengawasan & baca penuh. Admin = operasional maintain data + business users. Member = end-user produk.

---

## 3. Sample Login (Development)

> Password sample **hanya untuk environment development**. Ganti sebelum production. Jangan commit password produksi ke Git.

| Nama | Email | Password | Role | Catatan |
|---|---|---|---|---|
| System Admin | `sysadmin@tradingmonitor.local` | `SysAdmin@2026` | `SYSTEM_ADMIN` | Read-all oversight |
| Platform Admin | `admin@tradingmonitor.local` | `Admin@2026` | `ADMIN` | Maintain users & business data |
| Demo Member | `member@tradingmonitor.local` | `Member@2026` | `MEMBER` | Business user / end-user sample |

### Cara uji (setelah auth API aktif)

1. Buka `http://localhost:3000/login`
2. Masukkan email + password dari tabel di atas
3. System Admin → panel audit / read-only console  
4. Admin → panel maintain users & billing  
5. Member → dashboard riset biasa

### Mapping ke form Login UI saat ini

Form di `frontend/components/auth/AuthCard.tsx` masih **UI shell** (belum panggil `/api/auth`). Setelah JWT diwiring, gunakan kredensial di atas terhadap endpoint login.

---

## 4. Seed Database

Akun sample di-seed lewat:

```bash
cd ai-trading-dashboard/backend
python scripts/seed_users.py
```

Script bersifat **idempotent**: jika email sudah ada, di-skip (tidak overwrite password).

Role enum Prisma (`backend/prisma/schema.prisma`):

```prisma
enum Role {
  SYSTEM_ADMIN
  ADMIN
  MEMBER
}
```

---

## 5. Keamanan

- File ini boleh berisi password **sample lokal** saja.
- Password produksi hanya di secret manager / `.env` yang tidak di-commit.
- Setelah go-live: nonaktifkan atau ganti ketiga akun `*.tradingmonitor.local`.
- Hash di database memakai bcrypt (`password_hash`), bukan plain text.
