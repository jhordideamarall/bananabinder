# Audit & Perbaikan Sinkronisasi Database (030)
- **Tanggal**: 2026-05-12
- **Status**: Selesai
- **Oleh**: Antigravity

## Deskripsi Singkat
Melakukan sinkronisasi antara skema database Supabase (`xiumxugolyfsvwnwzenp`) dengan skema kode di `packages/db/src/schema.ts`. Fokus utama adalah menambahkan tabel `refunds` yang hilang dan memperbaiki drift default value.

## File yang Diubah/Dibuat
1. **[NEW]** `supabase/migrations/012_add_refunds_and_sync_fixes.sql`
2. **[REMOTE]** Skema tabel `refunds` di database.
3. **[REMOTE]** Policy RLS pada tabel `refunds`.
4. **[REMOTE]** Default value kolom `role` di tabel `profiles`.

## Rationale Teknis
- **Tabel `refunds`**: Diperlukan oleh logika bisnis di `packages/db/src/logic/orders.ts` saat user melakukan pembatalan order yang sudah dibayar. Tanpa tabel ini, fungsi `cancelOrder` akan gagal (`insert` error).
- **RLS Policy**: Menjamin keamanan data refund agar tidak bisa diakses/diubah oleh pihak yang tidak berwenang. Admin memiliki akses penuh, sedangkan user hanya bisa melihat refund miliknya sendiri.
- **Role Alignment**: Unifikasi default value `role` ke `'customer'` untuk konsistensi antara DB dan Application Layer (Drizzle).

## Verifikasi
- Migrasi diterapkan via `mcp_supabase_apply_migration`.
- Verifikasi tabel dan policy via SQL query menunjukkan hasil sukses.
