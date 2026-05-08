# Phase 5 — Marketing Engine

## Objective
Implementasi kupon, flash sale, dan abandoned cart recovery.

## Tasks

### Meta Ads Integration
- [] Setup meta ads integration

### Kupon
- [ ] Validasi kupon di checkout (server-side)
- [ ] UI input kupon + feedback (valid/invalid/expired)
- [ ] Increment `used_count` setelah order paid

### Flash Sale
- [ ] Flash sale banner di homepage (countdown timer)
- [ ] Flash sale product listing (harga coret + promo price)
- [ ] Auto-activate/deactivate berdasarkan waktu
- [ ] Stock allocated tracking (flash sale punya stok sendiri)

### Abandoned Cart Recovery
- [ ] Cron job: detect carts idle > 24 jam
- [ ] Kirim notifikasi WA via Fonnte
- [ ] Kirim email reminder via Resend
- [ ] Track recovery rate

## Output
- Kupon bisa dipakai saat checkout
- Flash sale tampil dengan countdown + harga promo
- Cart yang ditinggalkan dapat notifikasi otomatis
