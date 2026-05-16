# Artifacts — Bananasbindery Binder Work History

Folder ini sekarang hanya menyimpan artifact yang relevan dengan scope aktif project:

- Binder/photo-product e-commerce
- Catalog, variants, stock, cart, checkout
- Xendit payment lifecycle
- Biteship shipping lifecycle
- Admin products/orders/promos
- Supabase/order hardening

## Current active artifacts

| Artifact                                                         | Fokus                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `032-2026-05-14-binder-alignment-and-pricing-core.md`            | Pivot binder + pricing core                                                    |
| `033-2026-05-14-supabase-binder-mcp-and-order-rpc-hardening.md`  | Supabase Binder MCP + order RPC hardening                                      |
| `034-2026-05-14-admin-dashboard-products-promos.md`              | Admin dashboard/orders/products/promos                                         |
| `035-2026-05-14-xendit-biteship-readiness-and-live-migration.md` | Xendit/Biteship readiness + live schema migration                              |
| `036-2026-05-14-binder-codebase-continuation.md`                 | Legacy isolation + codebase continuation                                       |
| `037-2026-05-14-artifact-docs-cleanup.md`                        | Artifact/docs cleanup + Binder scope alignment                                 |
| `038-2026-05-14-production-run-migration-plan.md`                | Production run + migration planning                                            |
| `040-2026-05-14-admin-categories-fonnte-guard.md`                | Admin kategori + Fonnte WA client + role guard                                 |
| `041-2026-05-14-home-revamp-nav-color-image-upload.md`           | Fonnte env fix + nav color + home revamp + admin image upload                  |
| `042-2026-05-14-home-order-photos-admin-login.md`                | Key fix + urutan home + foto binder asli + admin email/password login          |
| `043-2026-05-14-banner-fullwidth-editable-labels-auth-fix.md`    | Banner full-width + label section editable + fix login admin 500 + regen types |
| `044-2026-05-14-session-summary-admin-home-fonnte.md`            | Ringkasan konsolidasi sesi (admin, home, Fonnte, auth)                         |
| `2026-05-14-admin-recovery-build-fix.md`                         | Admin recovery/build fix                                                       |

## Rules

Setiap perubahan kode harus ditulis di artifact baru dengan:

- Apa yang diubah
- File path
- Alasan teknis
- Validasi yang dijalankan
- Catatan revert

Artifact lama dari era Pawvels/petshop sudah dibersihkan agar tidak menyesatkan sesi berikutnya.
