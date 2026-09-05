# Documentation - Business
## AI Trading Dashboard

> **Versi Dokumen:** 1.0
> **Terakhir Diperbarui:** 5 September 2026
> **Audiens:** Pemilik produk, tim bisnis, calon investor, tim operasional

---

## 1. Visi Bisnis

Menjadi platform riset trading berbasis langganan yang terjangkau dan relevan untuk pasar Indonesia — menggabungkan data pasar, analisis teknikal, dan berita dalam satu dashboard, dengan metode pembayaran yang familiar bagi pengguna lokal (Transfer Bank & Midtrans).

---

## 2. Model Bisnis

### 2.1 Struktur Monetisasi
**Model: Freemium + Subscription (SaaS)**

Tidak ada iklan (produk tetap bersih, fokus ke pengalaman riset), pendapatan murni dari biaya langganan.

### 2.2 Rencana Tier Langganan *(Diusulkan — untuk difinalisasi tim bisnis)*

| Tier | Target User | Fitur | Estimasi Harga |
|---|---|---|---|
| **Free** | Pemula, coba-coba | Watchlist maks. 5 simbol, grafik dasar, tanpa berita real-time | Rp 0 |
| **Pro** | Trader aktif individu | Watchlist maks. 30 simbol, semua indikator teknikal, berita, histori 1 tahun | Rp 49.000–99.000/bulan *(estimasi, perlu riset pasar)* |
| **Premium** | Trader serius / komunitas | Watchlist unlimited, export data, prioritas dukungan, akses lebih awal ke fitur baru | Rp 149.000–299.000/bulan *(estimasi, perlu riset pasar)* |

> ⚠️ **Catatan:** Angka harga di atas adalah estimasi awal untuk kerangka diskusi, bukan harga final. Perlu validasi lewat riset kompetitor (misal: Stockbit, RTI Business, TradingView) dan uji willingness-to-pay ke calon pengguna.

### 2.3 Model Penagihan
- **Bulanan** (opsi utama)
- **Tahunan** dengan diskon (opsi untuk meningkatkan retensi & cash flow di muka) — direkomendasikan didiskusikan di Tahap 3

---

## 3. Metode Pembayaran

Sesuai kebutuhan bisnis, sistem akan mendukung **dua jalur pembayaran** yang saling melengkapi:

### 3.1 Transfer Bank Manual
**Kapan dipakai:** Untuk user yang lebih nyaman transfer manual, atau sebagai fallback saat payment gateway bermasalah.

**Alur proses:**
1. Member memilih paket & metode "Transfer Bank"
2. Sistem menampilkan info rekening tujuan (nama, no. rekening, nominal, kode unik/referensi)
3. Member melakukan transfer lalu **upload bukti transfer** (foto/screenshot) melalui form
4. Status langganan member menjadi **"Menunggu Verifikasi"**
5. **Admin** meninjau bukti transfer secara manual di panel Admin
6. Admin **menyetujui** (aktivasi langganan) atau **menolak** (dengan alasan, misal nominal tidak sesuai)
7. Member menerima notifikasi status (idealnya email + notifikasi in-app)

**Kebutuhan operasional:**
- SOP tim Admin untuk verifikasi (target waktu respons, misal maksimal 1x24 jam)
- Log audit siapa yang menyetujui/menolak transaksi, kapan
- Kebijakan jika bukti transfer palsu/tidak valid

### 3.2 Midtrans (Payment Gateway Otomatis)
**Kapan dipakai:** Untuk pengalaman instan — status langganan aktif otomatis begitu pembayaran berhasil, tanpa menunggu verifikasi manual.

**Metode yang didukung Midtrans** (tergantung konfigurasi akun merchant):
- QRIS
- Virtual Account (BCA, BNI, BRI, Mandiri, Permata, dll)
- E-wallet (GoPay, ShopeePay, dll)
- Kartu Kredit/Debit

**Alur proses (level bisnis):**
1. Member memilih paket & metode "Midtrans"
2. Sistem membuat transaksi ke Midtrans, menampilkan halaman/pop-up pembayaran resmi Midtrans
3. Member menyelesaikan pembayaran di sisi Midtrans
4. Midtrans mengirim **notifikasi webhook** ke sistem saat status berubah (`settlement`, `pending`, `expire`, `cancel`, `deny`)
5. Sistem otomatis mengaktifkan/menonaktifkan langganan berdasarkan notifikasi tersebut
6. Member menerima konfirmasi otomatis

