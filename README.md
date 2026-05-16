# 🍌 Bananasbindery: Binder & Photo-Product Commerce Platform

[![Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444.svg)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-000000.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e.svg)](https://supabase.com/)

> **Bananasbindery** is a mobile-first commerce platform for curated binders, photocard organizers, refill paper, custom-name binders, and gift bundles. This is a private, professional project developed by **Jhordi Deamarall**.

---

## 📖 The Story & Vision

Bananasbindery focuses on selling beautiful, practical binder products for photo collections, journaling, stationery organization, gifts, and custom personal keepsakes.

**Bananasbindery was born to make binder shopping feel simple, polished, and trustworthy.**

The platform treats e-commerce as the core engine: product catalog, variants, stock, checkout, shipping, payment, promo, and admin visibility. Deprecated service concepts from the source project are not part of the active customer experience.

---

## 🏗️ Technical Excellence: Monorepo Architecture

To ensure this platform can scale across **Web, Mobile, and Desktop**, I implemented a sophisticated Monorepo architecture using **Turborepo** and **pnpm workspaces**.

### The "Zero-Leakage" Philosophy

Business logic is never duplicated. Calculations for shipping, discounts, and point rewards reside in `@bananasbindery/core`. This means whether a customer buys from the web or a future mobile app, the logic remains identical and bug-free.

### Structural Breakdown

- 🌐 **apps/web**: A high-speed **Next.js 15** storefront with App Router and Server Components.
- ⚙️ **apps/api**: A robust **NestJS** backend server providing high-concurrency for all platforms.
- 📱 **apps/mobile**: A native **React Native (Expo)** experience for mobile-first users.
- 📦 **packages/api-client**: A unified SDK that abstracts all platform interactions.
- 🎨 **packages/ui**: A private design system built on **Tailwind CSS v4** and **shadcn/ui**.
- 🛠️ **packages/store**: Shared global state management using **Zustand**.

---

## ✨ Core Commerce Modules

### 1. Binder Catalog & Variants

Curated binder products with categories such as organizer binder, aesthetic binder, custom-name binder, refill, and bundles. Variants support cover color, paper type, ring size, stock, and price overrides.

### 2. Shipping & Fulfillment

Biteship-powered shipping for binder orders with cached rates, address area resolution, courier/service metadata, and shipment tracking lifecycle.

### 3. Payment & Promo

Xendit invoice checkout, coupons/promos, and server-side pricing safeguards so payment totals are not trusted from the client.

### 4. Owner Intelligence

A dedicated management dashboard that provides deep visibility into **Net Profit, HPP (COGS), and Average Order Value (AOV)**.

---

## 🛠️ Tech Stack & Engineering Standards

- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 + Framer Motion (Micro-animations)
- **Database**: PostgreSQL via **Supabase** (with RLS, Triggers, and Fuzzy Search)
- **Auth**: Phone OTP (WhatsApp-first) + Google OAuth
- **CI/CD**: GitHub Actions, Husky, Commitlint, and automated Vercel deployments.

---

## 💻 Developer Guide

### Prerequisites

- Node.js v20+
- pnpm v10+

### Setup

1. `pnpm install`
2. `cp .env.example .env` (Configure your Supabase & API keys)
3. `pnpm dev` to start the ecosystem.

---

## 📄 Intellectual Property & License

**Proprietary Software License**

Copyright (c) 2026 **Jhordi Deamarall**. All rights reserved.

This software is the exclusive and confidential property of Jhordi Deamarall. Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. For inquiries or permission requests, please contact the author directly.

---

**Crafted with precision and passion by Jhordi Deamarall.**
