-- ============================================================================
-- Merquellantas Convention App — Supabase schema
-- Run this whole file once in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================================

-- Extension needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. salesmen
-- ----------------------------------------------------------------------------
create table if not exists public.salesmen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  location text not null,
  whatsapp_link text not null,
  profile_views integer not null default 0,
  whatsapp_clicks integer not null default 0,
  role text not null default 'salesman' check (role in ('salesman', 'admin')),
  photo_base64 text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. prizes
-- ----------------------------------------------------------------------------
create table if not exists public.prizes (
  id uuid primary key default gen_random_uuid(),
  prize_name text not null,
  image_url text,
  day1_stock integer not null default 0,
  day2_stock integer not null default 0,
  day3_stock integer not null default 0,
  probability_weight integer not null default 1,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. spin_logs
-- ----------------------------------------------------------------------------
create table if not exists public.spin_logs (
  id uuid primary key default gen_random_uuid(),
  salesman_email text not null,
  prize_won text not null,
  day_number integer not null check (day_number in (1, 2, 3)),
  timestamp timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.salesmen enable row level security;
alter table public.prizes enable row level security;
alter table public.spin_logs enable row level security;

-- salesmen: anyone can read the public directory (no emails/phones hidden here
-- by policy — front end already only exposes what the directory needs, but if
-- you want to hide contact info from anonymous users, split into a public view).
drop policy if exists "Public can read salesmen" on public.salesmen;
create policy "Public can read salesmen"
  on public.salesmen for select
  using (true);

-- salesmen: only authenticated admins can insert/update/delete salesman rows.
drop policy if exists "Admins manage salesmen" on public.salesmen;
create policy "Admins manage salesmen"
  on public.salesmen for all
  using (
    exists (
      select 1 from public.salesmen s
      where s.email = auth.jwt() ->> 'email' and s.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.salesmen s
      where s.email = auth.jwt() ->> 'email' and s.role = 'admin'
    )
  );

-- salesmen: allow anonymous UPDATE of only the two counter columns via the
-- profile view / whatsapp click flows. We restrict this at the API layer
-- (Route Handlers using the anon key call an RPC below instead of raw
-- UPDATE), so no broad anonymous UPDATE policy is added here.

-- prizes: anyone (including anonymous) can read prize stock — needed so the
-- public can eventually see prizes, and so authenticated salesmen can spin.
drop policy if exists "Public can read prizes" on public.prizes;
create policy "Public can read prizes"
  on public.prizes for select
  using (true);

-- prizes: only admins can insert/update/delete.
drop policy if exists "Admins manage prizes" on public.prizes;
create policy "Admins manage prizes"
  on public.prizes for all
  using (
    exists (
      select 1 from public.salesmen s
      where s.email = auth.jwt() ->> 'email' and s.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.salesmen s
      where s.email = auth.jwt() ->> 'email' and s.role = 'admin'
    )
  );

-- spin_logs: any authenticated salesman can insert a log for themself.
drop policy if exists "Authenticated can insert own spin log" on public.spin_logs;
create policy "Authenticated can insert own spin log"
  on public.spin_logs for insert
  to authenticated
  with check (salesman_email = auth.jwt() ->> 'email');

-- spin_logs: salesmen can read their own logs (needed to check per-contact spin history).
drop policy if exists "Salesmen read own spin logs" on public.spin_logs;
create policy "Salesmen read own spin logs"
  on public.spin_logs for select
  to authenticated
  using (salesman_email = auth.jwt() ->> 'email');

-- spin_logs: admins can read everything.
drop policy if exists "Admins read spin logs" on public.spin_logs;
create policy "Admins read spin logs"
  on public.spin_logs for select
  using (
    exists (
      select 1 from public.salesmen s
      where s.email = auth.jwt() ->> 'email' and s.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- RPC functions (SECURITY DEFINER) — safe, narrow counters callable by the
-- anon key from the public directory pages without opening broad UPDATE access.
-- ----------------------------------------------------------------------------
create or replace function public.increment_profile_views(salesman_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.salesmen
  set profile_views = profile_views + 1
  where id = salesman_id;
end;
$$;

create or replace function public.increment_whatsapp_clicks(salesman_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.salesmen
  set whatsapp_clicks = whatsapp_clicks + 1
  where id = salesman_id;
end;
$$;

grant execute on function public.increment_profile_views(uuid) to anon, authenticated;
grant execute on function public.increment_whatsapp_clicks(uuid) to anon, authenticated;

-- Atomic, race-safe stock decrement + spin log insert used by the roulette
-- game so two simultaneous spins can never both take the "last" prize.
create or replace function public.spin_and_award(
  p_prize_id uuid,
  p_day_number integer,
  p_salesman_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_column text;
  v_current integer;
begin
  if p_day_number not in (1, 2, 3) then
    raise exception 'Invalid day_number %', p_day_number;
  end if;

  v_column := 'day' || p_day_number || '_stock';

  execute format('select %I from public.prizes where id = $1 for update', v_column)
    into v_current
    using p_prize_id;

  if v_current is null or v_current <= 0 then
    raise exception 'Prize % has no remaining stock for day %', p_prize_id, p_day_number;
  end if;

  execute format('update public.prizes set %I = %I - 1 where id = $1', v_column, v_column)
    using p_prize_id;

  insert into public.spin_logs (salesman_email, prize_won, day_number)
  select p_salesman_email, prize_name, p_day_number
  from public.prizes where id = p_prize_id;
end;
$$;

grant execute on function public.spin_and_award(uuid, integer, text) to authenticated;

-- Track which contact each spin was awarded to.
alter table public.spin_logs
  add column if not exists contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists contact_name text;

-- Rebuild spin_and_award to optionally record the contact.
create or replace function public.spin_and_award(
  p_prize_id uuid,
  p_day_number integer,
  p_salesman_email text,
  p_contact_id uuid default null,
  p_contact_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_column text;
  v_current integer;
begin
  if p_day_number not in (1, 2, 3) then
    raise exception 'Invalid day_number %', p_day_number;
  end if;

  v_column := 'day' || p_day_number || '_stock';

  execute format('select %I from public.prizes where id = $1 for update', v_column)
    into v_current
    using p_prize_id;

  if v_current is null or v_current <= 0 then
    raise exception 'Prize % has no remaining stock for day %', p_prize_id, p_day_number;
  end if;

  execute format('update public.prizes set %I = %I - 1 where id = $1', v_column, v_column)
    using p_prize_id;

  insert into public.spin_logs (salesman_email, prize_won, day_number, contact_id, contact_name)
  select p_salesman_email, prize_name, p_day_number, p_contact_id, p_contact_name
  from public.prizes where id = p_prize_id;
end;
$$;

grant execute on function public.spin_and_award(uuid, integer, text, uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Seed data (optional) — remove or edit before going live
-- ----------------------------------------------------------------------------
-- insert into public.prizes (prize_name, image_url, day1_stock, day2_stock, day3_stock, probability_weight)
-- values
--   ('Merquellantas Cap', null, 30, 30, 30, 10),
--   ('Tire Pressure Gauge', null, 20, 20, 20, 8),
--   ('$50 Gift Card', null, 5, 5, 5, 2),
--   ('Free Tire Rotation', null, 15, 15, 15, 6),
--   ('Grand Prize Tire Set', null, 1, 1, 1, 1);

-- ----------------------------------------------------------------------------
-- 4. contacts (CRM de convención — captura de leads y clientes)
-- ----------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  salesman_email text not null,
  salesman_name text not null,
  nombre text not null,
  telefono text not null,
  email text,
  tipo text not null default 'lead' check (tipo in ('lead', 'cliente_existente')),
  fecha date not null default current_date,
  vehiculos text,
  compras_habituales text[],
  compras_otras text,
  notas text,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

-- Salesmen can insert contacts that belong to them.
drop policy if exists "Salesmen insert own contacts" on public.contacts;
create policy "Salesmen insert own contacts"
  on public.contacts for insert
  to authenticated
  with check (salesman_email = auth.jwt() ->> 'email');

-- Salesmen read only their own contacts; admins read everything.
drop policy if exists "Salesmen read contacts" on public.contacts;
create policy "Salesmen read contacts"
  on public.contacts for select
  to authenticated
  using (
    salesman_email = auth.jwt() ->> 'email'
    or exists (
      select 1 from public.salesmen s
      where s.email = auth.jwt() ->> 'email' and s.role = 'admin'
    )
  );

-- After running this schema, create your first admin user:
-- 1. Supabase Dashboard -> Authentication -> Add user (email + password)
-- 2. Then run:
-- insert into public.salesmen (name, email, phone, location, whatsapp_link, role)
-- values ('Admin Name', 'admin@merquellantas.com', '+00000000', 'HQ', 'https://wa.me/00000000', 'admin');
