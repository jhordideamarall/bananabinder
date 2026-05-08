-- 001: Auth & User tables

-- OTP codes for WhatsApp authentication
create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used boolean default false,
  attempts int default 0,
  created_at timestamptz default now()
);

create index idx_otp_codes_phone on public.otp_codes(phone);
create index idx_otp_codes_expires on public.otp_codes(expires_at);

-- User profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  province_id int not null,
  city_id int not null,
  district_id int not null,
  postal_code text not null,
  full_address text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create index idx_addresses_user on public.addresses(user_id);

-- RLS
alter table public.otp_codes enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;

-- Profiles: users see own, admins see all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Addresses: users see own only
create policy "Users can manage own addresses"
  on public.addresses for all
  using (auth.uid() = user_id);

-- OTP: service role only (no public access)
create policy "No public access to otp_codes"
  on public.otp_codes for all
  using (false);
