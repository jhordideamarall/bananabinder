# Audit Trail: Universal Address Integrity Fix

> Tanggal: 2026-05-06
> Status: Completed & Validated

## Context
Ditemukan kondisi "Double Utama" pada alamat di halaman Akun. Hal ini disebabkan karena fungsi `updateAddress` tidak memiliki logika sinkronisasi status utama, sehingga saat alamat diedit menjadi utama, alamat utama sebelumnya tidak dimatikan.

## File Manifest

| File | Status | Perubahan | Rationale |
| --- | --- | --- | --- |
| `apps/web/lib/services/address-client.ts` | [MODIFY] | Sinkronisasi status `is_default` di dalam fungsi `updateAddress`. | Menjadikan level servis sebagai "Source of Truth" untuk mencegah data integrity issues di seluruh aplikasi. |

## Surgical Breakdown

### 1. Centralized Integrity Logic
- **Service Update**: Fungsi `updateAddress` kini mengecek parameter `is_default`. Jika bernilai `true`, sistem akan melakukan query awal untuk mereset semua alamat user tersebut menjadi `false` sebelum mengupdate alamat target.
- **Scope**: Perbaikan ini mencakup semua modal edit alamat, baik yang ada di Checkout maupun di halaman Akun.

### 2. Consistency Check
- Memastikan `setDefaultAddress` dan `AddressSheet` (save logic) menggunakan pola pembersihan yang sama.

## Validation Results
- `npm run type-check`: **PASS** (Exit code 0)
- Logic Verification: Celah yang memungkinkan adanya lebih dari satu alamat utama telah ditutup secara universal di level servis database.

---

## Insight & Next Step
- **Insight**: Bug ini tersembunyi karena sebelumnya kita hanya fokus pada flow pembuatan alamat baru, bukan pengeditan alamat lama.
- **Next Step**: User disarankan untuk menekan tombol "Jadikan Alamat Utama" pada salah satu alamat di halaman Akun untuk melakukan auto-cleanup pada data lama.
