-- 002: Product catalog tables

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  base_price int not null,
  weight_grams int not null default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_slug on public.products(slug);
create index idx_products_active on public.products(is_active);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  ring_size text,
  ring_count int,
  cover_color text,
  paper_type text,
  page_count int,
  stock int not null default 0,
  sku text unique not null,
  price_override int,
  created_at timestamptz default now()
);

create index idx_variants_product on public.product_variants(product_id);
create index idx_variants_sku on public.product_variants(sku);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int default 0
);

create index idx_images_product on public.product_images(product_id);

-- RLS
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- Products: public read, admin write
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

create policy "Admin can manage products"
  on public.products for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Variants: public read, admin write
create policy "Anyone can view variants"
  on public.product_variants for select
  using (
    exists (select 1 from public.products where id = product_id and is_active = true)
  );

create policy "Admin can manage variants"
  on public.product_variants for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Images: public read, admin write
create policy "Anyone can view images"
  on public.product_images for select
  using (true);

create policy "Admin can manage images"
  on public.product_images for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
