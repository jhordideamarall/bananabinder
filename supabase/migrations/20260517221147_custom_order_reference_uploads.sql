insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'custom-order-references',
  'custom-order-references',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

drop policy if exists "storage_custom_order_references_read" on storage.objects;
create policy "storage_custom_order_references_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'custom-order-references'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'owner', 'staff')
    )
  )
);

drop policy if exists "storage_custom_order_references_insert_own" on storage.objects;
create policy "storage_custom_order_references_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'custom-order-references'
  and auth.uid()::text = (storage.foldername(name))[1]
);
