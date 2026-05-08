<p align="center">
  <img src="https://img.shields.io/badge/🍌-Bananasbindery-F9E79F?style=for-the-badge&labelColor=7EC8E3" alt="Bananasbindery" />
</p>

<h1 align="center">Bananasbindery</h1>
<p align="center"><strong>✨ Binder Stationery E-Commerce Platform ✨</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Xendit-Payment-003CFF?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript" />
</p>

<p align="center">
  <em>Platform e-commerce modern untuk brand binder stationery Indonesia.<br/>Built with performance, scalability, and beautiful UX in mind.</em>
</p>

---

## 🎯 Overview

**Bananasbindery** adalah full-stack e-commerce platform yang dibangun untuk menjual buku binder premium dan perlengkapan stationery. Didesain dengan arsitektur serverless yang scalable, payment automation, dan smart marketing engine.

> 🧑‍💻 Dibangun oleh **Jhordi Deamarall** sebagai production-grade portfolio project.

---

## 🌈 Brand Colors

<p>
  <img src="https://img.shields.io/badge/●-7EC8E3?style=for-the-badge&label=Blue%20Soft" />
  <img src="https://img.shields.io/badge/●-F2A7C3?style=for-the-badge&label=Pink" />
  <img src="https://img.shields.io/badge/●-F9E79F?style=for-the-badge&label=Yellow%20Soft" />
</p>

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| 🏗️ Monorepo | Turborepo + pnpm |
| 🖥️ Frontend | Next.js 14 (App Router) |
| 🎨 Styling | Tailwind CSS + Shadcn UI |
| 🗄️ Database | Supabase (PostgreSQL + RLS) |
| 🔐 Auth | WhatsApp OTP (Fonnte) |
| 💳 Payment | Xendit (VA, QRIS, E-Wallet) |
| 🚚 Shipping | RajaOngkir Pro |
| 📧 Email | Resend |
| 🖼️ Storage | Supabase Storage |
| 🚀 Hosting | Vercel |

---

## 🧩 Features

### 🛒 Customer
- **WhatsApp OTP Login** — No password, frictionless auth
- **Persistent Smart Cart** — Cart survives browser close
- **Multi-Courier Shipping** — JNE, SiCepat, AnterAja (kecamatan-level)
- **Auto Payment** — VA, QRIS, E-Wallet, Credit Card via Xendit
- **Real-time Order Tracking** — Live status updates
- **Flash Sale & Coupons** — Countdown timer + discount codes

### 🛠️ Admin
- **Analytics Dashboard** — Sales, conversion, low-stock alerts
- **Product Management** — Multi-variant (ring size, cover color, paper type)
- **Marketing Engine** — Coupons, Flash Sales, Abandoned Cart Recovery
- **Order Fulfillment** — Process, print label, input tracking number
- **Simple CRM** — Customer purchase history

---

## 🏛️ Architecture

```
bananasbindery/
├── apps/
│   └── web/                    # Next.js 14 App
│       ├── app/
│       │   ├── (storefront)/   # Public pages
│       │   ├── (auth)/         # WhatsApp OTP login
│       │   └── admin/          # Admin dashboard
│       └── ...
├── packages/
│   ├── ui/                     # Shared components
│   ├── db/                     # Supabase client & types
│   ├── config/                 # Shared Tailwind & constants
│   └── tsconfig/               # Shared TS configs
├── supabase/migrations/        # Database migrations
└── turbo.json                  # Pipeline config
```

---

## 🔒 Security

- **Row Level Security (RLS)** — Users can only access their own data
- **Atomic Stock Reduction** — Database RPC prevents race conditions
- **Price Locking** — Server-side validation, no client manipulation
- **Webhook Verification** — Xendit callback token validation
- **OTP Hashing** — SHA-256 + 5min expiry + rate limiting
- **Input Validation** — Zod schemas on all API routes

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/jhordideamarall/bananasbindery.git
cd bananasbindery

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Run development
pnpm dev
```

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Product Requirements Document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System Architecture & Database Schema |
| [AI-visibilites.md](./AI-visibilites.md) | AI Visibility & SEO Strategy |

---

## 📸 Screenshots

> 🚧 Coming soon — UI sedang dalam pengembangan.

---

## 📜 License

```
MIT License

Copyright (c) 2026 Jhordi Deamarall

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  <strong>Built with 💛 by <a href="https://github.com/jhordideamarall">Jhordi Deamarall</a></strong>
</p>
