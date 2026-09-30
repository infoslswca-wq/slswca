-- SLSWCA initial schema.
-- Principles:
--   * RLS on every table. Public content is read-only for anon.
--   * Anything involving money or identity is written only by the server
--     (service_role bypasses RLS); clients never insert payments directly.
--   * Users can never escalate their own role (column-level grants).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type public.member_role as enum ('member', 'coach', 'admin');
create type public.event_kind as enum ('competition', 'workshop');
create type public.event_status as enum ('draft', 'published', 'cancelled');
create type public.registration_status as enum ('pending', 'confirmed', 'cancelled');
create type public.academy_pathway as enum ('Coaching', 'Officiating', 'Athlete Development');
create type public.payment_purpose as enum ('contribution', 'registration', 'booking');
create type public.payment_status as enum ('pending', 'success', 'failed', 'cancelled', 'chargedback');
create type public.contribution_fund as enum ('general', 'youth', 'equipment', 'team_travel');

-- ---------------------------------------------------------------- helpers
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- clubs
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  city text,
  instagram text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 24),
  club_id uuid references public.clubs (id) on delete set null,
  role public.member_role not null default 'member',
  coach_tier text check (coach_tier in ('tier-3', 'tier-2', 'tier-1', 'master')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- security definer so policies can call it without recursive RLS on profiles.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind public.event_kind not null,
  status public.event_status not null default 'draft',
  title text not null,
  body text not null default '',
  venue text,
  starts_at timestamptz,
  fee_lkr numeric(12, 2) not null default 0 check (fee_lkr >= 0),
  capacity int check (capacity > 0),
  categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,               -- sent to PayHere
  purpose public.payment_purpose not null,
  user_id uuid references auth.users (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'LKR' check (currency = 'LKR'),
  recurring boolean not null default false,
  status public.payment_status not null default 'pending',
  provider text not null default 'payhere',
  provider_payment_id text,
  method text,
  status_message text,
  raw_notify jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id);
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- registrations
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text,
  club_id uuid references public.clubs (id) on delete set null,
  waiver_accepted_at timestamptz not null,
  status public.registration_status not null default 'pending',
  payment_id uuid references public.payments (id) on delete set null,
  ticket_code text unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------------------------------------------------------------- contributions
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  fund public.contribution_fund not null default 'general',
  donor_name text not null check (char_length(donor_name) between 2 and 120),
  donor_email text not null check (char_length(donor_email) <= 254),
  donor_phone text check (char_length(donor_phone) <= 24),
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- academy
create table public.academy_interest (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  club text check (char_length(club) <= 120),
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 24),
  pathway public.academy_pathway not null,
  message text check (char_length(message) <= 2000),
  consent_at timestamptz not null default now(),
  handled boolean not null default false,
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

-- ================================================================ RLS
alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.payments enable row level security;
alter table public.event_registrations enable row level security;
alter table public.contributions enable row level security;
alter table public.academy_interest enable row level security;

-- clubs: public read, admin write
create policy clubs_read on public.clubs for select to anon, authenticated using (true);
create policy clubs_admin on public.clubs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- events: published are public; admins see and write everything
create policy events_read on public.events for select to anon, authenticated
  using (status <> 'draft' or (select public.is_admin()));
create policy events_admin on public.events for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- profiles: own row (read/update), admins read all
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Column-level: users may only change these fields (not role / coach_tier).
revoke update on public.profiles from authenticated;
grant update (full_name, phone, club_id) on public.profiles to authenticated;

-- payments / registrations / contributions: owners read, server writes
create policy payments_own on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy registrations_own on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy contributions_own on public.contributions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- academy_interest: no client access at all except admins reading/marking handled
create policy academy_admin_read on public.academy_interest for select to authenticated
  using ((select public.is_admin()));
create policy academy_admin_update on public.academy_interest for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Defence in depth: clients never write money/identity tables directly.
revoke insert, update, delete on public.payments, public.event_registrations, public.contributions from anon, authenticated;
revoke insert, delete on public.academy_interest from anon, authenticated;
revoke all on public.academy_interest from anon;
