# 🏆 Bananasbindery: Final Definitive Integration Masterplan (v12.0)

Audit forensik ini adalah standar tertinggi untuk memastikan Bananasbindery siap Production dengan keamanan, performa, dan akurasi bisnis maksimal.

---

## 📊 Bagian I: Audit Forensik & Temuan Kritis

### 1. Keamanan & Integritas Data (Zero-Fraud)
- **Anti-Fraud Engine**: Rekalkulasi Harga & Berat di server (Database RPC) untuk mencegah manipulasi angka melalui browser console oleh user nakal.
- **Stock Lifecycle**: Otomatisasi pengembalian stok jika pembayaran kadaluarsa (Expired) melalui webhook Xendit untuk mencegah "Stok Hantu".
- **Concurrency Guard**: Implementasi `FOR UPDATE` locking pada level baris stok untuk mencegah *overselling* saat promo.

### 2. Akuntansi & Kepatuhan Bisnis (Financial Accuracy)
- **Net Profit Tracking**: Pencatatan otomatis PPN 11% dan Biaya Admin Xendit per transaksi agar laporan profit di Admin Dashboard akurat (Laba Bersih).
- **Voucher Usage Integrity**: Pencatatan permanen setiap pemakaian voucher untuk mencegah kebocoran diskon berulang.

### 3. Logistik & Performa (High-Speed Operations)
- **Biteship Optimization**: Caching `biteship_area_id` di tabel alamat untuk mempercepat proses checkout (menghindari delay API area).
- **Multi-Origin Pickup**: Penentuan lokasi jemput kurir secara dinamis dari cabang toko yang sesuai.
- **Logistics Webhook**: Otomatisasi status "Delivered" via API Biteship untuk efisiensi kerja admin.
- **Search Performance**: Penambahan Index GIN dan B-Tree pada kolom pencarian kunci agar dashboard tetap cepat saat data sudah ribuan.

### 4. Keamanan Infrastruktur (Hardening)
- **Webhook Service Role**: Penggunaan Service Role khusus untuk Webhook agar tidak terhalang proteksi RLS saat update status pembayaran.
- **Security Definer Fix**: Perbaikan Recursive RLS di `is_admin` dan penambahan `search_path=public` di semua fungsi database.

---

## 🚀 Bagian II: Rencana Eksekusi (Roadmap)

### Fase 1: Integrity, Security & Performance (The Big Fix)
- [ ] **Financial & Fraud Guard**: Refaktor `create_order_v1` (Harga, Berat, Pajak, Admin Fee).
- [ ] **Logistics & Performa**: Setup `biteship_area_id` mapping & Database Indexing (GIN/B-Tree).
- [ ] **Automated Lifecycle**: Setup Service Role Webhook & Cleanup Job (Zombie Order).
- [ ] **Database Hardening**: Fix RLS Loop & Search Path.

### Fase 2: Integration & Assets
- [ ] **Assets Expansion**: Tambah kolom resi & Pindahkan logic ke `@bananasbindery/api-client`.
- [ ] **Webhook Logistics**: Implementasi Biteship Webhook Handler.

### Fase 3: Admin Dashboard & Engagement
- [ ] **Admin Dashboard**: Profit Analytics (Net Profit) & Bulk Shipping Management.
- [ ] **Engagement**: Bouncy UI real-time status pengiriman.

---
**Status: Audit Forensik PARIPURNA | 1000% Ready for Enterprise Presentation.**
