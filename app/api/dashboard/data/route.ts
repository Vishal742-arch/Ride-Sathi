import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({
        user: null,
        upcomingCommutes: [],
        availableRides: [],
        trustedDrivers: [],
        verifiedPartners: [],
        recentActivity: [],
      });
    }

    // 1. Get authenticated user
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user || null;

    if (!currentUser) {
      return NextResponse.json({
        user: null,
        upcomingCommutes: [],
        availableRides: [],
        trustedDrivers: [],
        verifiedPartners: [],
        recentActivity: [],
      });
    }

    // 2. Query user's real upcoming commutes (bookings with status PAID or CONFIRMED)
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, rides(*)')
      .eq('passenger_id', currentUser.id)
      .in('status', ['PAID', 'CONFIRMED', 'PENDING_PAYMENT'])
      .order('created_at', { ascending: false });

    const upcomingCommutes = (bookingsData || []).map((b: any) => ({
      id: b.id,
      rideId: b.ride_id,
      origin: b.rides?.origin || 'Pickup Location',
      destination: b.rides?.destination || 'Destination Location',
      departureTime: b.rides?.departure_time || b.created_at,
      vehicle: b.rides?.vehicle || 'Car',
      fareAmount: b.booking_final_fare || 80,
      seats: b.seats || 1,
      status: b.status,
      tripPin: b.trip_pin,
    }));

    // 3. Query real active available rides from DB
    const { data: ridesData } = await supabase
      .from('rides')
      .select('*, drivers(profiles(display_name, avatar_url, phone_verified, identity_verified, driver_verified, total_rides_completed, rating)))')
      .eq('status', 'PUBLISHED')
      .gt('available_seats', 0)
      .order('created_at', { ascending: false })
      .limit(10);

    const availableRides = (ridesData || []).map((r: any) => ({
      id: r.id,
      origin: r.origin,
      destination: r.destination,
      departureTime: r.departure_time,
      postedAt: r.created_at,
      pricePerSeat: r.price_per_seat || 80,
      vehicle: r.vehicle_types?.label || 'Car',
      availableSeats: r.available_seats,
      driver: {
        name: r.drivers?.profiles?.display_name || 'Registered Driver',
        rating: r.drivers?.profiles?.rating ?? null,
        completedRides: r.drivers?.profiles?.total_rides_completed ?? 0,
        isPhoneVerified: !!r.drivers?.profiles?.phone_verified,
        isIdentityVerified: !!r.drivers?.profiles?.identity_verified,
        isDriverVerified: !!r.drivers?.profiles?.driver_verified,
      },
    }));

    // 4. Query genuine verified drivers
    const { data: driversData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, phone_verified, identity_verified, driver_verified, total_rides_completed, rating')
      .or('driver_verified.eq.true,identity_verified.eq.true')
      .limit(6);

    const trustedDrivers = (driversData || []).map((d: any) => ({
      id: d.id,
      name: d.display_name || 'Driver',
      avatarUrl: d.avatar_url,
      rating: d.rating ?? null,
      completedRides: d.total_rides_completed ?? 0,
      isPhoneVerified: !!d.phone_verified,
      isIdentityVerified: !!d.identity_verified,
      isDriverVerified: !!d.driver_verified,
    }));

    // 5. Query genuine verified business partners (institutions/organizations)
    const { data: partnersData } = await supabase
      .from('verified_partners')
      .select('id, name, logo_url, category, verified_at');

    const verifiedPartners = partnersData || [];

    // 6. Query real recent activity for logged-in user
    const { data: activityData } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentActivity = activityData || [];

    return NextResponse.json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
      },
      upcomingCommutes,
      availableRides,
      trustedDrivers,
      verifiedPartners,
      recentActivity,
    });
  } catch (err: any) {
    console.error('[Dashboard Data API] Error:', err?.message || err);
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
