# Session: Booking Flow + Account UI + Bug Fixes

**Tanggal**: 2026-05-03  
**Fase**: Phase 7 (Booking UI) + Phase 8 (Account UI) — Front-end First

---

## Pekerjaan Selesai

### Booking Page (`app/booking/page.tsx`) — Major Refactor

- **Chip pickers** menggantikan native `<select>`: date chips fixed `w-[58px]` layout 3-baris, time chips horizontal scroll
- **Deselectable state**: `ServiceId | null` dan `PetId | null` (default null), klik item terpilih → deselect
- **Floating summary card** `AnimatePresence` — hanya muncul saat service dipilih
- **Step logic fixed**: progress bar hanya advance dari service+pet selection, bukan default date/time value
- **BOOKING_CONFIG**: `{ dateRangeDays:14, openHour:9, closeHour:20, slotIntervalMinutes:90 }` — admin-replaceable
- **generateDates()**: 14 hari ke depan, shortLabel max 4 char ("Hari"/"Bsk"/abbrev 3 char)
- **generateTimeSlots()**: 09:00–19:30, 8 slot, semua `available: true`
- Hapus label "TANGGAL"/"JAM" dan internal note "Jam penuh akan terkunci otomatis..."

### Booking Checkout (`app/booking/checkout/page.tsx`) — New

- Baca `sessionStorage.bookingDraft` → redirect ke `/booking` jika tidak ada
- `useRef` guard mencegah double-execution React 18 strict mode
- Service card accent border, pet section (existing atau add-new form), price breakdown (grooming/hotel)
- Generate booking number `BK-YYYYMMDD-XXXX` → simpan `bookingSuccess` ke sessionStorage

### Booking Success (`app/booking/success/page.tsx`) — New

- `useRef` guard mencegah double-execution (bug: run kedua redirect ke `/booking` karena sessionStorage sudah di-delete run pertama)
- Spring-animated check circle, booking number, ringkasan layanan/tanggal/jam
- Layout: konten dari atas (`pt-[max(48px,...)]`), button `mt-auto` menempel ke bawah
- CTA "Kembali ke Beranda"

### Account UI — 6 Pages

- `(account)/layout.tsx` — shared layout dengan BottomNav + safe area
- `(account)/account/page.tsx` — dark hero banner (nama + poin loyalty + tier Gold + progress bar ke Platinum), menu list bersih, tombol Keluar fixed `bottom-[88px]` di atas bottom nav
- `(account)/account/orders/page.tsx` — riwayat pesanan dummy dengan status badge
- `(account)/account/pets/page.tsx` — kartu Milo & Luna + add-new dashed button
- `(account)/account/addresses/page.tsx` — alamat tersimpan dengan badge "Utama"
- `(account)/account/loyalty/page.tsx` — hero card gelap + tier progress + history transaksi
- `(account)/account/wishlist/page.tsx` — grid produk + quick-add to cart

### Bug Fixes

- **Booking success menghilang**: `useRef(false)` guard di `useEffect` — React 18 dev mode menjalankan effect 2x, run pertama baca+hapus sessionStorage, run kedua tidak ketemu → redirect. Sama diterapkan ke booking/checkout.
- **Cart flash di product checkout**: tambah `submitting` state → `hasItems = items.length > 0 || submitting` mencegah "Belum ada item" muncul saat transisi navigasi setelah `clearCart()`
- **Route `/orders` salah**: sub-pages dipindah dari `(account)/orders/` → `(account)/account/orders/` agar URL jadi `/account/orders` (route group `(account)` tidak menambah prefix URL)
- **Link "Lihat Pesanan" di checkout success**: `/orders` → `/account/orders`

---

## Keputusan Teknis

| Masalah                                        | Solusi                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| sessionStorage double-read (React 18 strict)   | `useRef(false)` sebagai processed guard di setiap page yang baca sessionStorage |
| Cart flash sebelum navigasi                    | `submitting` flag membuat `hasItems` tetap true selama transisi                 |
| Route group (account) tidak memberi URL prefix | Sub-pages pindah ke `(account)/account/[sub]/page.tsx`                          |
| Booking data ke checkout                       | `sessionStorage` — menghindari typed route issues dan URL length limit          |

---

## Struktur Route Account (Final)

```
/account              → (account)/account/page.tsx
/account/orders       → (account)/account/orders/page.tsx
/account/pets         → (account)/account/pets/page.tsx
/account/addresses    → (account)/account/addresses/page.tsx
/account/loyalty      → (account)/account/loyalty/page.tsx
/account/wishlist     → (account)/account/wishlist/page.tsx
```

---

## File Dimodifikasi / Dibuat

```
apps/web/app/booking/page.tsx                        (refactored)
apps/web/app/booking/checkout/page.tsx               (new)
apps/web/app/booking/success/page.tsx                (new + bugfix)
apps/web/app/(account)/layout.tsx                    (new)
apps/web/app/(account)/account/page.tsx              (rebuilt)
apps/web/app/(account)/account/orders/page.tsx       (new, was /orders)
apps/web/app/(account)/account/pets/page.tsx         (new, was /pets)
apps/web/app/(account)/account/addresses/page.tsx    (new, was /addresses)
apps/web/app/(account)/account/loyalty/page.tsx      (new, was /loyalty)
apps/web/app/(account)/account/wishlist/page.tsx     (new, was /wishlist)
apps/web/app/checkout/page.tsx                       (bugfix: submitting flag)
apps/web/app/checkout/success/page.tsx               (bugfix: /account/orders link)
artifacts/phase-progress.md                          (updated)
```
