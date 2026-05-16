# Production Run & Migration Plan — Bananasbindery Binder

> For Hermes: gunakan plan ini sebagai checklist eksekusi sebelum project dianggap runnable/production-ready. Jangan apply migration live tanpa approval Je. Jangan print secret/token di output.

Goal: membuat project Bananasbindery binder/photo-product bisa dijalankan stabil dari local sampai production dengan database, env, catalog, payment, shipping, admin, dan deployment yang sinkron.

Architecture: project adalah pnpm/turbo monorepo dengan Next.js app di `apps/web`, shared package di `packages/*`, dan Supabase sebagai DB/Auth. Payment memakai Xendit, shipping memakai Biteship, dan semua cleanup DB harus melalui migration eksplisit + regenerate Supabase types.

Tech Stack: pnpm 10, Node >=20, Next.js 15, Supabase, Xendit Invoice, Biteship, Vercel.

---

## Phase 0 — Freeze Current Recovery State

Objective: mengamankan state recovery agar tidak ter-revert lagi sebelum lanjut migration dan runnable QA.

Files:

- Review: seluruh working tree via `git status --short`
- Commit: semua perubahan cleanup/recovery yang sudah tervalidasi

Steps:

1. Run:
   `git status --short`
2. Review kategori perubahan:
   - artifact cleanup
   - docs/plan pivot ke binder
   - legacy booking/petshop deletion
   - admin recovery
   - payment/shipping hardening
   - seed/env/config cleanup
3. Run validation ulang:
   - `pnpm type-check`
   - `pnpm lint`
   - `pnpm build`
4. Commit setelah review:
   `git add . && git commit -m "chore: stabilize binder recovery baseline"`
5. Jika commit hook gagal dan perubahan tampak hilang, ikuti Git Hook & Stash Recovery Protocol di `CLAUDE.md`.

Acceptance:

- Working tree clean setelah commit atau hanya menyisakan perubahan yang sengaja belum di-commit.
- Validasi pass sebelum commit.

---

## Phase 1 — Environment & Secret Hygiene

Objective: project bisa jalan local tanpa secret bocor dan env production jelas.

Files:

- `.env.example`
- `.env.local` local only, jangan commit
- Vercel project env
- Supabase project `xiumxugolyfsvwnwzenp`

Required env keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`
- `XENDIT_SECRET_KEY`
- `XENDIT_CALLBACK_TOKEN`
- `BITESHIP_API_KEY`
- `BITESHIP_ORIGIN_AREA_ID`
- Optional: `NEXT_PUBLIC_STORAGE_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `FONNTE_TOKEN`

Steps:

1. Replace `.env.example` with safe placeholders only. No real-looking key values.
2. Align `.env.example` with current code. Remove Midtrans/RajaOngkir keys if unused by active code.
3. Verify `.env`, `.env.local` are ignored by git.
4. Confirm app can boot with local env:
   `pnpm dev`
5. Verify runtime routes fail clearly when required secret missing, not with silent auth/API errors.

Acceptance:

- `.env.example` contains no real key/token.
- `pnpm dev` starts local web app.
- Missing Xendit/Biteship/Supabase service env returns clear 503/guarded error in API routes.

---

## Phase 2 — Supabase Migration Decision

Objective: decide whether DB live already enough, or needs cleanup migration before final run.

Known state from artifacts:

- Binder project ref: `xiumxugolyfsvwnwzenp`
- Applied live migrations reported in artifact 035:
  - `20260514003000_harden_create_order_v1_inventory_pricing`
  - `20260514011500_payment_shipping_lifecycle_hardening`
- `packages/types/src/supabase.ts` still may contain generated historical table/enum names until regenerated.

Steps:

1. Verify live schema objects:
   - `orders` has payment/shipping lifecycle fields.
   - `webhook_events` exists.
   - RPC `create_order_v1` exists.
   - RPC `release_order_inventory_v1` exists.
