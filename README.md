<p align="center">
  <img src="https://img.shields.io/badge/🍌-Bananasbindery-F9E79F?style=for-the-badge&labelColor=7EC8E3" alt="Bananasbindery" />
</p>

<h1 align="center">Bananasbindery</h1>
<p align="center"><strong>Production-Grade Binder Stationery E-Commerce Platform</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Utility--First-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Xendit-Payment_Gateway-003CFF?style=flat-square" />
</p>

<p align="center">
  <em>End-to-end e-commerce platform built with serverless architecture, automated payments,<br/>intelligent marketing engine, and AI-optimized content strategy.</em>
</p>

---

## About

**Bananasbindery** is a full-stack e-commerce platform designed for selling premium binder notebooks and stationery products in Indonesia. Built from scratch with production-level architecture — covering everything from atomic database transactions to webhook-driven payment automation.

This project demonstrates real-world engineering decisions: monorepo code sharing, Row Level Security, race-condition-safe stock management, and a complete order lifecycle including cancellation and refund flows.

> Engineered by **[Jhordi Deamarall](https://github.com/jhordideamarall)**

---

## Architecture

```
Turborepo Monorepo
├── apps/web              → Next.js 14 (App Router, SSR/SSG)
├── packages/ui           → Design system (Shadcn UI + CVA)
├── packages/db           → Supabase client, typed queries, RPC wrappers
├── packages/config       → Shared Tailwind config, brand tokens
├── packages/tsconfig     → Shared TypeScript strict configs
└── supabase/migrations   → Versioned database schema (11 tables, 3 RPCs)
```

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Turborepo monorepo | Shared logic between web & future mobile app. Cached builds. |
| Supabase (PostgreSQL) | RLS for multi-tenant security. Realtime subscriptions. Edge functions. |
| Atomic stock reduction via RPC | Prevents overselling under concurrent checkout load. |
| Price locking at checkout | Server-side snapshot eliminates client-side price manipulation. |
| WhatsApp OTP (no password) | Frictionless auth for Indonesian market. Higher conversion. |
| Webhook-driven payment | Xendit callback → verify signature → update order → reduce stock. Zero polling. |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Next.js 14 (App Router) | SSR, API routes, ISR |
| Language | TypeScript (strict, zero-any) | Type safety across monorepo |
| Styling | Tailwind CSS + Shadcn UI | Utility-first, accessible components |
| Database | Supabase PostgreSQL | RLS, RPC functions, realtime |
| Auth | Supabase Auth + WhatsApp OTP | Passwordless via Fonnte |
| Payment | Xendit | VA, QRIS, E-Wallet, Credit Card |
| Shipping | RajaOngkir Pro | Kecamatan-level rate calculation |
| Email | Resend | Transactional & marketing emails |
| Storage | Supabase Storage | Product images (CDN-backed) |
| Monorepo | Turborepo + pnpm | Parallel builds, dependency caching |
| Hosting | Vercel | Edge network, serverless functions |

---

## Features

### Customer-Facing
- **Passwordless Auth** — WhatsApp OTP login (SHA-256 hashed, 5min expiry, rate limited)
- **Persistent Cart** — Database-backed, survives browser close, multi-device sync
- **Smart Checkout** — Coupon validation, real-time shipping calculation, price locking
- **Multi-Payment** — Virtual Account, QRIS, E-Wallet, Credit Card (auto-confirmed via webhook)
- **Order Lifecycle** — Real-time tracking with cancellation & refund support (24h window)
- **Flash Sales** — Countdown timer, allocated stock, promo pricing

### Admin Panel
- **Analytics Dashboard** — Revenue, conversion rate, top products, low-stock alerts
- **Product Management** — Multi-variant (ring size, cover color, paper type), multi-image
- **Flexible Coupons** — Percentage, fixed amount, or free shipping (owner-subsidized)
- **Order Fulfillment** — Process → ship → track. Bulk label printing, resi input
- **Abandoned Cart Recovery** — Auto-detect idle carts, trigger WA/email reminders
- **Customer CRM** — Purchase history, lifetime value

---

## Security

| Measure | Implementation |
|---------|---------------|
| Row Level Security | All user-facing tables. Users access own data only. |
| Atomic Transactions | Stock reduction via PostgreSQL RPC — no race conditions |
| Price Integrity | Server-side validation & snapshot at checkout |
| Webhook Verification | Xendit `x-callback-token` validation |
| OTP Security | SHA-256 hash, 5min TTL, max 3 attempts, rate limiting |
| Input Validation | Zod schemas on every API route |
| Zero `any` Policy | Strict TypeScript — no implicit or explicit `any` |

---

## AI Visibility & Discovery Strategy

This project implements a comprehensive **AI Search Optimization** strategy designed to make the brand discoverable by modern AI systems:

| Platform | Strategy |
|----------|----------|
| ChatGPT, Claude, Gemini, Perplexity | Structured content, clear brand entity, product-use pairing |
| Google AI Overview | JSON-LD structured data (Product, Store, FAQ, BreadcrumbList) |
| Google Search | Semantic URLs, unique metadata per page, sitemap, canonical URLs |
| TikTok & Instagram Search | Hashtag strategy, use-case content, social proof |

The content architecture ensures AI systems can understand:
- **What** Bananasbindery is (binder stationery brand)
- **Who** it serves (students, professionals, journaling enthusiasts)
- **Why** it's relevant (premium quality, aesthetic design, nationwide shipping)

Full strategy documented in [`AI-visibilites.md`](./AI-visibilites.md).

---

## Getting Started

```bash
git clone https://github.com/jhordideamarall/bananabinder.git
cd bananabinder

pnpm install
cp .env.example .env.local

# Development
pnpm dev

# Production build
pnpm build
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`PRD.md`](./PRD.md) | Product Requirements — features, user flows, business rules |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System design — schema, API routes, security model |
| [`AI-visibilites.md`](./AI-visibilites.md) | AI discovery & SEO strategy for modern search |
| [`plan/`](./plan/) | Implementation roadmap (9 phases) |
| [`artifacts/`](./artifacts/) | Development changelog & decision log |

---

## Project Status

| Phase | Status |
|-------|--------|
| 1. Project Setup (Turborepo) | ✅ Complete |
| 2. Database & Auth | 🔲 Schema ready, pending Supabase project |
| 3. Storefront UI | 🔲 Pending |
| 4. Cart & Checkout | 🔲 Pending |
| 5. Marketing Engine | 🔲 Pending |
| 6. Admin Dashboard | 🔲 Pending |
| 7. SEO & AI Visibility | 🔲 Pending |
| 8. Testing & QA | 🔲 Pending |
| 9. Production Deploy | 🔲 Pending |

---

## License

MIT License © 2026 [Jhordi Deamarall](https://github.com/jhordideamarall)

See [`LICENSE`](./LICENSE) for full text.

---

<p align="center">
  <sub>Engineered with precision by <strong><a href="https://github.com/jhordideamarall">Jhordi Deamarall</a></strong></sub>
</p>
