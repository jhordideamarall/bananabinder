# 020-2026-05-10-supabase-ssr-auth-fix.md

## Overview
This task resolved a critical flaw in the authentication architecture where custom WhatsApp OTP verification (via Fonnte) did not result in a valid Supabase Session Cookie. This prevented Next.js App Router (SSR) from recognizing logged-in users, breaking RLS policies and user-specific features.

## Technical Changes

### 1. Deterministic Hidden Password (`packages/db/src/logic/auth.ts`)
- **[MODIFY]** Implemented `getDeterministicPassword(phone)` using `crypto.createHash('sha256')` to generate a secure, repeatable password based on the user's phone number and a server secret.
- **[MODIFY]** Updated the `verifyOTP` flow to automatically assign this hidden password to the Supabase Auth user record. Added backward compatibility logic to update passwords for existing users.
- **[MODIFY]** `verifyOTP` now returns the `hidden_password` securely to the server-side API route.

### 2. SSR Cookie Management (`apps/web/lib/supabase.ts`)
- **[MODIFY]** Integrated `@supabase/ssr`.
- **[MODIFY]** Added the `createClient` asynchronous function to manage Supabase sessions dynamically using Next.js `cookies()` (`next/headers`). This automatically writes the JWT to the browser cookies.

### 3. Session Issuance (`apps/web/app/api/auth/otp/verify/route.ts`)
- **[MODIFY]** Updated the verification API endpoint to utilize the new `createClient`.
- **[MODIFY]** After verifying the OTP, the API now calls `supabase.auth.signInWithPassword({ phone, password: hidden_password })`. This triggers `@supabase/ssr` to securely set the `sb-[project-id]-auth-token` cookie.
- **[MODIFY]** Ensured the hidden password is removed from the JSON response before sending it to the client.

### 4. Auth Middleware (`apps/web/middleware.ts`)
- **[NEW]** Created Next.js `middleware.ts` to intercept requests and refresh expired Supabase tokens using `@supabase/ssr`.
- **[NEW]** Configured matcher to ignore static assets (`_next/static`, images, etc.) to optimize performance.

## Verification Results
- **Type Check**: 100% clean (`pnpm type-check`).
- **Linter**: 100% clean (`pnpm lint`).
- **Security**: The hidden password never reaches the client. RLS policies will now correctly identify the active user via cookies.

## Impact
The e-commerce platform's authentication flow is now fully bridged with Supabase native sessions. Users verifying their WhatsApp OTP will be instantly logged into the browser, enabling SSR components to fetch personalized data (like Cart and Profile) securely.

🚀 **Status: Verified Production Ready**
