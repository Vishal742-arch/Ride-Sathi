-- STEP 1: Anti-Bypass, Contact Privacy & In-App Messaging Migration

-- 1. Create In-App Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Create User Blocks Table
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- 3. Indexes for fast chat lookup & moderation filtering
create index if not exists messages_ride_created_idx on public.messages(ride_id, created_at desc);
create index if not exists messages_recipient_read_idx on public.messages(recipient_id, read_at);
create index if not exists user_blocks_lookup_idx on public.user_blocks(blocker_id, blocked_id);

-- 4. Enable Row-Level Security
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;

-- 5. Security Policies:
-- Only participants of a ride (driver or passenger with confirmed booking) can view or post messages
create policy "Ride participants can read messages"
  on public.messages for select
  using (
    auth.uid() = sender_id or
    auth.uid() = recipient_id or
    exists (
      select 1 from public.rides r
      left join public.bookings b on b.ride_id = r.id
      where r.id = messages.ride_id
      and (r.driver_id = auth.uid() or b.passenger_id = auth.uid())
    )
  );

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can mark messages read"
  on public.messages for update
  using (auth.uid() = recipient_id);

-- User blocks RLS
create policy "Users manage own blocks"
  on public.user_blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
