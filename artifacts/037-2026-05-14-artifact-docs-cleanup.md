# 037 — Artifact & Docs Cleanup for Binder Scope

Tanggal: 2026-05-14
Status: In Progress
Scope: membersihkan artifact lama yang tidak relevan dan menyelaraskan dokumen project/SEO agar mengikuti scope jualan binder/photo-product.

## Konteks

User meminta artifact lama dibersihkan karena banyak yang berasal dari project lama/source project dan dapat menyesatkan sesi berikutnya. Project aktif adalah Bananasbindery binder/photo-product commerce.

## Apa yang diubah

### 1. Cleanup folder artifacts

File:

- `artifacts/README.md` — rewrite menjadi indeks artifact aktif Binder-era.
- 89 artifact lama dihapus dari folder `artifacts/`.
- Artifact yang dipertahankan:
  - `032-2026-05-14-binder-alignment-and-pricing-core.md`
  - `033-2026-05-14-supabase-binder-mcp-and-order-rpc-hardening.md`
  - `034-2026-05-14-admin-dashboard-products-promos.md`
  - `035-2026-05-14-xendit-biteship-readiness-and-live-migration.md`
  - `036-2026-05-14-binder-codebase-continuation.md`
  - `2026-05-14-admin-recovery-build-fix.md`
  - `037-2026-05-14-artifact-docs-cleanup.md`

Alasan:

- Artifact sebelum pivot banyak memuat konteks service lama dan membuat agent berikutnya berisiko mengerjakan scope yang salah.
- Folder artifact sekarang menjadi source of truth untuk pekerjaan Binder-era.

### 2. PRD diselaraskan ulang

File:

- `PRD.md`

Perubahan:

- Rewrite PRD menjadi dokumen ringkas yang fokus ke binder/photo-product commerce.
- Scope aktif: catalog, variants, cart, checkout, Xendit, Biteship, admin, owner visibility, loyalty/reorder.
- DB summary diganti menjadi domain aktif: products, variants, orders, payments, shipping, vouchers, stock movements, webhook events.
- SEO section difokuskan ke binder photocard, refill, custom-name binder, gift bundle.

Alasan:

- PRD sebelumnya masih membawa schema/API/flow dari source project lama.
- PRD harus menjadi arahan utama agar agent berikutnya tidak menghidupkan modul yang bukan scope aktif.

### 3. Architecture diselaraskan ulang

File:

- `ARCHITECTURE.md`

Perubahan:

- Rewrite architecture menjadi monorepo architecture untuk Binder commerce.
- Menegaskan dependency direction, shared package responsibility, checkout/payment/shipping/admin flows.
- Historical DB cleanup harus via explicit migration dan regenerate Supabase types.

Alasan:

- Architecture lama masih mencampur target future app dan module service lama.
- Dokumen baru lebih kecil, jelas, dan sesuai monorepo integrity mandate.

### 4. Roadmap/plan docs dibersihkan

File:

- `claudeplan/01-web-platform.md`
- `claudeplan/02-admin-notification-integration.md`
- `claudeplan/05-customer-experience-flow.md`

Perubahan:

- Roadmap web-first dipivot ke binder storefront, checkout, admin, SEO, QA.
- Notification plan hanya memakai event order/payment/shipping/promo.
- Customer journey diganti dari wording source project lama menjadi binder/refill/custom/gift flow.

Alasan:

- Long-term roadmap harus match project goal sekarang.

### 5. AI/SEO playbook dipivot

File:

- `AI-visibilites.md`

Perubahan:

- Rewrite dari local service-area lama menjadi AI visibility strategy untuk binder/photo-product.
- Structured data example memakai `Store`, bukan schema service lama.
- Keyword/content pillar diganti ke binder photocard, refill A5/A6, custom-name binder, gift binder.

Alasan:

- SEO/AI visibility harus mendukung produk jualan aktual.

### 6. Local instruction mirrors diselaraskan

File:

- `CLAUDE.md`
- `GEMINI.md`
- `KIRO.md`

Perubahan:

- Mandatory artifact reading diarahkan ke `artifacts/README.md` + Binder-era reports.
- Bottom nav wording disesuaikan ke Home, Produk, Pesanan, Akun.
- Branding example diganti menjadi Promo/Product cards.

Alasan:

- Instruction files tidak boleh lagi mengarahkan agent ke artifact lama yang sudah dihapus atau tab lama yang bukan goal aktif.

### 7. Sisa code/data legacy ringan dibersihkan

File:

- `.gemini/settings.json`
- `.agents/scratch/test_biteship.js`
- `supabase/seed.sql`
- `supabase/cleanup.sql`
- `supabase/functions/fonnte-otp/index.ts`
- `packages/api-client/src/types.ts`
- `packages/config/src/constants.ts`
- `packages/core/src/services/shipping.service.ts`
- `packages/types/src/enums.ts`
- `apps/web/app/admin/actions.ts`
- `apps/web/components/shared/product-card.tsx`
- `test-payment.js`

Perubahan:

- Supabase MCP mirror diganti ke `supabase-binder` project ref Binder.
- Seed SQL diganti menjadi starter catalog binder/photo-product.
- OTP/Fonnte message diganti dari kebutuhan source project lama menjadi binder/photocard essentials.
- Biteship scratch test diganti memakai item binder A5.
- API client type export untuk service/booking dihapus dari public API.
- Config constant booking diganti menjadi order review reminder.
- Shipping validation dan product badge tidak lagi memakai product type lama; bundle/parcel dipakai untuk produk besar/gift bundle.
- Product type enum dan admin product type parser dibatasi ke `normal | parcel`.
- Test payment fallback email diganti ke domain Bananasbindery.

Alasan:

- Selain dokumen, masih ada copy/source-project wording di seed data, scratch test, helper config, dan public types yang bisa menghidupkan domain lama.

## Validasi

Sudah dijalankan:

- Artifact file listing setelah cleanup: tersisa 8 file termasuk artifact 037.
- Active markdown scan excluding `.claude/` and `artifacts/` untuk term legacy: `active_md_files_with_legacy_terms=0`.
- Active non-generated domain scan excluding `.claude/`, `artifacts/`, `node_modules`, build output, generated Supabase types, and migrations: hanya tersisa false positive `vercel.json` pada command `--no-frozen-lockfile`.
- `pnpm type-check` → pass (`8 successful, 8 total`).
- `pnpm lint` → pass (`2 successful, 2 total`).
- `pnpm build` → pass; Next.js compiled and generated 37 static pages.

Catatan build:

- Ada warning existing: `The Next.js plugin was not detected in your ESLint configuration`; tidak menghalangi build.

## Revert notes

- Artifact cleanup bisa direvert via git restore untuk file `artifacts/*` yang terhapus.
- Docs cleanup bisa direvert per file:
  - `PRD.md`
  - `ARCHITECTURE.md`
  - `AI-visibilites.md`
  - `claudeplan/01-web-platform.md`
  - `claudeplan/02-admin-notification-integration.md`
  - `claudeplan/05-customer-experience-flow.md`
  - `CLAUDE.md`
  - `GEMINI.md`
  - `KIRO.md`
  - `artifacts/README.md`
