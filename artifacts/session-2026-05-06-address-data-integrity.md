# Audit Trail: Address Data Integrity & UI Clarity

> Tanggal: 2026-05-06
> Status: Completed & Validated

## Context
Ditemukan isu redundansi data di mana satu user bisa memiliki lebih dari satu alamat "Utama". Selain itu, diperlukan kejelasan lebih pada UI saat mengatur alamat utama.

## File Manifest

| File | Status | Perubahan | Rationale |
| --- | --- | --- | --- |
| `apps/web/components/checkout/address-sheet.tsx` | [MODIFY] | Penambahan logic `unset` is_default lama & update UI label + hint. | Memastikan integritas data (hanya ada satu alamat utama per user) dan memberikan edukasi visual pada user. |

## Surgical Breakdown

### 1. Data Integrity Logic
- **Sync Primary**: Di fungsi `saveAddress`, ditambahkan query untuk melakukan update `is_default: false` pada semua alamat milik user sebelum menyimpan alamat baru sebagai `true`.
- **Rationals**: Menghindari kebingungan sistem saat menentukan ongkir/pengiriman otomatis karena adanya dua alamat utama.

### 2. UI Clarity Enhancement
- **Visual Hint**: Label "Jadikan Alamat Utama" diperbarui dengan sub-text deskriptif: *"Alamat ini akan otomatis terpilih untuk setiap pesanan baru kamu."*
- **Layout**: Mengubah layout checkbox menjadi `items-start` agar teks deskripsi yang lebih panjang tetap terlihat rapi dan tidak merusak alignment checkbox.

## Validation Results
- `npm run type-check`: **PASS** (Exit code 0)
- Logic Verification: Setiap pembuatan alamat baru sebagai "Utama" kini akan otomatis menonaktifkan status utama pada alamat-alamat sebelumnya di database.

---

## Insight & Next Step
- **Insight**: Langkah ini menutup celah bug data integrity yang bisa berakibat fatal pada kalkulasi logistik otomatis.
- **Next Step**: Sistem sudah siap untuk testing flow checkout yang lebih stabil.
