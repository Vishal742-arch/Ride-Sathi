-- Migration 006: Complete Booking OTP, Verification & Ride Statuses

-- 1. Extend profiles with phone verification fields
alter table public.profiles 
  add column if not exists phone text,
  add column if not exists is_phone_verified boolean not null default false,
  add column if not exists phone_otp text,
  add column if not exists phone_otp_expires_at timestamptz,
  add column if not exists phone_otp_attempts integer not null default 0;

-- 2. Extend bookings with OTP verification & ride status tracking
alter table public.bookings
  add column if not exists booking_otp text,
  add column if not exists booking_otp_expires_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists otp_attempts integer not null default 0,
  add column if not exists passenger_name text,
  add column if not exists passenger_phone text;

-- Update booking status check or type if needed
-- Standard statuses: PENDING, CONFIRMED, VERIFIED, IN_PROGRESS, COMPLETED, CANCELLED

-- 3. Extend rides with departure details & vehicle registration
alter table public.rides
  add column if not exists vehicle_number text,
  add column if not exists vehicle_name text;

-- 4. Create function to atomically book seats
create or replace function public.book_ride_seats(
  p_ride_id uuid,
  p_passenger_id uuid,
  p_seats integer,
  p_fare numeric,
  p_otp text,
  p_passenger_name text default null,
  p_passenger_phone text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_available integer;
  v_status text;
  v_booking_id uuid;
begin
  -- Select ride with lock
  select available_seats, status into v_available, v_status
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Ride not found.');
  end if;

  if v_status != 'PUBLISHED' then
    return jsonb_build_object('success', false, 'error', 'Ride is not available for booking.');
  end if;

  if v_available < p_seats then
    return jsonb_build_object('success', false, 'error', 'Not enough available seats.');
  end if;

  -- Create booking
  insert into public.bookings (
    ride_id,
    passenger_id,
    seats,
    status,
    booking_final_fare,
    booking_otp,
    booking_otp_expires_at,
    passenger_name,
    passenger_phone
  ) values (
    p_ride_id,
    p_passenger_id,
    p_seats,
    'CONFIRMED',
    p_fare,
    p_otp,
    now() + interval '24 hours',
    p_passenger_name,
    p_passenger_phone
  )
  returning id into v_booking_id;

  -- Update available seats
  update public.rides
  set available_seats = available_seats - p_seats,
      booked_seats = booked_seats + p_seats,
      status = case when available_seats - p_seats = 0 then 'FULL'::public.ride_state else 'PUBLISHED'::public.ride_state end
  where id = p_ride_id;

  return jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'fare', p_fare,
    'otp', p_otp
  );
end;
$$;
