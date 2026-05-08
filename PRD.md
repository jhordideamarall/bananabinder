# Product Requirements Document (PRD) - Bananasbindery E-Commerce

## 1. Objective
Membangun platform e-commerce yang aman, cepat, dan scalable untuk brand **Bananasbindery** — Binder Stationery premium di Indonesia. Dilengkapi fitur marketing tingkat lanjut, integrasi logistik, dan pembayaran otomatis.

## 2. Brand Identity
| Elemen | Detail |
|--------|--------|
| Nama Brand | Bananasbindery |
| Tagline | Binder Stationery |
| Warna Primer | Biru lembut `#7EC8E3` |
| Warna Sekunder | Pink `#F2A7C3` |
| Warna Aksen | Kuning lembut `#F9E79F` |
| Tone & Voice | Friendly, playful, modern, stationery-lover vibes |

## 3. Target Audience
- **User:** Pelajar, mahasiswa, dan pekerja di Indonesia yang mencari buku binder berkualitas dan estetik.
- **Admin:** Tim internal Bananasbindery (marketing & operasional).

## 4. Core Features

### 4.1 User (Pembeli)

| Fitur | Deskripsi |
|-------|-----------|
| Autentikasi WhatsApp OTP | Login/Register via nomor WhatsApp + OTP. Tanpa password. |
| Smart Cart (Persistent) | Keranjang tersimpan di database, tidak hilang walau browser ditutup. |
| Kupon & Flash Sale | Input kode diskon, banner flash sale dengan countdown timer. |
| Ongkir (RajaOngkir Pro) | Perhitungan ongkir akurat hingga kecamatan. Multi-kurir. |
| Payment (Xendit) | VA, E-Wallet, QRIS, Kartu Kredit. Otomatis via webhook. |
| Tracking Pesanan | Status real-time: pending → paid → processing → shipped → delivered. |
| Multi-Alamat | User bisa simpan beberapa alamat pengiriman. |

### 4.2 Admin

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard Analytics | Penjualan, konversi, produk terlaris, alert stok menipis. |
| Manajemen Produk | CRUD produk + multi-varian (ukuran ring, warna cover, jenis kertas, jumlah lembar). Multi-gambar per produk. |
| Kupon | Buat kode diskon (% atau nominal), kuota, tanggal kadaluarsa. |
| Flash Sale | Atur periode + harga promo untuk produk tertentu. |
| Abandoned Cart | Lihat cart yang ditinggalkan, kirim notifikasi pengingat (WA/email). |
| Fulfillment | Proses pesanan, cetak label, input resi. |
| CRM Sederhana | Lihat riwayat belanja per pelanggan. |

## 5. Order Status Flow
```
pending → paid → processing → shipped → delivered
                                      → cancelled (dari pending/paid)
```

## 6. Non-Functional Requirements
- **Scalability:** Serverless architecture (Vercel + Supabase). Handle traffic spike saat flash sale.
- **Performance:** Target load time < 1.5 detik. Turborepo untuk build optimization.
- **Security:**
  - Server-side price validation saat checkout (anti manipulasi client).
  - Xendit webhook signature verification.
  - Row Level Security (RLS) di semua tabel user-facing.
  - OTP hash + expiry (bukan plaintext).
- **Monorepo:** Turborepo untuk shared packages dan parallel builds.
- **SEO & AI Visibility:** Structured data (JSON-LD), semantic URL, metadata per halaman, AI-readable content. (Detail di `AI-visibilites.md`)
