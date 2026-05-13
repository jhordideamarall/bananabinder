# Audit Report: Silencing Demo OTP Errors

## Context

Fixed console pollution caused by `400 Bad Request` errors when triggering OTP. These errors occurred because Supabase attempts to send a real SMS to numbers that aren't bypassed, which fails when no SMS provider is configured.

## File Manifest

- `apps/web/app/(auth)/login/page.tsx`: Added demo bypass for login flow.
- `apps/web/components/checkout/address-sheet.tsx`: Refined bypass and input cleaning.

## Surgical Breakdown

### `login/page.tsx`

- **Demo Send Bypass**: Added check for `08123456789` and `123456` in `handleSendOtp`. It now transitions to the OTP step immediately with an info toast, avoiding the Supabase network call.
- **Demo Verify Bypass**: Added check for OTP `123456` in `handleVerifyOtp`. It now successfully "logs in" the user (client-side redirect) without hitting the Supabase Auth server.

### `address-sheet.tsx`

- **Input Cleaning**: Updated the Phone input `onChange` to automatically strip non-numeric characters.
- **Robust Bypass**: The bypass check now uses a `cleanPhone` variable to ensure it matches even if there were stray characters.
- **Console Silence**: By returning early for demo numbers, we completely prevent the `400 Bad Request` network error from appearing in the browser console for these test cases.

## Validation

- [x] Login page now supports bypass for `08123456789` / `123456`.
- [x] Address Sheet phone input is cleaner.
- [x] Console is clear of 400 errors when using demo credentials.

## Note on "Wajar" (Expected Behavior)

The `400 Bad Request` error is **expected** if you enter a random phone number, because the Supabase project does not have a real SMS provider (like Twilio) configured. Since it's a network-level error, the browser console will always show it in red if the request is actually sent. The bypasses implemented ensure that for our "Demo Path," no request is sent at all.
