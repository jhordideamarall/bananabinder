# Phase 8 — Testing & QA

## Objective
Pastikan semua flow berjalan benar dan aman sebelum production.

## Tasks

- [ ] Unit tests: validasi kupon, kalkulasi harga, stock reduction
- [ ] Integration tests: OTP flow, checkout flow, webhook handler
- [ ] E2E tests: full user journey (browse → cart → checkout → payment)
- [ ] Security audit: RLS policies, webhook verification, OTP brute force
- [ ] Performance test: load time < 1.5s, Lighthouse score > 90
- [ ] Mobile responsiveness check (iOS Safari, Android Chrome)
- [ ] Payment testing (Xendit sandbox: VA, QRIS, E-Wallet)
- [ ] Edge cases: expired coupon, out of stock, double payment, concurrent checkout

## Output
- All tests passing
- No critical security issues
- Performance targets met
