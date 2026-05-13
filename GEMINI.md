# Bananasbindery Project Instructions

This file contains foundational mandates for the Bananasbindery project. These instructions take absolute precedence over general workflows.

## 🧠 Behavioral Protocol (LOCKED)

### 1. Insight-First Communication

- **NEVER** modify code silently just to fix linter or build errors.
- If a `push` or `commit` fails, provide a technical **ANALYSIS** first: explain what failed, which file is affected, and your proposed fix.
- **WAIT** for user confirmation before executing any "emergency refactoring" or "simplification".

### 2. Mandatory Context Gathering

- **ALWAYS** read `prd.md` and `ARCHITECTURE.md` at the start of a session to understand the project's goal.
- **ALWAYS** read the `claudeplan/` folder (for the long-term roadmap).
- **ALWAYS** read the `artifacts/` folder (especially `phase-progress.md`, `biteship-pickup-error-analysis.md`, and recent session reports) to understand historical context, audit reports, and past architectural decisions.
- **MANDATORY EXECUTION ARTIFACT (AUDIT TRAIL)**: After completing ANY task that modifies the codebase, you **MUST** create or update a detailed report in the `artifacts/` folder. This is not optional. The report must include:
  - **Context**: Summary of the task and its objective.
  - **File Manifest**: List of every file created or modified.
  - **Surgical Breakdown**: For each file, specify the exact change and the technical/UX rationale (Why it was done).
  - **Validation**: Confirmation of `pnpm type-check` or test results.
- **UI AUDIT LOGGING**: Specifically for mobile optimizations, maintain `artifacts/ui-optimization-log.md` with viewport-specific details.
- Do not blindly assume the project state without reading these files first.
- **JANGAN UBAH DESIGN/UI kalo tidak di minta**

### 3. Preserving UI Mandates

- Certain UI decisions are **LOCKED** and must not be reverted during code restoration or bug fixing:
  - **FOOTER**: Strictly disabled/removed in `ShopLayout` for mobile-first infinite scroll feel.
  - **BOTTOM NAV**: Strictly 4 tabs (Home, Produk, Booking, Akun).
  - **BRANDING**: Search Bar border, Category Tags, Cards (like Grooming/Same Day), and List Separators must consistently use Salmon-Orange (`rgba(224, 123, 57, 0.3)` or `#E07B39` with opacity) for their borders to maintain theme unity.
  - **3D STACK / BANNER CAROUSEL**:
    - The custom piece-wise stacking algorithm must be preserved.
    - **NEVER** use `transformStyle: 'preserve-3d'` on the carousel items (causes Z-fighting/clipping).
    - `zIndex` must be dynamically generated based on distance (e.g., `100 - dist * 10`).
    - The invisible native scroll proxy (`overflowX: scroll`) MUST have `zIndex: 200` to ensure it sits on top of all cards, allowing touch-drag and click passthrough.
    - Must remain solid (`opacity: 1`) for the active card, dynamically fading the background cards.
- Always cross-reference `artifacts/session-progress-report.md` before performing a large file restoration.

### 4. Surgical Integrity & Type Safety (STRICT)

- **NO SILENT SIMPLIFICATION**: Do not delete imports or variables just to pass linting without informing the user.
- **ZERO ANY POLICY**: Use of `any` is strictly **FORBIDDEN**. 
  - Always define proper interfaces or types.
  - If a type is truly unknown, use `unknown` and perform type checking.
  - If a 3rd party library requires a hack, use `as unknown as YourType` with a specific `eslint-disable-next-line` and a comment explaining WHY.
- If a variable is blocking the build, report it as an insight. Ask if the variable should be implemented properly or removed.
- Use explicit type casting (e.g., `as CSSProperties`) only when necessary and ensure the type is imported.

### 5. Mandatory Pre-Validation

- Before stating a task is "DONE" or "KELAR", you **MUST** run the project's validation commands (e.g., `pnpm type-check` or `npm run lint`) to confirm no new errors were introduced.

### 6. Design Source of Truth vs. Wireframes