2. Verify active app does not call legacy tables/modules.
3. Decide cleanup path:
   - Path A, recommended first: keep historical DB tables untouched, regenerate types when tooling is available, and do not use legacy tables in app.
   - Path B, stricter cleanup: create explicit migration to drop historical tables/enums only after confirming no active foreign key/function depends on them.
4. If Path B is chosen, create migration file under `supabase/migrations/YYYYMMDDHHMMSS_drop_legacy_source_project_objects.sql`.
5. Migration must include safe guards:
   - `DROP TABLE IF EXISTS ... CASCADE` only for confirmed legacy tables.
   - `DROP TYPE IF EXISTS ... CASCADE` only for confirmed legacy enums.
   - Never manually edit production DB in dashboard.

Acceptance:

- A written decision exists in artifact before DB cleanup.
- No destructive DB operation happens without Je approval.
- If migration applied, live schema and app still pass checkout/admin smoke.

---

## Phase 3 — Regenerate Supabase Types

Objective: generated types match live Binder DB, so code no longer carries stale schema assumptions.

File:

- `packages/types/src/supabase.ts`

Preferred commands:

1. If Supabase CLI privilege works:
   `supabase gen types typescript --project-id xiumxugolyfsvwnwzenp --schema public > packages/types/src/supabase.ts`
2. If using DB URL and Docker is available:
   `supabase gen types typescript --db-url "$DATABASE_URL" --schema public > packages/types/src/supabase.ts`

Steps:

1. Confirm `supabase` CLI installed:
   `supabase --version`
2. Generate to temp file first:
   `supabase gen types typescript --project-id xiumxugolyfsvwnwzenp --schema public > /tmp/bananasbindery-supabase.ts`
3. Inspect temp file for obvious truncation/errors.
4. Replace `packages/types/src/supabase.ts` only if generation succeeded.
5. Run:
   - `pnpm --filter @bananasbindery/types type-check`
   - `pnpm type-check`
   - `pnpm lint`
   - `pnpm build`

Acceptance:

- Generated file is valid TypeScript.
- Type-check/lint/build pass.
- If historical types remain, confirm they are because live DB still has historical objects and active code does not use them.

---

## Phase 4 — Seed & Catalog Runnable State

Objective: local/live DB has binder product catalog that can power storefront, product detail, cart, checkout, admin.

Files:

- `supabase/seed.sql`
- `apps/web/lib/dummy-products.ts`
- product images/assets folder
- storage bucket/product image URLs

Steps:

1. Verify `supabase/seed.sql` contains binder categories/products only.
2. Verify product fields needed by UI/API:
   - name, slug, description
   - price, cost_price, promo_price
   - stock
   - weight_grams
   - type: `normal` or `parcel`
   - category_id
3. Map product images from `assets/` to real product rows/storage URLs.
4. Ensure dummy fallback products are binder-only.
5. Run homepage/product route locally and verify no broken image/copy.

Acceptance:

- Homepage shows binder products.
- Product detail works for every seeded slug.
- No pet/source-project product names appear in active UI or seed.

---

## Phase 5 — Local Run Smoke Test

Objective: prove project can run locally before integration testing.

Commands:

- `pnpm install`
- `pnpm type-check`
- `pnpm lint`
- `pnpm build`
- `pnpm dev`

Manual browser smoke:

1. `/` loads.
2. `/products` loads.
3. `/products/[slug]` loads for a seeded binder product.
4. Add to cart works.
5. `/cart` shows item and quantity update works.
6. `/checkout` loads after auth/address requirements.
7. `/admin` loads for admin user.
8. `/admin/products` list/create/edit works.

Acceptance:

- No runtime crash in local console for critical paths.
- No secret printed in terminal logs.

---

## Phase 6 — Checkout, Xendit, and Biteship E2E

Objective: prove one full paid order can move through order/payment/shipping lifecycle.

Files/routes:

- `apps/web/app/api/payment/create/route.ts`
- `apps/web/app/api/payment/webhook/route.ts`
- `apps/web/app/api/shipping/areas/route.ts`
- `apps/web/app/api/shipping/rates/route.ts`
- `apps/web/app/api/shipping/webhook/route.ts`
- `apps/web/app/api/shipping/track/[id]/route.ts`

