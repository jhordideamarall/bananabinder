# Session Report: Auth Fix + Account CRUD

**Tanggal:** 2026-05-05  
**Scope:** Login phone fix, Account pages CRUD (Wishlist, Pets, Addresses), Wishlist optimistic update

---

## Ringkasan Masalah & Solusi

### 1. Login dengan nomor HP diarahkan ke halaman Register

**Masalah:**  
User dengan nomor `082281872174` sudah terdaftar tapi terus diredirect ke `/register` saat login.

**Root Cause:**

- `check-phone` API hanya mengecek `profiles.phone`
- User lama (checkout as guest) punya phone tersimpan di `addresses.phone` tapi `profiles.phone = NULL`
- Format phone tidak dinormalisasi: `082...` vs `+62...` dianggap berbeda

**File yang diubah:**

- `apps/web/app/api/auth/check-phone/route.ts`
- `supabase/migrations/20260504000003_backfill_profiles_phone.sql` _(baru)_
- `supabase/migrations/20260505000001_check_phone_in_auth.sql` _(baru)_

**Solusi:**

```ts
// Normalisasi dua format sekaligus
function getBothPhoneFormats(phone: string): string[] {
  if (phone.startsWith('+62')) return [phone, '0' + phone.slice(3)];
  if (phone.startsWith('0')) return [phone, '+62' + phone.slice(1)];
  return [phone, '+62' + phone];
}
```

3 lapis pengecekan:

1. `profiles.phone` — dua format (`082...` dan `+62...`)
2. `addresses.phone` — dua format (dari guest checkout flow)
3. `auth.users` via RPC `check_phone_in_auth` — fallback untuk akun lama

Migration backfill: update `profiles.phone` dari `auth.users` untuk semua user lama yang phone-nya NULL.

---

### 2. Wishlist tidak tersimpan saat klik love di Product Detail

**Masalah:**  
Heart button di product detail hanya menggunakan `useState(false)` — tidak terhubung ke database.

**File yang diubah:**

- `apps/web/app/(shop)/products/[slug]/_client.tsx`

**Solusi:**  
Connect ke `toggleWishlist` dari `wishlist-client.ts` dengan **optimistic update**:

```ts
const wishlistMutation = useMutation({
  mutationFn: () => toggleWishlist(productId),
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: ['wishlist'] });
    const prev = queryClient.getQueryData<any[]>(['wishlist']) ?? [];
    const alreadyIn = prev.some((w) => w.product_id === productId);
    // Update cache langsung tanpa tunggu server
    queryClient.setQueryData(
      ['wishlist'],
      alreadyIn
        ? prev.filter((w) => w.product_id !== productId)
        : [...prev, { product_id: productId, id: `optimistic-${productId}` }],
    );
    return { prev };
  },
  onError: (_err, _vars, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(['wishlist'], ctx.prev); // rollback
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
});
```

Animasi bounce native feel:

```tsx
<m.button
  whileTap={{ scale: 0.75 }}
  animate={{ scale: isWishlisted ? [1, 1.35, 1] : 1 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
>
  <Heart fill={isWishlisted ? '#E53935' : 'none'} />
</m.button>
```

---

### 3. Wishlist 406 Error

**Masalah:**  
`toggleWishlist` menggunakan `.single()` saat mengecek apakah produk sudah ada. `.single()` throw 406 jika 0 rows.

**File yang diubah:**

- `apps/web/lib/services/wishlist-client.ts`

**Solusi:** Ganti `.single()` → `.maybeSingle()` (return `null` jika tidak ada, bukan error).

---

### 4. Wishlist Page — tidak ada tombol hapus & add to cart

**File yang diubah:**

- `apps/web/app/(account)/account/wishlist/page.tsx`

**Ditambahkan:**

- Tombol **Trash** (hapus dari wishlist) via `toggleWishlist` + `useMutation`
- Tombol **ShoppingCart** (add to cart) via `useCartStore`
- Query invalidation setelah hapus

---

### 5. Pets Page — CRUD lengkap

**Masalah:**  
Tombol `+` dan "Tambah Hewan" tidak berfungsi, tidak ada edit/delete.

**File yang diubah:**

- `apps/web/app/(account)/account/pets/page.tsx`

**Ditambahkan:**

