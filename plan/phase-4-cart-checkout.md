# Phase 4 — Cart & Checkout

## Objective
Implementasi smart cart (persistent), kalkulasi ongkir, dan payment flow via Xendit.

## Tasks

### Cart
- [x] API: `POST /api/cart` (add/update item)
- [x] API: `DELETE /api/cart` (remove item)
- [x] API: `GET /api/cart` (get user cart)
- [/] Cart page UI (items, quantity, subtotal)
- [ ] Cart badge di header (item count)

### Shipping
- [x] API: `POST /api/shipping/cost` (RajaOngkir integration)
- [/] Address management UI (CRUD, set default)
- [/] Courier selection UI (JNE, SiCepat, AnterAja)

### Checkout
- [/] Checkout page UI (summary, address, courier, coupon input)
- [x] API: `POST /api/checkout` (validate → lock price → create order → Xendit invoice)
- [x] Xendit invoice creation (VA, QRIS, E-Wallet)
- [/] Payment page / redirect to Xendit
- [x] API: `POST /api/webhooks/xendit` (verify signature → update status → reduce stock/restore)

### Order
- [/] Order confirmation page
- [ ] Order history page (list + detail)
- [ ] Order status tracking UI

## Output
- Full checkout flow working: cart → address → ongkir → payment → order confirmed
- Webhook auto-update status + reduce stock
