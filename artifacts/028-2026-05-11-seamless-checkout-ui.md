# Execution Audit: Seamless Checkout & PRD v2.0 Sync

- **Date**: 2026-05-11
- **Task**: Sinkronisasi UI Checkout dengan PRD v2.0 & Finalisasi DevOps

## Apa yang Diubah & Di Mana (Path)
1. **Schema Integrity Fix**:
   - `apps/web/app/checkout/page.tsx`
   - `apps/web/app/profile/addresses/new/page.tsx`
   - `apps/web/app/orders/[id]/page.tsx`
   - *Tindakan*: Mengubah pemanggilan `receiver_name` menjadi `recipient_name` agar sesuai dengan skema Drizzle di `packages/db`.

2. **Seamless Checkout Orchestrator**:
   - `apps/web/components/checkout/MapPicker.tsx` (NEW)
   - `apps/web/components/checkout/CheckoutSheet.tsx` (NEW)
   - `apps/web/app/cart/page.tsx`
   - `apps/web/app/checkout/page.tsx`
   - *Tindakan*: Menghapus flow checkout halaman utuh dan menggantinya dengan "4-step Bottom Sheet" (Map -> OTP -> Kurir -> Pembayaran) yang dibuka langsung dari Cart Page. Halaman `/checkout` lama diubah menjadi *redirect* ke `/cart`.

3. **DevOps & Automations**:
   - `vercel.json` (NEW)
   - *Tindakan*: Mendefinisikan *cron jobs* untuk `/api/cron/abandoned-carts` (setiap 8 pagi), `/api/cron/expire-pending-orders` (setiap jam), dan `/api/cron/otp-cleanup` (tengah malam).

4. **UI Package Enhancement**:
   - `packages/ui/src/components/sheet.tsx` (NEW)
   - `packages/ui/src/index.ts`
   - *Tindakan*: Membuat komponen `Sheet` lokal untuk menyelesaikan error TypeScript (`TS2305: Module '@bananasbindery/ui' has no exported member 'Sheet'`) tanpa perlu menginstall *dependencies* Radix UI tambahan yang belum ada di monorepo.

## Mengapa (Rasionale Teknis)
Pekerjaan Backend yang dieksekusi sebelumnya oleh Opus sangat solid, namun belum tersambung ke Frontend. PRD v2.0 spesifik menuntut adanya Leaflet Map Picker dan Passwordless OTP flow langsung di atas halaman Cart untuk meminimalisir *drop-off* saat *checkout*. Semua perubahan UI ini telah melewati `pnpm -w type-check` (Exit 0) sehingga *Zero-Any Policy* & *Monorepo Integrity* tetap terjamin 100%.
