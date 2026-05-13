# 026 — Backend Preparation Aligned to PRD/ARCHITECTURE v2.0

**Tanggal**: 2026-05-11
**Aktor**: Claude (Opus 4.7)
**Scope**: Apply migration security hardening, tambah Zod validators, geocode service, rate-limit helper, dan API routes baru. Update PRD/ARCH untuk reflect passwordless auto-register flow.

---

## 1. Apa yang Diubah

### Migrasi DB (Supabase project `binderbanana2`)
| File | Status | Tujuan |
|---|---|---|
| `supabase/migrations/009_security_hardening.sql` | ✅ Applied via MCP | Lock `search_path`, REVOKE EXECUTE FROM anon untuk 4 RPC SECURITY DEFINER |
| `supabase/migrations/010_cart_reminders_and_audit.sql` | ✅ Applied via MCP | Tabel baru `cart_reminders` (idempotency abandoned cart) + `audit_logs` (admin trail) dengan RLS |
| `supabase/migrations/011_security_hardening_final.sql` | ✅ Applied via MCP | REVOKE authenticated dari RPC (API pakai service_role), DROP listing-capable bucket policy |

**Hasil advisor scan**: 12 warnings → **0 warnings** ✅

### Packages
| File | Aksi |
|---|---|
| `packages/db/src/services/rajaongkir.ts` | ❌ Deleted (obsolete, diganti Biteship) |
| `packages/db/src/fonnte.ts` | ❌ Deleted (duplikat root vs `services/fonnte.ts`) |
| `packages/db/src/services/geocode.ts` | ✨ New — Nominatim wrapper (`reverseGeocode`, `searchGeocode`) |
| `packages/db/src/validators.ts` | ✨ New — Centralized Zod schemas (phone, OTP, address, cart, shipping, checkout, geocode) |
| `packages/db/src/logic/auth.ts` | ✏️ Updated — `verifyOTP` accept `extras { recipient_name, address }`, auto-create profile + default address di first verify, return `is_new_user` & `address_id` |
| `packages/db/src/index.ts` | ✏️ Updated — export `validators` & `geocode`, hapus `rajaongkir` |
| `packages/db/package.json` | ✏️ Added `zod@^3.23.8` |

### Apps/web
| File | Aksi |
|---|---|
| `apps/web/lib/ratelimit.ts` | ✨ New — Upstash REST helper + in-memory fallback (5 limit kinds) |
| `apps/web/app/api/auth/otp/request/route.ts` | ✏️ Refactor — Zod validation + ratelimit per phone |
| `apps/web/app/api/auth/otp/verify/route.ts` | ✏️ Refactor — Zod validation + ratelimit + pass `recipient_name`/`address` ke `verifyOTP` → return `is_new_user`, `address_id` |
| `apps/web/app/api/geocode/reverse/route.ts` | ✨ New — Nominatim reverse + best-effort Biteship area_id resolve |
| `apps/web/app/api/geocode/search/route.ts` | ✨ New — Nominatim search bar |
| `apps/web/app/api/geocode/biteship-area/route.ts` | ✨ New — Resolve `area_id` from `{lat,lng}` atau `{query}` |

### Dokumen
| File | Update |
|---|---|
| `PRD.md` | Stack jadi **hybrid** (Drizzle + Supabase JS). Tambah row "Passwordless Account". Step [4] OTP verify: jelaskan auto-create user + auto-fill profile + cart linking |
| `ARCHITECTURE.md` | Stack hybrid + catatan deprecation. §4.1 OTP sequence diagram diperluas dengan branch new/existing user + `hidden_password` derivasi (`HMAC-SHA256(SECRET, phone)`) |

---

## 2. Hasil Validasi

```
✅ pnpm -w type-check          → 3/3 packages pass
✅ Supabase advisor (security) → 0 warnings (turun dari 12)
✅ Migration 009/010/011       → applied via MCP, idempotent SQL mirrored ke supabase/migrations/
```

---

## 3. Mengapa

1. **Source of truth re-aligned**: Project Supabase yang benar (`binderbanana2`) ditemukan punya schema binder yang clean. Backend codebase sudah pakai schema yang sama.
2. **Stack realism**: Drizzle dipertahankan (hybrid dengan Supabase JS) karena 15+ file sudah pakai dan production-ready. Refactor masal = high risk, low value.
3. **Passwordless mandate**: User minta first OTP verify langsung = akun. Existing `verifyOTP` sudah handle Supabase auth.users creation; tinggal extend untuk auto-fill profile name & default address.
4. **Reusable core**:
   - `packages/db/validators.ts` → semua API route validasi dari satu sumber (zero-any).
   - `packages/db/services/*` → semua 3rd-party (Biteship, Fonnte, Xendit, Geocode) di service layer; `apps/web` tinggal orchestrate.
   - `packages/ui/*` → primitives (Button, Card, Badge, Input) tetap di-share.
   - `apps/web/lib/ratelimit.ts` → app-local karena tergantung edge env, tapi pluggable (Upstash auto-detect).
5. **Security clean**: Best-practice Supabase (search_path, REVOKE anon, no listing on public bucket) tercapai.

---

## 4. Aman untuk Revert

Semua perubahan SQL idempotent dan punya counterpart file di `supabase/migrations/`. Hapus file + run inverse statement = rollback bersih.

Kode TypeScript: ubah `git revert` aman, tidak ada destructive schema change di TS side.

---

## 5. Belum Selesai (Next)

| Prioritas | Item |
|---|---|
| 🟠 P1 | Build `MapPicker` (Leaflet) + `CheckoutSheet` (4-step orchestrator) di `apps/web/components/checkout/` |
| 🟠 P1 | Refactor `app/checkout/page.tsx` → ganti dropdown alamat lama dengan sheet baru |
| 🟠 P1 | Wire rate-limit ke `/api/checkout` & `/api/shipping/cost` (helper sudah ada) |
| 🟡 P2 | Manual enable "Leaked Password Protection" di Supabase Auth dashboard (advisor tidak flag karena disabled-on-purpose, tetap rekomendasi) |
| 🟡 P2 | Vercel cron config untuk `/api/cron/abandoned-cart`, `/api/cron/expire-pending-orders`, `/api/cron/otp-cleanup` |
| 🟢 P3 | Sentry SDK + Vercel Analytics |
| 🟢 P3 | E2E test Playwright untuk checkout flow |

---

## 6. References

- PRD v2.0: `PRD.md`
- Architecture v2.0: `ARCHITECTURE.md`
- Audit awal: `artifacts/025-2026-05-11-prd-architecture-rewrite-and-supabase-audit.md`
- Supabase project: `xiumxugolyfsvwnwzenp` (binderbanana2)
- Advisor dashboard: https://supabase.com/dashboard/project/xiumxugolyfsvwnwzenp/advisors/security
