# Session: Phase 4 Kickoff (Front-End First)

**Date**: 2026-05-03  
**Focus**: Slicing UI, User Flow, & Local Logic for Core E-Commerce Pages  
**Strategy**: Front-End First (No Backend Integration until UI is 100% polished)

## 📌 Context

We have successfully completed Phase 0, Phase 1 (Database Foundation), and Phase 2 (Design System & App Shell).
Instead of moving to Auth (Phase 3) or directly integrating Supabase into the E-Commerce pages (Phase 4), we have agreed on a **Front-End First** approach.

We will focus entirely on building the UI, ensuring smooth navigation, and implementing local state (Zustand) for the remaining pages to make them feel alive and premium before any backend wiring occurs.

## 🎯 Objectives

1. **Product Detail Page (`/products/[slug]`)**:
   - Image gallery
   - Variant selector (Size/Weight)
   - Quantity stepper
   - Add to Cart button (with spring bounce animation)
2. **Cart Page (`/cart`)**:
   - Item list with quantity steppers
   - Subtotal calculation
   - Checkout CTA
3. **Product Listing / Search (`/products` & `/search`)**:
   - Grid layout recycling `ProductGrid`
   - Category filters
4. **Checkout & Booking (Upcoming)**:
   - Slice remaining UI for checkout flows and booking forms.

## 🛡️ Strict Mandates

- **Source of Truth**: The existing codebase (`app/(shop)/page.tsx` & `header.tsx`) is the true design system.
- **Wireframes**: `user-flow.html` is ONLY for logic & flow. DO NOT copy its CSS.
- **Branding**: Preserve the Salmon-Orange (`rgba(224, 123, 57, 0.3)`) borders and Framer Motion spring configs.

---

_Ready to begin slicing the Product Detail or Cart page based on `user-flow.html`!_
