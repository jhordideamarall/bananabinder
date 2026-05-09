# Phase 5 — Marketing Engine

## Objective

Implementasi kupon, flash sale, dan abandoned cart recovery.

## Tasks

### Meta Ads Integration

- [] Setup meta ads integration

### Kupon

- [x] Validasi kupon di checkout (server-side)
- [/] UI input kupon + feedback (valid/invalid/expired)
- [x] Increment `used_count` setelah order paid

### Flash Sale

- [ ] Flash sale banner di homepage (countdown timer)
- [/] Flash sale product listing (harga coret + promo price)
- [x] Auto-activate/deactivate berdasarkan waktu (Logic complete)
- [ ] Stock allocated tracking (flash sale punya stok sendiri)

### Abandoned Cart Recovery

- [x] Cron job: detect carts idle > 24 jam
- [x] Kirim notifikasi WA via Fonnte
- [ ] Kirim email reminder via Resend
- [ ] Track recovery rate

## Output

- Kupon bisa dipakai saat checkout
- Flash sale tampil dengan countdown + harga promo
- Cart yang ditinggalkan dapat notifikasi otomatis
