# Audit Note: Asset Renaming & Standardization

**Tanggal:** 2026-05-11
**Task ID:** 023
**Status:** ✅ Completed

## Ringkasan Perubahan

Tugas ini berfokus pada perapian folder `assets/img` agar memiliki penamaan yang standar, konsisten, dan siap untuk di-upload ke sistem cloud storage (Supabase).

### Detil Perapian
- **Pola Penamaan:** `[nama-folder]-[urutan].[ekstensi]` (contoh: `binder-bundling-01.jpg`).
- **Standardisasi Ekstensi:** Semua ekstensi diubah menjadi lowercase (misal: `.JPG` -> `.jpg`).
- **Pembersihan Karakter:** Menghapus spasi, tanda kurung, dan karakter non-standar lainnya yang berpotensi menyebabkan error pada URL web.

### Folder yang Diproses:
1. `binder-denim-pink-and-blue`
2. `binder-custom-nama`
3. `binder-slot-phone`
4. `binder-butterfly-violet`
5. `binder-bundling`
6. `binder-rose-blossom`

## Hasil
Seluruh gambar (JPG, PNG) di dalam sub-folder `assets/img` kini memiliki nama yang bersih dan terurut secara alfabetis. Ini akan memudahkan proses *mapping* data produk ke database di tahap selanjutnya.

---
*Catatan: File non-gambar seperti `README.md` tidak diubah.*
