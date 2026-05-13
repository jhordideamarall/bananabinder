# 🔑 Role & Permission Matrix — Bananasbindery Platform

**Tanggal:** 2 Mei 2026

---

## PRD vs Implementasi

|             | PRD §3                       | Database (Aktual)                     |
| ----------- | ---------------------------- | ------------------------------------- |
| Jumlah role | 3                            | 4                                     |
| Roles       | `customer`, `admin`, `owner` | `customer`, `staff`, `admin`, `owner` |
| Perbedaan   | —                            | `staff` ditambahkan saat implementasi |

> `staff` ditambahkan untuk memisahkan akses operasional (lihat orders, update booking) dari akses manajemen (CRUD produk, voucher, dll). Ini enhancement dari PRD.

---

## Hierarki Role

```
owner (level 4 — full access)
  └── admin (level 3 — manage everything)
       └── staff (level 2 — operational view)
            └── customer (level 1 — self-service)
```

---

## Detail Permission per Role

### Customer (`role = 'customer'`)

| Area                           | Permission                   |
| ------------------------------ | ---------------------------- |
| Products, Categories, Services | View (active only)           |
| Cart                           | Full CRUD (own)              |
| Orders                         | Create + View own            |
| Bookings                       | Create + View own            |
| Reviews                        | Create (own) + View (public) |
| Wishlists                      | Full CRUD (own)              |
| Profile, Addresses, Pets       | Full CRUD (own)              |
| Loyalty & Points               | View own                     |
| Notifications                  | View + Mark as read (own)    |
| Vouchers                       | View active                  |
| Storage Upload                 | Avatars, pets, reviews only  |

### Staff (`role = 'staff'`)

| Area                      | Permission               |
| ------------------------- | ------------------------ |
| Semua permission Customer | ✅                       |
| Orders                    | View ALL orders          |
| Order Items               | View ALL                 |
| Bookings                  | View ALL + Update status |

### Admin (`role = 'admin'`)

| Area                       | Permission                |
| -------------------------- | ------------------------- |
| Semua permission Staff     | ✅                        |
| Products, Variants, Images | Full CRUD                 |
| Categories                 | Full CRUD                 |
| Services, Booking Slots    | Full CRUD                 |
| Vouchers                   | Full CRUD                 |
| Banners                    | Full CRUD                 |
| Stock Movements            | Full CRUD                 |
| Loyalty & Loyalty History  | Full CRUD                 |
| Notifications              | Full CRUD                 |
| Transactions               | Full CRUD                 |
| Order Returns              | Full CRUD                 |
| Orders                     | View + Update (no delete) |
| Storage Upload             | All buckets               |

### Owner (`role = 'owner'`)

| Area                   | Permission                       |
| ---------------------- | -------------------------------- |
| Semua permission Admin | ✅                               |
| ALL tables             | Full CRUD (auto via dynamic RLS) |
| Orders                 | Delete                           |
| Audit Logs             | Full CRUD                        |
| Store Locations        | Full CRUD                        |
| Profiles (all users)   | Full CRUD                        |

---

## RLS Helper Functions (di Database)

```sql
-- Cek apakah user adalah owner
is_owner()            -- role = 'owner'

-- Cek apakah user adalah admin atau owner
is_admin_or_owner()   -- role IN ('admin', 'owner')

-- Cek apakah user adalah staff ke atas
is_staff_or_above()   -- role IN ('staff', 'admin', 'owner')

-- Ada juga:
is_admin()            -- role = 'admin' (exact, untuk dynamic policy loop)
```

---

## Cara Assign Role

| Metode                     | Contoh                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| **Signup biasa**           | Otomatis `customer` via `handle_new_user()` trigger                           |
| **Manual via SQL**         | `UPDATE profiles SET role = 'admin' WHERE email = 'admin@pawvels.com';`       |
| **Via Supabase Dashboard** | Table Editor → profiles → edit row → ubah role                                |
| **Via API (invite)**       | Set `raw_app_meta_data.role` saat create user, trigger akan assign jika valid |

> ⚠️ Trigger menggunakan CASE/WHEN whitelist — jika role tidak valid, fallback ke `customer`.
