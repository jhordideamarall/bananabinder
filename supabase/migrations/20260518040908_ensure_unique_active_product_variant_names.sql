create unique index if not exists product_variants_unique_active_name_per_product
on public.product_variants (product_id, lower(trim(name)))
where coalesce(is_active, true) = true;
