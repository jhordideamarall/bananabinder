# Session 2026-05-08 — Booking Page Integration dengan Supabase

## Ringkasan

Integrasi halaman booking dari **100% mock data** menjadi **real data dari Supabase**, termasuk services, pets user, slot availability, dan insert booking ke database. Juga menambahkan fitur pilihan jumlah hari untuk Pet Hotel.

---

## File yang Dibuat

| File                                      | Keterangan                                                      |
| ----------------------------------------- | --------------------------------------------------------------- |
| `packages/api-client/src/bookings.ts`     | API client: `getServices`, `getAvailableSlots`, `createBooking` |
| `apps/web/lib/services/booking-client.ts` | Wrapper dengan `createClient()` untuk web                       |

## File yang Diubah

| File                                     | Perubahan                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `packages/api-client/src/types.ts`       | Tambah types: `Service`, `BookingSlot`, `Booking`, `BookingInsert`, `AvailableSlot`                                       |
| `packages/api-client/package.json`       | Tambah subpath export `"./bookings"`                                                                                      |
| `apps/web/app/booking/page.tsx`          | Replace mock services/pets/slots → fetch real dari DB. Tambah check-in/check-out date range untuk hotel                   |
| `apps/web/app/booking/checkout/page.tsx` | Replace fake submit → real `createBooking` insert ke DB. Tambah pet baru ke DB via `addPet`. Support hotel nights pricing |

## Database Changes (via MCP)

- **Hapus** 2 services kucing: `grooming-kucing-basic`, `grooming-kucing-full`
- **Reorder** services yang tersisa (anjing only + hotel)
- Final services: Grooming Anjing Basic (100k), Grooming Anjing Full (200k), Pet Hotel Small (120k/hari), Pet Hotel Large (250k/hari)

---

## Arsitektur & Keputusan Teknis

### 1. Lazy Auth

User bisa isi semua step (layanan, jadwal, pet) tanpa login. Login diminta saat klik "Konfirmasi" di checkout. Setelah login, pet baru otomatis tersimpan ke akun.

### 2. Slot Availability — Fallback Config

`booking_slots` table saat ini kosong. Jika tidak ada slot di DB untuk tanggal tertentu, client generate default: **09:00–16:00, interval 90 menit** (5 slot). Admin bisa override dari dashboard nanti.

### 3. Hotel Date Range

Saat user pilih service hotel:

- Time slot disembunyikan
- Muncul 2 date scroll: "Check-in" (orange) + "Check-out" (ungu)
- Badge `X hari` otomatis terhitung
- Harga = `price × jumlah_hari`
- DP = `harga_total × dp_percentage%`
- Check-in auto-push check-out jika tanggal sama/lebih baru

### 4. Monorepo Compliance

- Business logic (slot generation fallback) di `packages/api-client`
- Supabase client diterima sebagai parameter (portabel ke mobile)
- Web hanya wrapper tipis via `booking-client.ts`

---

## Yang Belum Dikerjakan / Catatan

- `booking_slots.booked` **tidak auto-increment** saat booking masuk → perlu DB trigger atau update di `createBooking`
- `seed.sql` belum diupdate (masih ada service kucing) — perlu sync
- Admin dashboard untuk manage services & slots belum ada
- Payment integration (Midtrans/Xendit) belum terhubung — booking masuk sebagai `payment_status: 'unpaid'`

---

## Type-Check Status

✅ Zero TypeScript errors setelah semua perubahan.
