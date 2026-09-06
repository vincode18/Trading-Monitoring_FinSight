# Enhancement — Design: Onboarding, Landing Page & Login/Sign Up (v2.0)

> **Versi Dokumen:** 2.0 — revisi dari v1.1 (lampiran), fokus: penyesuaian design system untuk
> tipografi **Plus Jakarta Sans** + revisi copy layar **Onboarding** dan **Login/Sign Up**
> **Terkait:** `Environment/Enhancement-Design-1-UXVisual.md` §3 (Design Language),
> §4.1–4.3 (Onboarding, Landing, Login/Sign Up)
> **Dokumen sebelumnya:** v1.1 (lampiran pengguna, tidak disimpan di repo) — lihat §0 Changelog
> **Referensi visual:** Mockup "Trading Monitor" (dark login), referensi struktur split-layout
> auth, referensi struktur informasi landing page fintech
> **Status:** 🔜 Diusulkan — belum diimplementasikan
> **Terakhir Diperbarui:** 6 September 2026
> **Audiens:** Frontend Developer, Desainer

> ℹ️ **Catatan Rebrand:** Nama produk resmi adalah **FinSight**. Nama "Trading Monitor" yang
> muncul di beberapa tempat pada dokumen ini murni sebagai **rujukan mockup referensi asli**,
> bukan nama yang dipakai di UI final.

---

## 0. Changelog v1.1 → v2.0

| Area | v1.1 | v2.0 |
|---|---|---|
| Referensi dokumen induk | Menyebut `Enhancement-Design-1-Visual-Business.md` | Dikoreksi ke nama file yang sebenarnya ada di repo: `Enhancement-Design-1-UXVisual.md` |
| Tipografi | Tidak disebutkan eksplisit (mewarisi default lama, `Inter`) | **Baru §2** — beralih ke `Plus Jakarta Sans`, dengan penyesuaian radius & border supaya selaras bentuk huruf yang lebih geometris-bulat |
| Copy Onboarding (3 slide) | Deskriptif-fungsional ("Harga saham, crypto, dan index dalam satu dashboard.") | Direvisi jadi lebih benefit-led & ritmis, konsisten gaya CTA FinSight (lihat §4.2) |
| Copy Login | Campur ID/EN (`Welcome Back`, tombol `Log In`) | **Diputuskan:** konsisten penuh Bahasa Indonesia — `Selamat Datang Kembali`, tombol `Masuk` (menutup pertanyaan terbuka §7 poin bahasa di v1.1) |
| Copy Sign Up | Tombol `Daftar`, judul `Buat Akun Baru` (sudah ID) | Sub-copy & caption token diperhalus, tombol sosial diputuskan **visible tapi non-fungsional** (menutup pertanyaan terbuka §7 poin tombol sosial di v1.1) |
| Landing Page | Struktur & placeholder gambar | **Tidak berubah** — di luar scope revisi copy kali ini, tetap ikuti §4 dokumen v1.1 (direproduksi di §5 dokumen ini apa adanya untuk keutuhan referensi) |
| Pertanyaan terbuka (§7 v1.1) | 3 poin belum diputuskan | 2 dari 3 poin **diputuskan** di v2.0 (bahasa, tombol sosial) — lihat §8 |

---

## 1. Ruang Lingkup Dokumen

Requirement teknis-visual untuk 3 layar pertama pengguna baru:

1. **Onboarding** (3 slide, tampil sekali per device) — **copy direvisi di v2.0**
2. **Landing Page** (halaman publik/marketing) — struktur tidak berubah dari v1.1
3. **Login / Sign Up** (UI shell, belum wired ke backend Auth) — **copy direvisi di v2.0**

Sesuai `Enhancement-Design-1-UXVisual.md` (Non-Goals), dokumen ini **tidak** mengimplementasikan
logic autentikasi — form disiapkan sebagai UI shell. Wiring ke JWT menyusul sesuai
`PRD/Documentation-Program.md` §7.5 dan `Environment/enhancement-system_JWTAuth.md`.

