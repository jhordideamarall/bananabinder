# CLAUDE.md

## Purpose

Work efficiently, safely, and without breaking existing behavior.

---

## Core Principles

- Understand before acting
- Prefer small, incremental changes
- Reuse existing logic, avoid rewriting
- Keep solutions simple and readable
- Jangan buat design UI AI slop, selalu buat design profesional
- Audit codebase cukup sekali per sesi, simpan ke memory biar efisien

---

## Safety

- Do not change existing behavior unless explicitly asked
- Be careful with important logic (pricing, stock, transactions, OTP)
- If unsure, explain first before making changes
- **ZERO ANY POLICY**: Use of `any` is strictly **PROHIBITED**. Always use specific types or interfaces.

---

## Workflow

- **MANDATORY CONTEXT GATHERING**: ALWAYS read `PRD.md`, `ARCHITECTURE.md`, `AI-visibilites.md`, the `plan/` folder (roadmap & phase progress), and the `artifacts/` folder (work history) at the start of every session.
- **MANDATORY EXECUTION ARTIFACT**: Setiap tugas yang selesai WAJIB diikuti dengan update detail di folder `artifacts/` yang mendokumentasikan: **Apa** yang diubah, **Di mana** (path file), dan **Mengapa** (rasionale teknis). Dilarang keras modifikasi kode tanpa catatan audit.
- **ARTIFACT NAMING**: File artifact harus berurutan dengan format `NNN-YYYY-MM-DD-deskripsi.md` (contoh: `001-2026-05-08-project-documentation-setup.md`). Nomor urut increment setiap task baru. Ini memastikan riwayat mudah dibaca dan dibedakan secara kronologis.
- **PLAN TRACKING**: Setelah task selesai, update checklist di `plan/phase-X-*.md` yang relevan.
- For large tasks → propose a plan first
- For small tasks → act directly but keep changes minimal
- Avoid modifying many files at once
- **JANGAN UBAH DESIGN/UI kalau tidak diminta**
- **SETIAP KODE YANG DIUBAH HARUS DICATAT BIAR BISA REVERT DENGAN MUDAH**
- Selalu update persistent memory untuk plan dan pekerjaan yang disetujui

---

## Production Awareness

- Assume this code can affect production
- Avoid risky structural changes without explanation

---

## Communication

- Be concise and clear
- Focus on actionable output
- Avoid unnecessary long explanations
- Jangan sepak pesan yang tidak penting

---

## Default Mode

- Practical
- Incremental
- Production-aware

---

## 🛡️ Monorepo Integrity Mandates (STRICT)

### 1. Zero-Leakage Policy
- **CORE LOGIC**: Kalkulasi (ongkir, diskon, kupon, stock), validasi bisnis, dan algoritma **DILARANG** berada di `apps/`. Wajib ditaruh di `packages/db` atau dedicated package.
- **API CLIENTS**: Semua panggilan Supabase RPC atau 3rd Party API (Xendit, RajaOngkir, Fonnte) wajib dibungkus dalam package terpisah. Jangan panggil langsung di Page/Component.
- **UI PRIMITIVES**: Komponen murni UI (Button, Card, Badge, PriceTag) wajib berada di `packages/ui`. `apps/web` hanya berisi komponen koordinasi (Layout, Page-Specific Blocks).

### 2. Service Portability
- **RULE**: Jangan mengimpor `createClient` langsung ke dalam logic yang bersifat reusable.
- **ACTION**: Logic harus menerima `supabaseClient` sebagai parameter atau menggunakan abstraksi dari package. Ini agar future mobile app bisa pakai logic yang sama.

### 3. Package Boundaries
```
packages/
├── ui/          → Pure UI components (Shadcn-based)
├── db/          → Supabase client, types, queries, RPC wrappers
├── config/      → Tailwind config, constants, brand colors
└── tsconfig/    → Shared TypeScript configs
```

---

## UI & Design Standards

- **Brand Colors**: Biru lembut (`#7EC8E3`), Pink (`#F2A7C3`), Kuning lembut (`#F9E79F`)
- **Font**: Inter (heading bold, body regular)
- **Component Library**: Shadcn UI + custom theming
- **Mobile First**: Semua halaman harus responsive
- **Design System** lives in the existing codebase. When building new pages, recycle the existing aesthetic.

---

## Git Hook & Stash Recovery Protocol

- Project uses `husky` + `lint-staged` pre-commit hooks.
- **IF A COMMIT FAILS** and files revert to older state:
  1. `git stash list` — confirm backup exists
  2. `git checkout stash@{0} -- <affected-files>` — restore code
  3. Fix linter/TypeScript errors manually
  4. `pnpm type-check` dan `pnpm lint` — verify
  5. Attempt commit again

---

## Project-Specific Rules

- **Harga dalam integer** (Rupiah tanpa desimal). Jangan pakai float.
- **Stock reduction** harus atomic (database RPC). Jangan kurangi stok di application layer.
- **OTP** harus di-hash sebelum disimpan. Jangan simpan plaintext.
- **Webhook Xendit** harus diverifikasi signature-nya sebelum proses.
- **RLS** wajib aktif di semua tabel user-facing.
