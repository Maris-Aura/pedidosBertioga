create table if not exists public.app_orders (
  id text primary key,
  store_id text not null,
  status text not null,
  courier_id text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.app_orders enable row level security;

drop policy if exists "app_orders_server" on public.app_orders;
create policy "app_orders_server" on public.app_orders
  for all using (true) with check (true);
