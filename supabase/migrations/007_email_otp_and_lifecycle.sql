-- Migration 007: Email OTP, Complete Booking PIN, and Lifecycle Direct Payment
-- Run this in Supabase SQL Editor if running with active database instance

-- 1. Extend profiles with Email OTP verification fields
alter table public.profiles
  add column if not exists is_email_verified boolean not null default false,
  add column if not exists email_otp text,
  add column if not exists email_otp_expires_at timestamptz,
  add column if not exists email_otp_attempts integer not null default 0;

-- 2. Extend bookings with direct payment tracking and booking references
alter table public.bookings
  add column if not exists booking_reference text,
  add column if not exists payment_method text default 'DIRECT_CASH',
  add column if not exists payment_status text default 'NOT_PAID',
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references auth.users(id);

-- 3. Create reviews table for post-ride driver rating
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Enable RLS on reviews
alter table public.reviews enable row level security;

create policy "Anyone can read ride reviews"
  on public.reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);