---

## 2. Penyesuaian Design System — Pairing dengan Plus Jakarta Sans

### 2.1 Kenapa Disesuaikan

`Plus Jakarta Sans` (dipakai sejak `Enhancement-Design-1-UXVisual.md` §3.1 untuk UI utama)
punya karakter huruf lebih **geometris dan bulat** dibanding `Inter` yang dipakai versi Tahap 2
saat ini. Untuk 2 layar yang paling banyak tipografi besar (headline Onboarding, judul card
Login/Sign Up), token warna & bentuk lama (dirancang untuk `Inter`) perlu sedikit penyesuaian
supaya tidak terasa "kaku" berdampingan dengan huruf yang lebih rounded.

**Prinsip:** palet warna inti (`canvas #0E1117`, `panel #161B22`, `positive #00E676`,
`negative #FF5252`) **tidak berubah** — ini token brand yang sudah dipakai di kode
(`frontend/tailwind.config.js`) dan dashboard yang sudah berjalan. Yang disesuaikan hanya token
bentuk (radius) dan token border yang jarang dipakai di layar dashboard dense, tapi penting di
2 layar auth/onboarding yang lebih lapang.

### 2.2 Token yang Disesuaikan

| Token | Nilai Lama (Tahap 2 / v1.1) | Nilai Baru (v2.0) | Alasan |
|---|---|---|---|
| `radius-panel` (card besar: Login card, slide Onboarding) | `8px` | **`12px`** | Radius sedikit lebih besar supaya proporsional dengan lekukan huruf `Plus Jakarta Sans` yang lebih bulat dibanding `Inter` — tetap "tajam-sedang" (bukan pill), hanya dilonggarkan di card besar |
| `radius-button` / `radius-input` | `4–6px` | **`8px`** (disatukan, satu nilai) | Menghindari kombinasi "huruf bulat, sudut kotak" yang terasa tidak selaras; disatukan jadi satu token supaya tombol & input konsisten |
| `border-card` (border card besar: Login, Onboarding, split Sign Up) | Pakai token umum `border` (`#2A313C`) | **Token baru `border-card` `#333B48`** | Card besar dengan headline tebal (`font-weight 700/800`) butuh outline sedikit lebih tegas supaya card tidak "melebur" ke background — dipisah dari `border` biasa yang tetap dipakai di elemen dense (tabel, divider) |
| `letter-spacing` label uppercase | `wide` (`0.05em`) | **`0.04em`** | Huruf kapital `Plus Jakarta Sans` sudah relatif terbuka (open counter) — spacing `0.05em` terasa berlebihan; `0.04em` lebih pas dibaca di label kecil (`Kondisi Teknikal`, `Watchlist`, dst.) |
| Bobot heading (`h1`/display) | `600` (Inter Semibold) | **`700`** (Jakarta Sans Bold) | `Plus Jakarta Sans` di bobot `600` terasa lebih ringan secara visual dibanding `Inter 600` pada ukuran sama — dinaikkan satu tingkat supaya kontras hierarki tetap terjaga |

**Tidak berubah:** semua token warna (`canvas`, `panel`, `panel-hover`, `positive`, `negative`,
`text-primary/secondary/muted`, `action-primary`), token `border` & `border-muted` untuk elemen
dense (tabel, sidebar), dan font data (`JetBrains Mono`) — lihat `Enhancement-Design-1-UXVisual.md`
§3.2 untuk daftar lengkap token yang tetap berlaku.

### 2.3 Penerapan Token Baru per Layar

