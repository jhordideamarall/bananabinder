-- 007: Storage bucket for product images
-- Run this via Supabase Dashboard > Storage or SQL Editor

-- Create bucket
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

-- Allow public read
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admin can upload/delete
create policy "Admin can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
