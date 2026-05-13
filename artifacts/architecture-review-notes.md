# Architectural Review & Mitigations

**Date:** Saturday, May 2, 2026
**Reviewer:** Gemini CLI
**Context:** Review of `prd.md` and `ARCHITECTURE.md` during Phase 0 completion.

Overall, the monorepo architecture (Turborepo + Next.js + NestJS + React Native) combined with the phased migration strategy (Supabase BaaS -> Hybrid API) is highly robust, scalable, and demonstrates a Senior-level system design. There are no fatal flaws in the current design.

However, as the platform transitions to the Hybrid API phase (Phase 5+) and eventually Mobile (Phase 6+), there are three key architectural challenges ("Gotchas") that must be carefully managed:

## 1. Data Synchronization (Supabase Direct Read vs NestJS Write)

**The Strategy:** Web applications read data directly from Supabase (via Server Components/RSC) for performance and SEO, while critical write mutations (e.g., checkout, stock decrement, booking) go through the NestJS API.

**The Challenge:**
Next.js App Router relies on aggressive caching mechanisms (Data Cache, Full Route Cache). When a user performs a write operation via NestJS (e.g., placing an order), the underlying Postgres database updates, but the Next.js frontend cache remains completely unaware of this change. This can lead to displaying stale data (e.g., showing a product as "In Stock" right after the user just bought the last item).

**Mitigation Plan:**
- **Webhook Invalidation:** Implement a Webhook in the Next.js app (e.g., `/api/revalidate`). Whenever NestJS successfully performs a mutation that affects frontend state, it must securely call this webhook to trigger `revalidateTag()` or `revalidatePath()`.
- **Client-Side Realtime (Optional):** Use Supabase Realtime subscriptions on the client-side for highly critical data (like booking slots or flash-sale stock) to immediately reflect changes on the UI.

## 2. Authorization Dualism (Supabase RLS vs NestJS Guards)

**The Strategy:** Row Level Security (RLS) protects data at the database level for direct client reads, while NestJS handles complex business logic writes.

**The Challenge:**
When the Next.js web client reads data directly, it passes the user's JWT, and Supabase RLS enforces "who can see what" (e.g., `auth.uid() = user_id`).
However, when NestJS interacts with the database to process complex transactions (like locking stock), it typically uses the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS and perform admin-level operations.
Because NestJS bypasses RLS, the security burden shifts entirely to NestJS. We risk having "split-brain" authorization where read rules are defined in SQL, but write rules are defined in TypeScript.

**Mitigation Plan:**
- **Strict NestJS Guards:** Ensure that all NestJS endpoints strictly validate the incoming JWT (via Passport/Guards) and manually verify ownership before performing mutations (e.g., verifying that the `orderId` being processed actually belongs to the `userId` in the JWT).
- **Service Role Scoping:** Only use the Service Role Key when absolutely necessary. If NestJS is just proxying a user action, consider instantiating a Supabase client inside NestJS using the user's JWT so RLS still applies, only falling back to the Service Key for elevated transactions.

## 3. Universal Execution of `@bananasbindery/core` (Node.js vs React Native)

**The Strategy:** Share business logic (`@bananasbindery/core`) and utilities (`@bananasbindery/utils`) across Web (Next.js/Node), API (NestJS/Node), and Mobile (React Native/Hermes).

**The Challenge:**
React Native does not run in a Node.js environment; it runs on JS engines like Hermes or JSC. It lacks built-in access to Node.js core modules (`fs`, `crypto`, `path`, `stream`, etc.) and Node-specific global variables.

**Mitigation Plan:**
- **Pure JavaScript/TypeScript:** Strictly enforce that `@bananasbindery/core`, `@bananasbindery/utils`, and `@bananasbindery/types` remain **100% Pure JS/TS**.
- **No Node Dependencies:** Never install dependencies in these shared packages that rely on Node.js APIs (e.g., `bcrypt`, native `crypto`, `fs-extra`). If cryptography or file manipulation is needed, abstract it behind interfaces that the specific platform (Next.js or React Native) must implement and inject.
- **Linting Rules:** Configure ESLint in the `core` and `utils` packages to error if Node.js built-in modules are imported.