| Elemen | Token Radius | Token Border |
|---|---|---|
| Card Login (§6.1) | `radius-panel` (12px) | `border-card` (#333B48) |
| Card/slide Onboarding (§4.1) | `radius-panel` (12px) | `border-card` (tipis, opsional — Onboarding full-bleed tanpa card eksplisit, hanya dipakai jika ilustrasi placeholder diberi frame) |
| Form Sign Up (kolom kanan split, §6.2) | `radius-button`/`radius-input` (8px) untuk input & tombol | `border` biasa untuk divider `atau` |
| Tombol (`Lanjut`, `Masuk`, `Daftar`, dst. — semua layar) | `radius-button` (8px) | — |

---

## 3. Placeholder Gambar — Ketentuan Umum

*(Tidak berubah dari v1.1 — direproduksi untuk keutuhan referensi satu dokumen.)*

Karena aset visual asli belum tersedia, semua gambar di 3 layar ini memakai `https://placehold.co`:

```
https://placehold.co/{width}x{height}/{background-hex}/{text-hex}?text={label}
```

- Background placeholder pakai token `panel` (`161B22`), teks pakai token `text-muted` (`5C6673`).
- Parameter `?text=` diisi label singkat penjelas.
- Ukuran yang tercantum adalah ukuran render akhir.

---

## 4. Layar 1 — Onboarding (3 Slide)

### 4.1 Struktur

*(Tidak berubah secara layout dari v1.1 — hanya token radius/border mengikuti §2.3 jika ilustrasi
diberi frame card.)*

- Full-screen, background `canvas` (`#0E1117`).
- Logo/nama produk kecil di pojok kiri atas.
- Area ilustrasi tengah (placeholder), judul singkat di bawahnya, 1 kalimat deskripsi.
- Indikator dot (3 titik, dot aktif warna `positive`) di bawah ilustrasi.
- Tombol `Lewati` (teks `text-muted`, kiri bawah) + tombol `Lanjut` (hijau neon, kanan bawah,
  radius `8px` sesuai §2.2).
- Slide terakhir: tombol `Lanjut` berubah jadi `Mulai Sekarang`, tanpa tombol `Lewati`.

### 4.2 Konten 3 Slide — **Copy Direvisi (v2.0)**

| Slide | Judul (v1.1) | **Judul Baru (v2.0)** | Deskripsi (v1.1) | **Deskripsi Baru (v2.0)** | Placeholder Ilustrasi |
|---|---|---|---|---|---|
| 1 | Pantau Pasar Real-Time | **Pantau Pasar, Real-Time.** | Harga saham, crypto, dan index dalam satu dashboard. | **Saham, kripto, dan indeks — satu dashboard, tanpa buka banyak tab.** | `https://placehold.co/480x360/161B22/5C6673?text=Watchlist+Preview` |
| 2 | Analisis Teknikal Instan | **Baca Sinyal Teknikal, Instan.** | MA, RSI, MACD, dan Bollinger Bands otomatis terhitung. | **MA, RSI, MACD, Bollinger Bands — semua terhitung otomatis di setiap simbol yang Anda pantau.** | `https://placehold.co/480x360/161B22/5C6673?text=Chart+Preview` |
| 3 | Berita Selalu Terkini | **Berita yang Relevan, Bukan Berisik.** | Berita relevan per simbol, tanpa buka banyak tab. | **Kabar penting per simbol, langsung terhubung ke watchlist Anda.** | `https://placehold.co/480x360/161B22/5C6673?text=News+Preview` |

**Rasional revisi copy:**
- Judul dipendekkan jadi pola "aksi, hasil" dengan tanda baca koma-titik (`Pantau Pasar, Real-Time.`)
  supaya terbaca sebagai satu tarikan napas — selaras nada hero Landing Page (`Monitor Market.
  Analyze Smarter. Trade Better.` versi asli mockup, diadaptasi ke ritme serupa dalam Bahasa
  Indonesia).
- Deskripsi slide 1 & 3 diberi kalimat pembanding singkat ("tanpa buka banyak tab", "bukan
  berisik") untuk menegaskan proposisi nilai dibanding kebiasaan lama pengguna (buka banyak
  tab/aplikasi) — konsisten dengan masalah yang diangkat di `PRD/Documentation-Business.md` §1.
- Tombol `Lewati` / `Lanjut` / `Mulai Sekarang` **tidak diubah** — sudah cukup jelas dan pendek.

### 4.3 Placeholder — Ukuran

*(Tidak berubah dari v1.1.)*

| Elemen | Ukuran (px) | Catatan |
|---|---|---|
| Ilustrasi slide | `480 x 360` | Rasio 4:3 |

### 4.4 State & Perilaku

*(Tidak berubah dari v1.1.)*

- Tampil hanya sekali per device — `localStorage` key `onboarding-completed`.
- Setelah slide terakhir atau `Lewati` ditekan → redirect ke Landing Page (`/`).

---

## 5. Layar 2 — Landing Page

> **Catatan v2.0:** Struktur dan copy layar ini **tidak termasuk** dalam scope revisi kali ini
> (fokus revisi hanya Onboarding & Login/Sign Up, lihat §0). Bagian ini direproduksi apa adanya
> dari v1.1 supaya dokumen tetap utuh sebagai satu rujukan. Hanya token radius/border (§2) yang
> otomatis berlaku pada card fitur & preview gambar di halaman ini.

### 5.1 Struktur Informasi (Urutan dari Atas ke Bawah)

1. **Navbar** — logo kiri, menu tengah (`Fitur / Pasar / Harga / Tentang`), tombol kanan:
   `Masuk` (outline) + `Daftar Gratis` (putih solid, `action-primary`).
2. **Hero Section** — judul besar, sub-copy, 2 CTA (`Mulai Gratis` hijau neon, `Lihat Demo`
   outline), gambar preview dashboard di kanan (placeholder).
3. **Trust Strip** — 4 kolom statistik (`Pengguna Aktif`, `Pasar Tercakup`, `Uptime`, `Dukungan`).
4. **Fitur Utama** — 3 kartu fitur (icon + judul + deskripsi singkat): Watchlist, Analisis
   Teknikal, Berita Real-Time.
5. **Preview Produk Sekunder** — 1 gambar besar preview chart/analysis, copy pendukung di
   sampingnya.
6. **FAQ** — accordion 4–5 pertanyaan umum (disclaimer risiko trading masuk di sini, §5.4).
7. **CTA Penutup** — banner besar ajakan daftar, tombol `Mulai Sekarang`.
8. **Footer** — logo, tautan (`Tentang / Syarat & Ketentuan / Privasi`), disclaimer singkat,
   copyright.

### 5.2 Placeholder Gambar — Daftar Lengkap & Ukuran

| Elemen | Ukuran (px) | URL Placeholder |
|---|---|---|
| Hero — preview dashboard | `960 x 640` | `https://placehold.co/960x640/161B22/5C6673?text=Dashboard+Preview` |
| Fitur — icon kartu 1 (Watchlist) | `64 x 64` | `https://placehold.co/64x64/161B22/00E676?text=1` |
| Fitur — icon kartu 2 (Analisis) | `64 x 64` | `https://placehold.co/64x64/161B22/00E676?text=2` |
| Fitur — icon kartu 3 (Berita) | `64 x 64` | `https://placehold.co/64x64/161B22/00E676?text=3` |
| Preview produk sekunder | `800 x 500` | `https://placehold.co/800x500/161B22/5C6673?text=Chart+%26+Analysis+Preview` |
| Logo produk (navbar & footer) | `32 x 32` | `https://placehold.co/32x32/00E676/0E1117?text=FS` |

### 5.3 Statistik Trust Strip (Placeholder Angka)

| Label | Nilai Placeholder |
|---|---|
| Pengguna Aktif | `—` ("Segera Hadir", bukan angka palsu) |
| Pasar Tercakup | `150+ Pasar` |
| Uptime | `—` (belum ada data uptime riil) |
| Dukungan | `Email Support` |

> ⚠️ Angka mengesankan seperti `50K+ Active Users`/`99.9% Uptime` dari mockup referensi **sengaja
> tidak ditiru** karena berpotensi jadi klaim palsu jika lolos tanpa sensor ke production.

### 5.4 Copy Disclaimer (Wajib Tampil)

> *"FinSight adalah alat bantu riset pasar, bukan nasihat keuangan berlisensi. Semua
> keputusan investasi/trading sepenuhnya tanggung jawab pengguna."*

---

## 6. Layar 3 — Login / Sign Up

### 6.1 Login — Single Card Centered — **Copy Direvisi (v2.0)**

**Struktur** *(tidak berubah, hanya token §2.3: radius card `12px`, border `border-card`)*:
- Full-screen, background `canvas`, konten center vertikal & horizontal.
- Nama produk kecil di atas card (`FinSight`, `text-primary`, bold).
- Card (`panel` background, border `border-card`, radius `12px`) berisi form.

**Copy — perbandingan v1.1 vs v2.0:**

| Elemen | v1.1 | **v2.0** |
|---|---|---|
| Judul | `Welcome Back` (EN) / padanan `Selamat Datang Kembali` | **`Selamat Datang Kembali`** (dipilih tunggal, resmi ID — menutup pertanyaan bahasa di §8) |
| Sub-copy | `Masuk untuk menyimpan watchlist dan preferensi.` | **`Masuk untuk melanjutkan pemantauan pasar Anda.`** |
| Tombol utama | `Log In` (EN) | **`Masuk`** |
| Link silang | `Belum punya akun? Sign Up` | **`Belum punya akun? Daftar`** (kata `Daftar` warna `positive`) |
| Caption token | `Token disimpan di localStorage (batasan sementara sebelum httpOnly cookie).` | **`Sesi disimpan di perangkat ini — belum tersinkron ke akun sebelum verifikasi email aktif.`** — tetap jujur soal batasan, dengan bahasa lebih ramah pengguna (istilah teknis "localStorage"/"httpOnly cookie" dipindah ke catatan developer di §6.3, bukan tampil ke end-user) |

**Placeholder gambar:** Tidak ada gambar di layar Login — tidak berubah dari v1.1.

### 6.2 Sign Up — Split Layout — **Copy Direvisi (v2.0)**

**Struktur** *(tidak berubah — kolom kiri gambar full-height, kolom kanan form; disembunyikan di
mobile)*.

**Copy — perbandingan v1.1 vs v2.0:**

| Elemen | v1.1 | **v2.0** |
|---|---|---|
| Judul | `Buat Akun Baru` / `Create Account` | **`Buat Akun Baru`** (dipilih tunggal, resmi ID) |
| Overlay teks gambar kiri | *"Bergabung dengan trader lain memantau pasar setiap hari"* | **`"Satu akun, semua pasar yang Anda pantau — tersimpan dan siap kapan saja."`** — copy diarahkan ke manfaat penyimpanan akun (relevan, karena Sign Up = alasan utamanya menyimpan watchlist), bukan klaim sosial ("trader lain") yang belum bisa dibuktikan datanya |
| Tombol sosial | Google, Apple ditampilkan (status belum diputuskan) | **Diputuskan:** tetap ditampilkan, **non-fungsional** (`disabled`, opacity turun, tooltip `Segera Hadir` saat hover) — lihat §8 |
| Tombol utama | `Daftar` | **`Daftar`** (tidak berubah) |
| Password hint | `Minimal 8 karakter` | **`Minimal 8 karakter`** (tidak berubah) |
| Link silang | `Sudah punya akun? Log In` | **`Sudah punya akun? Masuk`** (kata `Masuk` warna `positive`) |

**Placeholder gambar:** *(Tidak berubah dari v1.1.)*

| Elemen | Ukuran (px) | URL Placeholder |
|---|---|---|
| Gambar split kiri (Sign Up) | `640 x 960` | `https://placehold.co/640x960/161B22/5C6673?text=Sign+Up+Visual` |
| Ikon Google | `20 x 20` | `https://placehold.co/20x20/161B22/F0F3F6?text=G` |
| Ikon Apple | `20 x 20` | `https://placehold.co/20x20/161B22/F0F3F6?text=A` |

### 6.3 Catatan untuk Developer — Bahasa Teknis vs Bahasa Pengguna

Istilah teknis (`localStorage`, `httpOnly cookie`) yang di v1.1 tampil langsung ke pengguna di
caption Login/Sign Up, di v2.0 **dipindah jadi komentar kode / dokumentasi internal saja** —
bukan hilang, hanya tidak lagi diekspos di UI end-user. Redaksi teknis lengkap untuk referensi
implementasi (tetap dicatat di sini, bukan di UI):

> *Implementasi: token disimpan di `localStorage` (bukan httpOnly cookie) sebagai batasan
> sementara rilis awal — lihat `Environment/enhancement-system_JWTAuth.md` §5 untuk detail risiko
> & rencana migrasi.*

**Alasan perubahan:** caption v1.1 transparan ke developer tapi berpotensi membingungkan
end-user awam yang tidak familiar istilah `localStorage`/`httpOnly cookie`. Transparansi teknis
tetap dipertahankan penuh — hanya dipindah ke lapisan dokumentasi (dokumen ini +
`enhancement-system_JWTAuth.md`) alih-alih tampil sebagai microcopy di layar produksi.

---

## 7. Ringkasan Semua Placeholder (Referensi Cepat)

*(Tidak berubah dari v1.1.)*

| # | Layar | Elemen | Ukuran |
|---|---|---|---|
| 1 | Onboarding | Ilustrasi Slide 1 | `480x360` |
| 2 | Onboarding | Ilustrasi Slide 2 | `480x360` |
| 3 | Onboarding | Ilustrasi Slide 3 | `480x360` |
| 4 | Landing | Hero — preview dashboard | `960x640` |
| 5 | Landing | Icon fitur 1/2/3 | `64x64` (×3) |
| 6 | Landing | Preview produk sekunder | `800x500` |
| 7 | Landing | Logo navbar/footer | `32x32` |
| 8 | Login | — | *(tidak ada gambar)* |
| 9 | Sign Up | Gambar split kiri | `640x960` |
| 10 | Sign Up | Ikon Google | `20x20` |
| 11 | Sign Up | Ikon Apple | `20x20` |

---

## 8. Status Pertanyaan Terbuka (dari v1.1)

| Pertanyaan (v1.1) | Status di v2.0 |
|---|---|
| Onboarding wajib untuk semua pengunjung baru, atau bisa di-skip langsung ke Login? | **Belum diputuskan** — masih perlu konfirmasi produk. Rekomendasi sementara: tetap tampilkan ke semua pengunjung baru (device belum punya flag `onboarding-completed`), karena skip-untuk-Login menambah kompleksitas routing tanpa manfaat jelas di rilis awal. |
| Konsistensi bahasa Login/Sign Up (ID/EN campur) | ✅ **Diputuskan** — Bahasa Indonesia penuh: `Masuk`, `Daftar`, `Selamat Datang Kembali`, `Buat Akun Baru` (lihat §6.1–6.2). |
| Tombol login sosial: tampil non-fungsional vs disembunyikan total | ✅ **Diputuskan** — tampil dengan state `disabled` + tooltip `Segera Hadir`, tidak disembunyikan (memberi sinyal roadmap ke pengguna tanpa membingungkan saat diklik, lihat §6.2). |

---

## 9. Dokumen Terkait

- `Environment/Enhancement-Design-1-UXVisual.md` — design token & inventaris 9 layar (dokumen induk; nama file dikoreksi dari referensi v1.1, lihat §0)
- `Environment/Enhancement-Design-2-Technical.md` — implementasi teknis (struktur route, komponen)
- `Environment/enhancement-system_JWTAuth.md` — status implementasi Auth JWT & catatan keamanan token (§5, direferensikan dari §6.3)
- `PRD/Documentation-Business.md` §5 — kebutuhan disclaimer & kepatuhan
- `PRD/Documentation-Program.md` §7.5 — status Auth JWT (belum diimplementasikan, hanya UI shell di sini)
