# 053 — Shop Layout & useScroll Hydration Fix

**Tanggal**: 2026-05-16
**Scope**: Layout Stability & Console Error Cleanup
**Tujuan**: Menghilangkan error console yang mengganggu stabilitas aplikasi tanpa merubah estetika atau animasi yang sudah ada.

---

## Konteks & Masalah

Terdapat dua error utama yang muncul di console browser:

1. **Framer Motion Hydration Error**: "Container ref is defined but not hydrated" pada `useScroll` di Home Page. Ini terjadi karena `useRef` dibaca oleh Framer Motion sebelum elemen DOM benar-benar terpasang (mounted).
2. **Missing Key Warnings**: Warning "Each child in a list should have a unique 'key' prop" di `ShopLayout`. Ini terjadi karena blok kondisional (seperti Header mobile vs desktop) tidak memiliki key yang stabil untuk rekonsiliasi React.

---

## Perubahan

### 1. Home Page (Hydration Fix)

**File**: `apps/web/app/(shop)/page.tsx`

- Mengganti `useRef` dengan `useState` untuk menyimpan referensi elemen scroll container.
- `useScroll` sekarang menerima _state-based ref_. Ini memastikan Framer Motion hanya menginisialisasi listener setelah elemen benar-benar tersedia di DOM.
- **Hasil**: Error "not hydrated" hilang, animasi _3D stack_ tetap berjalan mulus.

### 2. Shop Layout (Key Consistency)

**File**: `apps/web/app/(shop)/layout.tsx`

- Menambahkan `key` unik pada wrapper kondisional:
  - `key="mobile-header-wrapper"` untuk area header mobile.
  - `key="shop-main-content"` untuk tag `<main>`.
  - `key="bottom-nav-wrapper"` untuk Bottom Navigation.
- **Hasil**: React dapat melacak perpindahan antar halaman dengan lebih akurat, menghilangkan warning key di level layout.

### 3. Header (Category Key Fix)

**File**: `apps/web/components/layout/header.tsx`

- Memperbaiki `key` pada kategori "Semua" agar konsisten dengan sibling-nya yang di-fetch dari DB.

---

## File Diubah

| File                                    | Status  | Catatan                                      |
| --------------------------------------- | ------- | -------------------------------------------- |
| `apps/web/app/(shop)/page.tsx`          | Updated | Fix `useScroll` hydration via state ref.     |
| `apps/web/app/(shop)/layout.tsx`        | Updated | Add keys to conditional UI blocks.           |
| `apps/web/components/layout/header.tsx` | Updated | Stabilize keys in category motion container. |

---

## Validasi

- ✅ `pnpm --filter @bananasbindery/web type-check` — **0 error**
- ✅ `npx eslint` pada file terdampak — **0 warning**
- ✅ Estetika & Animasi: **LOCKED**. Tidak ada perubahan pada perilaku spring, stagger, atau visual transition.

---

## Revert Procedure

```bash
git checkout HEAD~1 -- \
  apps/web/app/(shop)/page.tsx \
  apps/web/app/(shop)/layout.tsx \
  apps/web/components/layout/header.tsx
```
