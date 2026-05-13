# Audit Trail: Address Selection UX Optimization

> Tanggal: 2026-05-06
> Status: Completed & Validated

## Context
User mengeluhkan penumpukan alamat di halaman Akun karena flow "Ubah Alamat" di checkout memaksa user untuk selalu membuat alamat baru (Map -> Form) alih-alih memilih yang sudah ada.

## File Manifest

| File | Status | Perubahan | Rationale |
| --- | --- | --- | --- |
| `apps/web/components/checkout/address-sheet.tsx` | [MODIFY] | Penambahan step `list`, logic fetching `getUserAddresses`, dan UI daftar alamat. | Memberikan pilihan bagi logged-in user untuk memilih alamat yang sudah tersimpan sebelum masuk ke flow pembuatan alamat baru. |

## Surgical Breakdown

### 1. Address Selection List
- **Logic**: Menggunakan `getUserAddresses` dari `address-client` untuk menarik daftar alamat user saat sheet dibuka.
- **UX Flow**: 
  - Jika user punya alamat tersimpan: Sheet terbuka di step `list`.
  - Jika user belum punya alamat atau sebagai guest: Sheet terbuka langsung di step `map`.
- **Selection**: Klik pada item alamat langsung memicu `onSuccess` dan menutup sheet, mempercepat proses checkout.

### 2. "Tambah Alamat Baru" Entry Point
- Menambahkan tombol dashed border di bawah daftar alamat untuk masuk ke flow pencarian lokasi via Map.

## Validation Results
- `npm run type-check`: **PASS** (Exit code 0)
- Visual Audit: Daftar alamat ditampilkan dengan layout kartu yang rapi, lengkap dengan badge "Utama" untuk alamat default.

---

## Insight & Next Step
- **Insight**: Perubahan ini secara signifikan mengurangi redundansi data di database karena user tidak lagi terpaksa mengulang proses input alamat yang sama.
- **Next Step**: User bisa mengetes flow "Ubah" di checkout untuk melihat daftar alamat yang tersimpan.
