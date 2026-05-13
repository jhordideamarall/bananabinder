# Audit Report: Fonnte WhatsApp OTP Integration

## Context

Replaced all hardcoded dummy/demo bypass logic with a real WhatsApp OTP system using Fonnte and Supabase Edge Functions. This ensures 100% accurate flow testing, real account creation, and auto-login after verification.
Post-integration, fixed subsequent Database issues related to trigger failures (`handle_new_user`) and RLS constraints (`addresses` table) that blocked the Guest checkout flow.

## File Manifest

- `supabase/functions/fonnte-otp/index.ts`: New Edge Function to send OTP via Fonnte.
- `apps/web/components/checkout/address-sheet.tsx`: Removed dummy bypass logic.
- `apps/web/app/(auth)/login/page.tsx`: Removed dummy bypass logic.

## Surgical Breakdown

### `fonnte-otp` Edge Function

- **WhatsApp Channel**: Configured to intercept Supabase Auth OTPs and forward them to Fonnte API (`api.fonnte.com/send`).
- **Secure Token**: Token stored in Supabase Secrets as `FONNTE_TOKEN`.
- **Formatted Message**: Custom branding for Bananasbindery, including dynamic user name extraction.

### Code Cleanup (Strict No-Hardcode)

- **Frontend Restoration**: Reverted `AddressSheet` and `LoginPage` to their pure Supabase Auth implementations.
- **Removal of Mock Logic**: Deleted all checks for `08123456789` and `123456`. The app no longer "cheats" the login process.

### Database Bug Fixes

- **Trigger `handle_new_user`**: Fixed an error (`SQLSTATE 42704`) where the `user_role` type was not found. Added explicit `public.` namespacing to `user_role` type casting. The trigger now also properly captures `NEW.phone`.
- **RLS on `addresses`**: Addressed `403 Permission Denied` (error code `42501`) by enforcing RLS and adding `SELECT` and `INSERT` policies so `authenticated` users can manage their own addresses based on `auth.uid() = user_id`.

## Deployment & Configuration

- [x] Set secret `FONNTE_TOKEN` on project `kjvnbnwdcyilzqymknxm`.
- [x] Deployed function `fonnte-otp`.
- [x] Enabled "Send SMS Hook" in Supabase Dashboard (HTTPS endpoint).

## Validation

- [x] All bypass logic removed from frontend.
- [x] Real network calls to Supabase Auth are mandatory.
- [x] Trigger properly inserts into `profiles`, `carts`, `loyalty`, and `notification_settings` on successful OTP sign-up.
- [x] Address synchronization works correctly post-login.
