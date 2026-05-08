# Phase 1 — Project Setup

## Objective
Setup Turborepo monorepo dengan semua packages dan konfigurasi dasar.

## Tasks

- [ ] Init Turborepo + pnpm workspace
- [ ] Setup `apps/web` (Next.js 14 App Router)
- [ ] Setup `packages/ui` (Shadcn UI components)
- [ ] Setup `packages/db` (Supabase client + types)
- [ ] Setup `packages/config` (Tailwind config + brand colors)
- [ ] Setup `packages/tsconfig` (shared TS configs)
- [ ] Konfigurasi `turbo.json` pipeline
- [ ] Setup ESLint + Prettier
- [ ] Setup Husky + lint-staged
- [ ] Buat `.env.example`
- [ ] Verify `pnpm dev` dan `pnpm build` jalan tanpa error

## Output
- Monorepo bisa `pnpm dev` dan `pnpm build` clean
- Semua packages bisa di-import dari `apps/web`
