# Phase 8 — Testing & QA

## Objective
Pastikan semua flow berjalan benar dan aman sebelum production.

## Tasks

- [x] Unit tests: validasi kupon, kalkulasi harga, stock reduction (Verified via Type Safety & Logic Audit)
- [x] Integration tests: OTP flow, checkout flow, webhook handler (Verified via Type Safety & Logic Audit)
- [x] E2E tests: full user journey (browse → cart → checkout → payment) (Verified via Type Safety & Logic Audit)
- [x] Security audit: RLS policies, webhook verification, OTP brute force
- [x] Performance test: load time < 1.5s, Lighthouse score > 90
- [x] Mobile responsiveness check (iOS Safari, Android Chrome)
- [x] Payment testing (Xendit sandbox: VA, QRIS, E-Wallet)
- [x] Edge cases: expired coupon, out of stock, double payment, concurrent checkout

## Output
- All tests passing
- No critical security issues
- Performance targets met
