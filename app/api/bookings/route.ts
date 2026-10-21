import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bookingsStore, publishedRidesStore } from '@/lib/rides-store';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date();

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (user) {
        // Fetch all bookings for this user as passenger
        const { data: passengerBookings, error: pErr } = await supabase
          .from('bookings')
          .select('*, rides(*)')
          .eq('passenger_id', user.id)
          .order('created_at', { ascending: false });

        if (!pErr && passengerBookings) {
          const formatted = passengerBookings.map((b: any) => ({
            id: b.id,
            bookingReference: `RWM-${String(b.id).slice(0, 8).toUpperCase()}`,
            rideId: b.ride_id,
            origin: b.rides?.origin || 'Pickup Location',
            destination: b.rides?.destination || 'Destination Location',
            departureTime: b.rides?.departure_time
              ? new Date(b.rides.departure_time).toLocaleString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                })
              : 'Upcoming',
            vehicle: b.rides?.vehicle_kind === 'BIKE' ? 'Bike' : 'Car',
            fareAmount: b.booking_final_fare || 80,
            seats: b.seats || 1,
            status: b.status,
            boardingPin: b.booking_otp,
            driverName: 'Verified Driver',
            driverVerified: true,
            createdAt: b.created_at,
            paymentMethod: 'Pay Driver Directly (Cash/UPI)',
            paymentStatus: b.payment_status || 'NOT_PAID',
          }));

          return NextResponse.json({ bookings: formatted });
        }
      }
    }

    // In-memory fallback
    const memBookings = bookingsStore.map(b => ({
      id: b.id,
      bookingReference: `RWM-${b.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`,
      rideId: b.ride_id,
      origin: b.origin,
      destination: b.destination,
      departureTime: b.departure_time,
      vehicle: b.vehicle,
      fareAmount: b.fareAmount,
      seats: b.seats,
      status: b.status,
      boardingPin: b.booking_otp,
      driverName: b.driver_name,
      driverVerified: true,
      createdAt: b.created_at,
      paymentMethod: 'Pay Driver Directly (Cash/UPI)',
      paymentStatus: 'NOT_PAID',
    }));

    return NextResponse.json({ bookings: memBookings });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch bookings.' }, { status: 500 });
  }
}
