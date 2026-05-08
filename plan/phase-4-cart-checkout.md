# Phase 4 — Cart & Checkout

## Objective
Implementasi smart cart (persistent), kalkulasi ongkir, dan payment flow via Xendit.

## Tasks

### Cart
- [ ] API: `POST /api/cart` (add/update item)
- [ ] API: `DELETE /api/cart/[itemId]` (remove item)
- [ ] API: `GET /api/cart` (get user cart)
- [ ] Cart page UI (items, quantity, subtotal)
- [ ] Cart badge di header (item count)

### Shipping
- [ ] API: `POST /api/shipping/cost` (RajaOngkir integration)
- [ ] Address management UI (CRUD, set default)
- [ ] Courier selection UI (JNE, SiCepat, AnterAja)

### Checkout
- [ ] Checkout page UI (summary, address, courier, coupon input)
- [ ] API: `POST /api/checkout` (validate → lock price → create order → Xendit invoice)
- [ ] Xendit invoice creation (VA, QRIS, E-Wallet)
- [ ] Payment page / redirect to Xendit
- [ ] API: `POST /api/webhooks/xendit` (verify signature → update status → reduce stock)

### Order
- [ ] Order confirmation page
- [ ] Order history page (list + detail)
- [ ] Order status tracking UI

## Output
- Full checkout flow working: cart → address → ongkir → payment → order confirmed
- Webhook auto-update status + reduce stock
