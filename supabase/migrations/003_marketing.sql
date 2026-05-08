-- 003: Marketing tables (coupons, flash sales)

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value int not null,
  min_purchase_amount int default 0,
  max_discount_amount int,
  usage_limit int not null default 1,
  used_count int default 0,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_coupons_code on public.coupons(code);

create table public.flash_sales (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.flash_sale_items (
  id uuid primary key default gen_random_uuid(),
  flash_sale_id uuid not null references public.flash_sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  promo_price int not null,
  stock_allocated int not null default 0,
  stock_sold int default 0
);

create index idx_flash_sale_items_sale on public.flash_sale_items(flash_sale_id);

-- RLS
alter table public.coupons enable row level security;
alter table public.flash_sales enable row level security;
alter table public.flash_sale_items enable row level security;

-- Coupons: authenticated can read active, admin can manage
create policy "Authenticated can view active coupons"
  on public.coupons for select
  using (is_active = true and valid_until > now());

create policy "Admin can manage coupons"
  on public.coupons for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Flash sales: public read active, admin manage
create policy "Anyone can view active flash sales"
  on public.flash_sales for select
  using (is_active = true and end_time > now());

create policy "Admin can manage flash sales"
  on public.flash_sales for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Flash sale items: public read, admin manage
create policy "Anyone can view flash sale items"
  on public.flash_sale_items for select
  using (true);

create policy "Admin can manage flash sale items"
  on public.flash_sale_items for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