- **`user-flow.html` is ONLY for logic & flow**: It defines _what_ pages must exist, _what_ elements must be present, and _how_ users navigate. It is essentially a wireframe.
- **DO NOT** use `user-flow.html` as a visual or CSS reference.
- **The True Design System** lives in the existing code (e.g., `app/(shop)/page.tsx`, `header.tsx`). When building the remaining pages based on `user-flow.html`, you **MUST** recycle the existing aesthetic:
  - Keep the Salmon-Orange (`#E07B39`) branding.
  - Keep the rounded radiuses, specific drop shadows, and Framer Motion spring configs.
  - **NEVER** overwrite existing polished components just to match the raw/placeholder styling seen in `user-flow.html`.

### 7. Git Hook & Stash Recovery Protocol

- The project uses strict `husky` and `lint-staged` pre-commit hooks.
- **IF A COMMIT FAILS** (e.g. `pnpm type-check` or `eslint` exits with code 1) AND the working files suddenly "revert" to an older state, **DO NOT PANIC and DO NOT REWRITE THE CODE**.
- This happens because `lint-staged` stashed your unstaged changes before crashing.
- **RECOVERY PROCEDURE**:
  1. Run `git stash list` to confirm the backup exists.
  2. Run `git checkout stash@{0} -- <affected-files>` (or `git stash apply`) to immediately restore your brilliant code.
  3. Manually fix the specific linter/TypeScript errors that caused the hook to fail.
  4. Run `pnpm type-check` and `npx eslint <file>` manually to verify.
  5. Attempt the `git push` again.

## 🏗️ Technical Architecture

- Monorepo: Turborepo + pnpm.
- Frontend: Next.js 15 (App Router).
- Styling: Tailwind CSS v4 + Framer Motion.
- State: Zustand with local persistence for Cart.

## 🛡️ Monorepo Integrity Mandates (STRICT)

### 1. Zero-Leakage Policy
- **CORE LOGIC**: Kalkulasi (Ongkir, Diskon, Poin), Validasi Bisnis, dan Algoritma **DILARANG** berada di `apps/`. Wajib ditaruh di `packages/core`.
- **API CLIENTS**: Semua panggil Supabase RPC atau 3rd Party API (Midtrans, Biteship) wajib dibungkus dalam `@bananasbindery/api-client`. Jangan panggil langsung di dalam Page/Component.
- **UI PRIMITIVES**: Komponen murni UI (Button, Card, Badge, PriceTag) wajib berada di `packages/ui`. `apps/web` hanya berisi komponen koordinasi (Layout, Page-Specific Blocks).

### 2. Service Portability
- **RULE**: Jangan mengimpor `createClient` dari `@/lib/supabase/server` atau `client` langsung ke dalam logic yang bersifat reusable. 
- **ACTION**: Logic harus menerima `supabaseClient` sebagai parameter atau menggunakan abstraksi dari `@bananasbindery/api-client`. Ini agar Mobile (React Native) bisa memakai logic yang sama.

### 3. State Management reusability
- **RULE**: Shared state (Cart, User, Settings) wajib berada di `packages/store`.
- **RATIONALE**: Agar keranjang belanja dan preferensi user sinkron antara aplikasi Web dan Mobile.

## 🚀 CI/CD & Build Safety Mandates (NEW)

### 1. Build-Safe Environment Variables

- **RULE**: Never use non-null assertions (`!`) on `process.env` during library initialization (e.g., Supabase client).
- **RATIONALE**: Next.js performs static optimization during build where env vars are often missing, causing crashes.
- **ACTION**: Use defensive checks and return dummy/proxy objects if keys are missing to allow the build to complete.

### 2. Typed Routes & Navigation

- **RULE**: Use `as Route` for dynamic paths in `router.push()` or `Link`. Avoid `as any`.
- **RATIONALE**: The project enforces `typedRoutes: true`. Proper casting ensures type safety without breaking linting.

### 3. Linter & Type Integrity

- **RULE**: Use `import type` for dependencies used strictly as types (e.g., `import type { Transition } from 'framer-motion'`).
- **RULE (ZERO ANY)**: The `any` type is strictly **PROHIBITED**. Every variable, parameter, and return value MUST have a concrete type or interface. Using `any` will cause build failures and is considered a violation of the project's core architecture.
- **RULE**: Minimize the use of `unknown`. If you must use it, ensure proper type guards are implemented.

### 4. Mandatory Local Build Check

- **ACTION**: For structural or database-related changes, run `pnpm build` locally before pushing to confirm that static generation (prerendering) passes.
