-- 005: Cart (persistent / abandoned cart)

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  updated_at timestamptz default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(cart_id, variant_id)
);

create index idx_cart_items_cart on public.cart_items(cart_id);

-- RLS
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Carts: users manage own
create policy "Users can manage own cart"
  on public.carts for all
  using (auth.uid() = user_id);

-- Cart items: users manage own
create policy "Users can manage own cart items"
  on public.cart_items for all
  using (
    exists (select 1 from public.carts where id = cart_id and user_id = auth.uid())
  );

-- Admin can view all carts (for abandoned cart feature)
create policy "Admin can view all carts"
  on public.carts for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin can view all cart items"
  on public.cart_items for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