- **Add modal** (bottom sheet): pilih tipe hewan (Anjing/Kucing/Burung/Kelinci/Lainnya), isi nama, ras, tanggal lahir, berat, catatan
- **Edit modal**: pre-fill data hewan yang dipilih, simpan via `updatePet`
- **Delete confirm dialog**: konfirmasi sebelum hapus
- Tombol edit (pensil) + delete (trash) di setiap kartu
- Type selector scroll horizontal full-bleed tanpa terpotong
- Submit button di atas bottom nav dengan `pb-[calc(88px+env(safe-area-inset-bottom)+8px)]`

---

### 6. Address Page — edit & UX improvement

**Masalah:**  
Tidak ada tombol edit alamat. UX klik kartu membingungkan. Tidak bisa ubah alamat utama dari edit.

**File yang diubah:**

- `apps/web/app/(account)/account/addresses/page.tsx`
- `apps/web/lib/services/address-client.ts`

**Ditambahkan di `address-client.ts`:**

```ts
export async function updateAddress(addressId: string, fields: Partial<Address>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('addresses')
    .update(fields)
    .eq('id', addressId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

**UI improvements:**

- Tombol **edit** (pensil) di setiap kartu → buka edit modal
- Edit modal: label chips (Rumah/Kantor/Kos/Lainnya), semua field alamat, toggle "Jadikan Alamat Utama" dengan visual indicator
- Alamat utama punya border orange + badge bintang
- **Delete** hanya muncul di alamat non-utama (safety)
- Confirm dialog sebelum delete
- Button submit di atas bottom nav

---

## Kronologi Percakapan & Kesalahan AI

### Percakapan lengkap + evaluasi diri

---

**[1] User:** Punya nomor HP `082281872174` tapi pas login diarahkan ke halaman register, padahal nomor ada di database.

**AI:** Langsung cek `check-phone/route.ts` dan login page. Identifikasi format `0` vs `+62`. Buat migration backfill + RPC `check_phone_in_auth`. Update route dengan fallback 3 layer.

**Kesalahan AI:** Terlalu cepat deploy migration tanpa verifikasi apakah data di DB memang ada. Perlu debug dulu sebelum deploy.

---

**[2] User:** Kamu revert padahal aku belum ngapa-ngapain database. Apakah app normal dijalankan?

**AI:** Menjelaskan bahwa `migration repair --status reverted` bukan revert data, hanya fix history tracking. App tetap normal.

**Kesalahan AI:** Tidak menjelaskan di awal bahwa perintah `repair` akan dijalankan dan efeknya apa. Harusnya explain dulu sebelum eksekusi.

---

**[3] User:** Logikanya seperti apa? `0` dan `+62` kan sama, buat aja normalisasi.

**AI:** Langsung update `check-phone` dengan `getBothPhoneFormats()` menggunakan `.in()` query. Sederhanakan migration (hapus RPC yang tidak perlu).

**Evaluasi:** Ini solusi yang benar dan lebih simpel. Seharusnya langsung ke sini dari awal, tidak perlu RPC.

---

**[4] User:** Masih diarahkan ke halaman register dengan nomor yang sama.

**AI:** Buat debug endpoint `/api/auth/debug-phone` untuk cek data real di DB.

**Hasil debug:** `profileRows: null`, `fuzzyMatch: null` — phone tidak ada di `profiles` sama sekali.

**Kesalahan AI:** Terlambat membuat debug endpoint. Harusnya ini langkah pertama sebelum asumsi solusi.

---

**[5] User:** Masih ga bisa! Padahal kalau guest checkout isi alamat dan nomor HP bisa auto login.

**AI:** Baru sadar bahwa phone disimpan di `addresses.phone` (dari guest checkout), bukan di `profiles.phone`. Tambahkan pengecekan `addresses.phone` sebagai layer ke-2.

**Kesalahan AI:** Tidak membaca flow guest checkout dari awal. Kalau langsung baca `address-sheet.tsx` di awal, masalah ini bisa ditemukan jauh lebih cepat dan tidak perlu debug endpoint + 4 iterasi.

---

**[6] User:** Wishlist, Pets, Addresses harus berfungsi. Klik love di product detail tidak menambah wishlist di account page.

**AI:** Audit semua account pages. Temukan: heart button di `_client.tsx` cuma `useState(false)` lokal, tidak ke DB. Fix dengan connect ke `toggleWishlist` + optimistic update.

**Kesalahan AI:** Wishlist page tidak ada tombol hapus — harusnya itu obvious dari UX standar. Tidak diimplementasi di awal.

---

**[7] User:** Wishlist 406 error di console.

**AI:** Fix `.single()` → `.maybeSingle()`.

**Kesalahan AI:** Ini harusnya di-catch waktu pertama kali menulis `toggleWishlist`. `.single()` sudah diketahui throw 406 kalau 0 rows — ini kesalahan dasar yang tidak terdeteksi di code review.

---

**[8] User:** Ada delay saat tekan button love, buat native feel tanpa delay.

**AI:** Implement optimistic update + bounce animation (`scale: [1, 1.35, 1]`).

**Evaluasi:** Solusi tepat dan cepat.

---

**[9] User:** [Screenshot] Pilihan piaraan terpotong, button ketutup bottom nav.

**AI:** Fix type selector dengan `-mx-0 px-5` pada scroll container. Pindah button submit ke luar scroll area dengan `pb-[calc(88px+env(safe-area-inset-bottom)+8px)]`.

**Kesalahan AI:** Butuh 2 iterasi untuk fix button — percobaan pertama (menggunakan `border-t` sebagai sticky footer) masih ketutup nav. Harusnya langsung hitung tinggi nav (`88px`) dari awal.

---

**[10] User:** Alamat bisa edit juga, tidak fleksibel, tidak bisa ubah label utama.

**AI:** Tambah `updateAddress` ke service, buat edit modal lengkap dengan label chips + toggle "Jadikan Utama".

**Evaluasi:** Implementasi selesai dalam satu pass, tidak ada iterasi ulang.

---

**[11] User:** Button masih ketutup bottom nav!

**AI:** Fix padding di pets modal dengan `pb-[calc(88px+env(safe-area-inset-bottom)+8px)]`. Ini iterasi ke-2 untuk masalah yang sama.

**Kesalahan AI:** Masalah button ketutup bottom nav terjadi dua kali (pets modal + address edit modal). Harusnya setelah fix pertama, langsung apply pattern yang sama ke semua modal. Tidak konsisten.

---

### Pola Kesalahan yang Perlu Diingat

| #   | Kesalahan                                                 | Pelajaran                                                                                  |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Langsung asumsi solusi tanpa debug dulu                   | **Debug first, fix second** — buat debug endpoint sebelum iterasi solusi                   |
| 2   | Tidak baca semua flow yang relevan di awal                | **Baca semua file terkait** sebelum mulai (address-sheet.tsx harusnya dibaca di awal)      |
| 3   | `.single()` dipakai tanpa handle 0 rows                   | **Selalu pakai `.maybeSingle()`** untuk optional lookup di Supabase                        |
| 4   | Fix UI yang sama diulang 2x di file berbeda               | **Apply pattern konsisten** — kalau fix bottom nav di satu modal, langsung fix semua modal |
| 5   | Tidak explain destructive/repair command sebelum eksekusi | **Explain dulu** perintah yang berpotensi membingungkan user sebelum jalankan              |
| 6   | Wishlist tanpa tombol hapus — obvious tapi terlewat       | **Think full CRUD** dari awal untuk setiap halaman list                                    |

---

## Migrations Applied

| Migration                                    | Isi                                                          |
| -------------------------------------------- | ------------------------------------------------------------ |
| `20260504000003_backfill_profiles_phone.sql` | UPDATE profiles.phone dari auth.users untuk user lama        |
| `20260505000001_check_phone_in_auth.sql`     | CREATE FUNCTION check_phone_in_auth — cek auth.users via RPC |

---

## Files Changed

```
apps/web/app/api/auth/check-phone/route.ts          — fix: 3-layer phone check
apps/web/app/(shop)/products/[slug]/_client.tsx     — feat: wishlist optimistic update + bounce anim
apps/web/app/(account)/account/wishlist/page.tsx    — feat: hapus & add to cart
apps/web/app/(account)/account/pets/page.tsx        — feat: full CRUD (add/edit/delete)
apps/web/app/(account)/account/addresses/page.tsx   — feat: edit modal + UX improvement
apps/web/lib/services/wishlist-client.ts            — fix: .single() → .maybeSingle()
apps/web/lib/services/address-client.ts             — feat: updateAddress function
supabase/migrations/20260504000003_*.sql            — migration: backfill profiles.phone
supabase/migrations/20260505000001_*.sql            — migration: check_phone_in_auth RPC
```
