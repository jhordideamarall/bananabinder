# 🐾 Bananasbindery E-Commerce Platform

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444.svg)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e.svg)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e.svg)](https://supabase.com/)

> **A professional-grade E-Commerce, Booking, and Delivery Platform** specifically designed for pet shops in Jakarta. Built with a modern monorepo architecture for maximum scalability and code reusability across Web, Mobile, and Desktop.

🌍 **Live Demo:** [pawvels-web.vercel.app](https://pawvels.vercel.app) _(Coming Soon)_

---

## 🚀 Overview

Bananasbindery Platform is an integrated solution that automates core business operations:

- **E-Commerce**: Real-time inventory, variants, and seamless checkout.
- **Service Booking**: Automated slots for Grooming and Pet Hotel with DP payments.
- **Logistics**: Automated shipping costs (RajaOngkir) and same-day delivery rules.
- **Loyalty**: Points-based reward system to increase customer retention.

---

## 🏗️ Architecture (Monorepo)

This project utilizes a **Turborepo** monorepo structure to share 90% of business logic across all platforms.

### Apps

- 🌐 **Web**: Customer-facing store built with **Next.js (App Router)**.
- 🛠️ **Admin**: Internal management dashboard for orders and inventory.
- 📱 **Mobile**: **React Native (Expo)** app sharing the same core hooks and state.
- ⚙️ **API**: High-performance **NestJS** standalone server.

### Shared Packages

- `@bananasbindery/core`: Centralized business logic (pricing, shipping rules).
- `@bananasbindery/types`: Single source of truth for TypeScript definitions.
- `@bananasbindery/ui`: Shared UI components using shadcn/ui and Tailwind v4.
- `@bananasbindery/utils`: Pure utility functions for formatting and calculations.

> Detailed architectural diagrams and design decisions can be found in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## ✨ Key Features

- **Auth**: Secure Phone OTP (WhatsApp) and Google OAuth via Supabase.
- **Payments**: Integrated with Midtrans/Xendit (QRIS, VA, E-Wallet).
- **Pet Profile**: Management for multiple pets to personalize booking and recommendations.
- **Smart Shipping**: Automatic filtering for frozen products (same-day only) and distance-based calculations.
- **Owner Dashboard**: Real-time financial metrics (Net Profit, AOV, LTV).

---

## 🛠️ Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS v4, shadcn/ui, Framer Motion.
- **Backend**: NestJS, TypeScript, PostgreSQL.
- **Infrastructure**: Supabase (Auth, DB, Storage, Edge Functions), Vercel.
- **Tooling**: pnpm v10, Turborepo, Husky, Commitlint, GitHub Actions.

---

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jhordideamarall/petshop.git
   cd petshop
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Setup Environment Variables:

   ```bash
   cp .env.example .env
   # Fill in the required variables inside .env
   ```

4. Start the development server:
   ```bash
   pnpm run dev
   ```

---

## 📂 Project Structure

```bash
petshop/
├── apps/
│   ├── web/        # Next.js Web Storefront
│   ├── admin/      # Next.js Admin Dashboard (Planned)
│   ├── api/        # NestJS Backend API (Planned)
│   └── mobile/     # React Native Expo App (Planned)
├── packages/
│   ├── api-client/ # Shared API Client SDK (Planned)
│   ├── config/     # Centralized ESLint/Env configurations
│   ├── core/       # Business Logic & Services
│   ├── hooks/      # Shared React Hooks (Planned)
│   ├── tsconfig/   # Base TypeScript configs
│   ├── types/      # Shared Domain Types
│   ├── ui/         # Shared shadcn/ui components
│   └── utils/      # Shared utility functions
└── supabase/       # SQL Migrations & Seed (Planned)
```

---

## 📝 Product Roadmap

See the full [Product Requirements Document (PRD)](./prd.md) for detailed modules, user flows, and database schema.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

**Developed with ❤️ by Jhordi for my client as a Dedicated Project.**
