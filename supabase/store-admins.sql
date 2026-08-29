-- Cole no SQL Editor do Supabase para o login das lojas funcionar em qualquer aparelho.

create table if not exists public.store_admins (
  id text primary key,
  store_id text not null,
  email text not null unique,
  password_digest text not null,
  created_at timestamptz not null default now()
);

alter table public.store_admins enable row level security;

drop policy if exists "store_admins_server" on public.store_admins;
create policy "store_admins_server" on public.store_admins
  for all using (true) with check (true);