**Kebutuhan operasional:**
- Akun merchant Midtrans terdaftar dan terverifikasi (perlu dokumen legalitas bisnis — NIB/NPWP/rekening perusahaan)
- Pemilihan mode **Sandbox** (uji coba) vs **Production** (live) — harus dipisah jelas agar tidak tercampur saat development
- Kebijakan refund/pembatalan sesuai ketentuan Midtrans dan kebijakan internal

---

## 4. Peran & Hak Akses (Role-Based Access)

### 4.1 Role: Admin
| Kemampuan | Deskripsi |
|---|---|
| Kelola pengguna | Lihat semua member, nonaktifkan/aktifkan akun |
| Verifikasi pembayaran manual | Approve/reject bukti transfer bank |
| Kelola paket langganan | Ubah harga, fitur, dan batasan tiap tier |
| Lihat laporan pendapatan | Ringkasan transaksi, MRR (Monthly Recurring Revenue), churn |
| Kelola konten sistem | Misalnya default watchlist, pengumuman ke member |

### 4.2 Role: Member
| Kemampuan | Deskripsi |
|---|---|
| Akses dashboard sesuai tier | Fitur dibatasi sesuai paket aktif |
| Kelola watchlist pribadi | Tambah/hapus simbol sesuai limit tier |
| Kelola langganan pribadi | Upgrade/downgrade paket, lihat riwayat pembayaran |
| Upload bukti transfer | Untuk metode pembayaran manual |

> **Catatan desain:** Struktur ini dirancang agar mudah ditambah role baru di masa depan (misal "Reseller" atau "Support Staff") tanpa merombak sistem — lihat detail teknis di `Documentation-Program.md`.

---

## 5. Kebutuhan Kepatuhan & Legalitas *(Perlu Ditindaklanjuti Tim Legal)*

Ini adalah area yang **di luar keahlian teknis** dan perlu masukan profesional hukum/keuangan sebelum go-live komersial:

1. **Status sebagai penasihat investasi:** Produk menampilkan indikator teknikal dan "sinyal" — perlu dipastikan bahasa yang dipakai tidak melanggar ketentuan OJK terkait pemberian nasihat investasi tanpa izin. Disclaimer sudah ditambahkan di level produk, tapi perlu review hukum.
2. **Perlindungan data pribadi:** Sesuai UU PDP (Perlindungan Data Pribadi) — data user (email, riwayat pembayaran, bukti transfer) harus disimpan & diproses sesuai ketentuan.
3. **Syarat & Ketentuan + Kebijakan Privasi:** Wajib ada sebelum menerima pembayaran dari publik.
4. **Legalitas badan usaha:** Diperlukan untuk mendaftar akun merchant Midtrans (biasanya butuh NIB/CV/PT).
5. **Kebijakan refund:** Perlu ditetapkan tertulis (misal: tidak ada refund untuk periode berjalan, atau prorata).

---

## 6. Roadmap Bisnis (Selaras dengan Roadmap Produk)

| Fase | Fokus Bisnis | Output |
|---|---|---|
| **Tahap 1** | Validasi produk (apakah orang mau pakai dashboard ini) | Dashboard lokal, dites internal/beta terbatas |
| **Tahap 2** | Validasi kesiapan teknis multi-user | Web app live, kumpulkan early user (gratis dulu) untuk feedback |
| **Tahap 3** | Mulai monetisasi | Aktifkan tier berbayar, integrasi Midtrans + Transfer Bank, mulai akuisisi pelanggan berbayar |

---

## 7. Pertanyaan Terbuka untuk Tim Bisnis *(Perlu Keputusan)*

- [ ] Apakah harga final per tier? (perlu riset kompetitor & survei harga)
- [ ] Apakah ada masa trial gratis untuk tier Pro/Premium?
- [ ] Bagaimana kebijakan refund/pembatalan langganan?
- [ ] Siapa yang bertanggung jawab sebagai tim verifikasi transfer bank (berapa orang, jam operasional)?
- [ ] Apakah perlu program afiliasi/referral untuk akuisisi pengguna?
- [ ] Badan usaha apa yang akan dipakai untuk mendaftar Midtrans (PT/CV/perorangan)?
