alter table public.store_settings
  add column if not exists custom_order_product_slug text not null default 'binder-custom-nama',
  add column if not exists custom_order_materials jsonb not null default '["Premium Leather", "Canvas Texture", "Hardcover Matte", "Transparent Flexy"]'::jsonb;

comment on column public.store_settings.custom_order_product_slug is
  'Product slug used as the source catalog for /custom order variant and pricing options.';
comment on column public.store_settings.custom_order_materials is
  'JSON array of material choices shown on the /custom order page.';
