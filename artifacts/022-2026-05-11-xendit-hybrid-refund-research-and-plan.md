# Research & Future Implementation Plan: Hybrid Refund System

**Tanggal:** 2026-05-11
**Task ID:** 022
**Status:** 📋 Proposed / Future Work

## 1. Latar Belakang & Masalah
Saat ini sistem pembatalan pesanan di Bananasbindery baru sekadar mencatat status `refund_pending` di database. Owner toko masih harus melakukan refund secara manual melalui dashboard Xendit. 

Masalah utama pada refund manual:
- **Operational Burden:** Admin harus login ke Xendit satu per satu.
- **Data Privacy:** Admin seringkali harus meminta nomor rekening pelanggan secara manual via chat jika pembayaran awal menggunakan Virtual Account (VA) yang tidak mendukung *auto-reversal*.

## 2. Strategi Solusi: Hybrid Refund
Menggunakan kombinasi API Xendit untuk mengotomatiskan pengembalian dana tanpa perlu menyimpan data rekening pelanggan.

### A. Alur Otomatis (Return-to-Source)
- **Target:** E-Wallet (GoPay, ShopeePay), Kartu Kredit, QRIS.
- **Mekanisme:** Menggunakan `POST /refunds` dengan `payment_request_id`.
- **Hasil:** Dana langsung kembali ke saldo e-wallet/limit kartu pelanggan asli.

### B. Alur Payout Link (Untuk VA & Fallback)
- **Target:** Virtual Account (Mandiri, BRI, dll) atau jika refund otomatis gagal.
- **Mekanisme:** 
    1. Sistem membuat **Payout Link** melalui Xendit API.
    2. Sistem mengirimkan link tersebut secara otomatis ke WhatsApp pelanggan via Fonnte.
    3. Pelanggan mengisi data rekening tujuan mereka sendiri di portal resmi Xendit.
- **Hasil:** Dana cair ke rekening pilihan pelanggan tanpa admin perlu memegang data rekening mereka.

## 3. Desain Teknis (Untuk Implementasi Nanti)

### Perubahan Schema Database
Menambahkan kolom pendukung di tabel `refunds`:
```sql
ALTER TABLE refunds ADD COLUMN xendit_payout_id TEXT;
ALTER TABLE refunds ADD COLUMN payout_url TEXT;
```

### Logika Backend Baru (`packages/db/src/logic/orders.ts`)
```typescript
export async function processRefund(orderId: string) {
  // 1. Cek jenis pembayaran awal
  // 2. Jika e-wallet/credit card:
  //    Try createXenditRefund() -> Update status 'completed'
  // 3. Jika Virtual Account atau Refund Gagal:
  //    Create Payout Link -> Update status 'payout_link_sent'
  //    Send WA: "Klik link ini untuk klaim refund Anda: {payout_url}"
}
```

## 4. Keuntungan Bisnis
- **Keamanan:** Mematuhi kebijakan *return-to-source* Xendit.
- **Trust:** Pelanggan merasa aman karena mengisi data bank di portal resmi Xendit, bukan di chat WhatsApp.
- **Efisiensi:** Mengurangi beban kerja Admin hingga 90% dalam menangani pembatalan.

## 5. Referensi Dokumentasi
- [Xendit Refund API](https://developers.xendit.co/api-reference/#refunds)
- [Xendit Payout Links Guide](https://docs.xendit.co/payouts/payout-links)
