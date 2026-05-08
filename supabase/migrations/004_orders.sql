-- 004: Orders & transactions

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  xendit_invoice_id text,
  xendit_payment_url text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal int not null,
  shipping_cost int not null default 0,
  coupon_id uuid references public.coupons(id),
  discount_amount int default 0,
  total_amount int not null,
  shipping_address jsonb not null,
  courier_details jsonb,
  tracking_number text,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_xendit on public.orders(xendit_invoice_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  product_name text not null,
  variant_label text not null,
  quantity int not null,
  price_at_time int not null
);

create index idx_order_items_order on public.order_items(order_id);

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders: users see own, admin sees all
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admin can manage all orders"
  on public.orders for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Order items: users see own order items
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Admin can manage all order items"
  on public.order_items for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
