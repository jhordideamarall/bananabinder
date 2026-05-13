# 🐾 Bananasbindery: The Professional Bananasbindery Platform

[![Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444.svg)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-000000.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e.svg)](https://supabase.com/)

> **Bananasbindery** is a high-performance, enterprise-grade E-Commerce, Booking, and Delivery ecosystem specifically engineered for the Jakarta market. This is a private, professional project developed by **Jhordi Deamarall**.

---

## 📖 The Story & Vision

Pet shops in a mega-city like Jakarta face unique challenges: overbooking for grooming services, inaccurate shipping costs for frozen products, and fragmented customer data handled manually via WhatsApp.

**Bananasbindery was born to solve this.**

Instead of building a simple website, I architected a **comprehensive platform** that treats e-commerce as the core revenue engine while automating the complexities of service bookings and logistics. The vision is to provide store owners with full visibility into their financial health while giving customers a friction-less, mobile-first experience.

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

## ✨ Core Innovation Modules

### 1. Smart Logistics Engine

Built to handle Jakarta's traffic and product types. It automatically filters courier options based on product type (e.g., Frozen foods are locked to Same-Day delivery within 15km) and integrates directly with **Biteship/RajaOngkir**.

### 2. Slot-Locked Booking System

A real-time grooming and pet hotel booking engine that prevents overbooking at the database level. Integrated with **Midtrans/Xendit** for mandatory DP (Down Payment) collection.

### 3. Loyalty & Pet Profile

A personalized engine that tracks pet health/sizes to recommend products and manage loyalty points that expire dynamically after 12 months.

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
