import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bookingsStore, publishedRidesStore } from '@/lib/rides-store';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    let dbCommutes: any[] = [];
    let dbAvailableRides: any[] = [];
    let currentUser: any = null;

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      currentUser = userData?.user || null;

      if (currentUser) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*, rides(*)')
          .eq('passenger_id', currentUser.id)
          .in('status', ['CONFIRMED', 'VERIFIED', 'IN_PROGRESS', 'PENDING'])
          .order('created_at', { ascending: false });

        if (bookingsData && bookingsData.length > 0) {
          dbCommutes = bookingsData.map((b: any) => ({
            id: b.id,
            rideId: b.ride_id,
            origin: b.rides?.origin || 'Pickup Location',
            destination: b.rides?.destination || 'Destination Location',
            departureTime: b.rides?.departure_time ? new Date(b.rides.departure_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Today',
            vehicle: b.rides?.vehicle_kind === 'BIKE' ? 'Bike' : 'Car',
            fareAmount: b.booking_final_fare || 80,
            seats: b.seats || 1,
            status: b.status,
            tripPin: b.booking_otp,
            bookingOtp: b.booking_otp,
          }));
        }
      }

      const { data: ridesData } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'PUBLISHED')
        .gt('available_seats', 0)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ridesData && ridesData.length > 0) {
        dbAvailableRides = ridesData.map((r: any) => ({
          id: r.id,
          origin: r.origin,
          destination: r.destination,
          departureTime: new Date(r.departure_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
          postedAt: r.created_at,
          pricePerSeat: r.price_per_seat || 80,
          vehicle: r.vehicle_kind === 'BIKE' ? 'Bike' : 'Car',
          availableSeats: r.available_seats,
          driver: {
            name: 'Verified Driver',
            rating: null,
            completedRides: 0,
            isPhoneVerified: true,
            isIdentityVerified: true,
            isDriverVerified: true,
          },
        }));
      }
    }

    // Combine with active in-memory stores
    const inMemoryCommutes = bookingsStore
      .filter(b => b.status !== 'CANCELLED')
      .map(b => ({
        id: b.id,
        rideId: b.ride_id,
        origin: b.origin,
        destination: b.destination,
        departureTime: b.departure_time,
        vehicle: b.vehicle,
        fareAmount: b.fareAmount,
        seats: b.seats,
        status: b.status,
        tripPin: b.booking_otp,
        bookingOtp: b.booking_otp,
      }));

    const inMemoryAvailableRides = publishedRidesStore
      .filter(r => r.status === 'PUBLISHED' && r.available_seats > 0)
      .map(r => ({
        id: r.id,
        origin: r.origin,
        destination: r.destination,
        departureTime: r.departure_time,
        postedAt: r.postedAt || r.created_at,
        pricePerSeat: r.price_per_seat,
        vehicle: r.vehicle,
        availableSeats: r.available_seats,
        driver: {
          name: r.driver_name,
          rating: r.driver_rating || null,
          completedRides: 0,
          isPhoneVerified: true,
          isIdentityVerified: true,
          isDriverVerified: r.is_verified,
        },
      }));

    const upcomingCommutes = [...inMemoryCommutes, ...dbCommutes];
    const availableRides = [...inMemoryAvailableRides, ...dbAvailableRides];

    return NextResponse.json({
      user: currentUser
        ? {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
          }
        : null,
      upcomingCommutes,
      availableRides,
      trustedDrivers: [],
      verifiedPartners: [],
      recentActivity: [],
    });
  } catch (err: any) {
    return NextResponse.json({
      user: null,
      upcomingCommutes: [],
      availableRides: [],
      trustedDrivers: [],
      verifiedPartners: [],
      recentActivity: [],
    });
  }
}
