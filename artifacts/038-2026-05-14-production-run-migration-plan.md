# 038 — Production Run & Migration Planning

Tanggal: 2026-05-14
Status: Completed
Scope: membuat planning eksekusi agar project Bananasbindery Binder bisa dijalankan stabil dari local sampai production.

## Apa yang dibuat

File:

- `claudeplan/06-production-run-migration-plan.md`

Isi plan:

1. Freeze current recovery state dan commit baseline.
2. Environment & secret hygiene.
3. Supabase migration decision.
4. Regenerate Supabase generated types.
5. Seed/catalog runnable state.
6. Local run smoke test.
7. Checkout + Xendit + Biteship E2E.
8. Admin E2E.
9. SEO/AI visibility finalization.
10. Production deploy readiness.
11. Final artifact & handoff.

## Rationale teknis

Project sudah pass type-check/lint/build, tapi belum bisa disebut production-ready sampai:

- working tree recovery di-freeze/commit agar tidak ke-revert,
- env example dibersihkan dari value real-looking/legacy,
- Supabase live schema dan generated types disinkronkan,
- checkout/payment/shipping/admin diuji end-to-end di environment nyata,
- deploy preview/production diverifikasi.

## Keputusan penting dalam plan

- Destructive DB cleanup tidak dilakukan langsung. Harus ada explicit migration dan approval Je.
- Path recommended: jangan drop historical DB object dulu jika active app sudah tidak memakai legacy; regenerate types setelah Supabase CLI privilege/Docker issue selesai.
- Jika cleanup DB ketat diperlukan, buat migration baru dengan `DROP ... IF EXISTS` hanya untuk object yang terkonfirmasi legacy.
- `.env.example` harus memakai placeholder aman, bukan token/key asli atau real-looking.

## Validasi

Tidak ada perubahan runtime/code dalam artifact ini selain dokumen planning.
Plan disimpan di:

- `/Users/jhordideamarall/Projects/bananabinder/claudeplan/06-production-run-migration-plan.md`

## Next action recommended

Jalankan Phase 0 + Phase 1:

1. Review working tree dan commit recovery baseline.
2. Bersihkan `.env.example` dan pastikan local env bisa menjalankan `pnpm dev`.
3. Setelah itu baru lanjut Supabase type regeneration/migration decision.
