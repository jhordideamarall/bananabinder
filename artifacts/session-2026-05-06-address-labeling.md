# Audit Trail: Address Labeling & Categorization

> Tanggal: 2026-05-06
> Status: Completed & Validated

## Context
Alamat memerlukan kategorisasi label yang jelas (Rumah, Kantor, Kos, Lainnya) yang terpisah dari status "Utama". UI harus memungkinkan user memilih label ini saat membuat alamat baru.

## File Manifest

| File | Status | Perubahan | Rationale |
| --- | --- | --- | --- |
| `apps/web/components/checkout/address-sheet.tsx` | [MODIFY] | Penambahan state `label`, UI Label Selector, dan integrasi ke logic `saveAddress`. | Menyamakan UX dengan standar aplikasi e-commerce premium dan memastikan kategorisasi alamat tersimpan dengan benar di database. |

## Surgical Breakdown

### 1. Label Selection UI
- **Component**: Menambahkan row tombol pilihan (chips) untuk kategori Rumah, Kantor, Kos, dan Lainnya.
- **Styling**: Menggunakan warna primer untuk label aktif dengan efek bayangan (shadow) agar menonjol, dan warna batu (stone) untuk label non-aktif.

### 2. Categorization Logic
- **Data Persistence**: State `label` kini dinamis (tidak lagi hardcoded) dan dikirim ke database saat proses insert alamat.
- **Independence**: Status "Label" tetap dipertahankan meskipun status "Utama" dipindahkan ke alamat lain.

## Validation Results
- `npm run type-check`: **PASS** (Exit code 0)
- UI Audit: Pilihan label muncul di bagian paling atas form, memberikan hirarki informasi yang baik sebelum user mengisi detail penerima.

---

## Insight & Next Step
- **Insight**: Dengan adanya label kategori, user bisa lebih mudah mengelola banyak alamat di halaman Akun tanpa tertukar.
- **Next Step**: Sistem sudah sangat lengkap untuk kebutuhan pengelolaan alamat di sisi checkout.
