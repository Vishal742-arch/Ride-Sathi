-- Migration 005: Verified Partners and User Activity Logging

-- 1. Create Verified Partners Table
create table if not exists public.verified_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  category text,
  is_active boolean not null default true,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. Create User Activity Log Table
create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- 3. Enable Row-Level Security
alter table public.verified_partners enable row level security;
alter table public.user_activity enable row level security;

-- 4. RLS Policies
create policy "public active verified partners" on public.verified_partners for select using (is_active = true);
create policy "users see own activity logs" on public.user_activity for select using (auth.uid() = user_id);
create policy "users insert own activity logs" on public.user_activity for insert with check (auth.uid() = user_id);

-- 5. Indexes
create index if not exists user_activity_user_created_idx on public.user_activity(user_id, created_at desc);