Steps:

1. Create test customer and address.
2. Add binder product with stock > 0 to cart.
3. Resolve destination area via Biteship route.
4. Fetch rates via Biteship route.
5. Create order via checkout.
6. Create Xendit invoice.
7. Simulate/pay invoice sandbox.
8. Verify Xendit webhook:
   - `orders.payment_status = paid`
   - `orders.status` transitions correctly
   - transaction row exists
   - webhook event stored idempotently
9. Verify Biteship order creation or sandbox mock path.
10. Verify tracking route returns usable data.
11. Test expired invoice path:

- inventory released once
- duplicate webhook ignored

Acceptance:

- One paid order completes from cart to payment success.
- Duplicate webhook does not double-update stock/payment.
- Expired invoice releases inventory exactly once.

---

## Phase 7 — Admin End-to-End

Objective: owner/admin can operate the store.

Routes:

- `/admin`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/orders`
- `/admin/promos`

Steps:

1. Confirm admin role exists in `profiles` for test user.
2. Create product with variant/stock/weight.
3. Edit price/promo/stock/image.
4. Verify product appears in storefront.
5. Open order detail and update status.
6. Create coupon/promo and verify checkout discount if supported.
7. Confirm non-admin cannot access admin routes.

Acceptance:

- Admin CRUD works against live schema.
- No direct legacy `@bananasbindery/db` import returns.
- Role guard blocks non-admin.

---

## Phase 8 — SEO/AI Visibility Finalization

Objective: public app is ready to be indexed as binder/photo-product store.

Files/routes:

- `apps/web/app/robots.ts` or `/robots.txt` route
- `apps/web/app/sitemap.ts` or `/sitemap.xml` route
- metadata in layout/pages
- product/category structured data
- `AI-visibilites.md`

Steps:

1. Verify homepage metadata: title, description, OG image, canonical.
2. Verify product metadata uses product name/description/image.
3. Verify sitemap includes homepage, products, categories.
4. Verify robots allows public storefront and blocks private/admin paths if needed.
5. Add Product/Store structured data if missing.
6. Run build and inspect generated routes.

Acceptance:

- No public SEO copy references source-project domain.
- Sitemap/robots routes build and return valid output.

---

## Phase 9 — Production Deploy Readiness

Objective: deployable to Vercel without hidden runtime failures.

Steps:

1. Configure Vercel env with production/sandbox choice clearly:
   - Supabase URL/anon/service role
   - Xendit secret/callback token
   - Biteship key/origin area
   - App URL
2. Set Xendit webhook URL to active route used by code.
3. Set Biteship webhook URL if using shipping webhook lifecycle.
4. Deploy preview.
5. Run smoke on preview.
6. Promote to production only after preview checkout/admin pass.

Acceptance:

- Vercel build pass.
- Preview smoke pass.
- Webhook dashboard points to correct production URL.

---

## Phase 10 — Final Artifact & Handoff

Objective: mark project runnable and provide revert/maintenance notes.

Files:

- `artifacts/038-2026-05-14-production-run-migration-plan.md` or next artifact number
- update `artifacts/README.md`

Include:

- migration decision taken
- env readiness status, without secrets
- generated types status
- E2E order ID/test notes, without sensitive data
- validation commands and results
- known limitations
- next backlog

Final validation commands:

- `pnpm type-check`
- `pnpm lint`
- `pnpm build`
- optional: `pnpm test`
- manual E2E checklist marked pass/fail

Acceptance:

- Je can run project from README/plan without guessing.
- Any remaining blocker is explicitly listed with owner/action.

---

## Immediate Next Action

Recommended next task: execute Phase 0 + Phase 1 first.

Reason:

- Current working tree has many intentional changes; freeze it before deeper migration.
- `.env.example` currently needs cleanup/alignment before other developers or deploys use it.
- DB destructive cleanup should wait until state is committed and env/tooling is stable.
