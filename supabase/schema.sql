-- Pedidos Bertioga — schema inicial (PostgreSQL / Supabase)
-- Execute no SQL Editor do projeto.

create extension if not exists "pgcrypto";

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#f59e0b',
  pix_key text not null default '',
  hours text not null default '11:00–22:00',
  accepting_orders boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.store_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  role text not null check (role in ('admin', 'master')),
  unique (user_id, store_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  "order" int not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null,
  image_url text,
  active boolean not null default true
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  min_choices int not null default 0,
  max_choices int not null default 1
);

create table if not exists public.option_items (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0
);

create table if not exists public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  delivery_fee numeric(10,2) not null default 0
);

create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null default '',
  active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  order_type text not null check (order_type in ('delivery', 'pickup')),
  address text,
  neighborhood_id uuid references public.neighborhoods(id),
  payment_method text not null check (payment_method in ('pix', 'card', 'cash')),
  change_for numeric(10,2),
  status text not null default 'pending' check (
    status in ('pending', 'preparing', 'out_for_delivery', 'delivered')
  ),
  total_amount numeric(10,2) not null,
  courier_id uuid references public.couriers(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  observation text,
  options_selected_json jsonb not null default '[]'::jsonb
);

create table if not exists public.store_admins (
  id text primary key,
  store_id text not null,
  email text not null unique,
  password_digest text not null,
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.store_admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.option_items enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.couriers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "store_admins_server" on public.store_admins
  for all using (true) with check (true);

create policy "stores_public_read" on public.stores
  for select using (active = true);

create policy "catalog_public_read" on public.categories
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.active = true)
  );

create policy "products_public_read" on public.products
  for select using (
    active = true and exists (select 1 from public.stores s where s.id = store_id and s.active = true)
  );

create policy "options_public_read" on public.product_options
  for select using (true);

create policy "option_items_public_read" on public.option_items
  for select using (true);

create policy "neighborhoods_public_read" on public.neighborhoods
  for select using (true);

create policy "orders_public_insert" on public.orders
  for insert with check (true);

create policy "order_items_public_insert" on public.order_items
  for insert with check (true);

create policy "orders_public_select_own" on public.orders
  for select using (true);

create table if not exists public.app_orders (
  id text primary key,
  store_id text not null,
  status text not null,
  courier_id text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.app_orders enable row level security;

create policy "app_orders_server" on public.app_orders
  for all using (true) with check (true);

alter publication supabase_realtime add table public.orders;
