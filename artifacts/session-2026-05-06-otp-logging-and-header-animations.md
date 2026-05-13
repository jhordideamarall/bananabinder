# Audit Trail: OTP Logging & Header Animation Restoration

> Tanggal: 2026-05-06
> Status: Completed & Validated

## Context
Sesi ini menangani dua isu utama: 
1. Kegagalan OTP (500 error) yang terkonfirmasi disebabkan oleh status Fonnte yang *disconnected*.
2. Restorasi estetika header (animasi bounce & spin) yang sempat hilang/terlalu statis.

## File Manifest

| File | Status | Perubahan | Rationale |
| --- | --- | --- | --- |
| `supabase/functions/fonnte-otp/index.ts` | [MODIFY] | Penambahan `console.log` mendalam & detail error mapping. | Supabase Auth membutuhkan response 200, namun jika Fonnte gagal, log harus memberikan insight jelas mengapa gagal (seperti "device disconnected"). |
| `apps/web/components/layout/header.tsx` | [MODIFY] | Restorasi Framer Motion pada `PawIcon`, `Bell`, dan `Cart`. | Menghidupkan kembali "vibe" premium dengan animasi entrance spin dan interaksi bouncy. |
| `apps/web/app/(shop)/products/[slug]/_client.tsx` | [MODIFY] | Sinkronisasi animasi Top Bar dengan header utama. | Memastikan UX konsisten saat user berpindah dari list ke detail product. |

## Surgical Breakdown

### 1. Edge Function Robustness (`fonnte-otp`)
- **Change**: Menambahkan logging `Fonnte API Response` sebelum mengirimkan response ke Supabase.
- **Why**: Agar saat Fonnte disconnect (seperti kondisi saat ini), user/dev bisa langsung melihat `reason` asli dari Fonnte di logs dashboard Supabase tanpa harus menebak-nebak arti error 500.

### 2. UI/UX Restoration (Header)
- **PawIcon**: Menambahkan `entrance animation` (scale 0 to 1 with rotate -180 to 0) dan `hover spin` (subtle rotation wiggle).
- **Icons (Bell & Cart)**: Menambahkan `rotate` wiggle pada hover dan meningkatkan `stiffness` pada spring interaksi `whileTap`.
- **Top Bar (Product Detail)**: Menyelaraskan animasi agar tidak terasa "kaku" saat berada di halaman produk.

## Validation Results
- `npm run type-check`: **PASS** (Exit code 0)
- Visual Audit: Header sekarang terasa lebih "alive" dan responsif terhadap interaksi user.
- Log Audit: Edge function siap memberikan insight detail jika terjadi kegagalan provider.

---

## Insight & Next Step
- **Insight**: Status Fonnte saat ini memang disconnect. Mohon lakukan reconnection di dashboard Fonnte agar OTP bisa kembali terkirim secara real-time.
- **Next Step**: Jika Fonnte sudah reconnect, testing bisa dilanjutkan pada flow checkout guest tanpa menggunakan demo bypass.
