import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishedRidesStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { fromLocation, toLocation, departureTime, vehicleKind, seatsAvailable, pricePerSeat } = await request.json();

    if (!fromLocation || !toLocation) {
      return NextResponse.json({ error: 'Pickup location and destination are required.' }, { status: 400 });
    }

    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const formattedDeparture = departureTime
      ? new Date(departureTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
      : 'Today, 08:30 AM';

    // Authenticate user: Only registered and logged-in users can offer a ride
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable. Please try again.' }, { status: 503 });
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: 'Authentication required. Please log in to offer a ride.' }, { status: 401 });
    }

    const driverId = userData.user.id;
    const driverName =
      userData.user.user_metadata?.display_name ||
      userData.user.user_metadata?.full_name ||
      userData.user.email?.split('@')[0] ||
      'Verified Driver';

    // Validate seats
    const seatsNum = Number(seatsAvailable);
    const maxSeats = vehicleKind === 'BIKE' ? 1 : 4;
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > maxSeats) {
      return NextResponse.json(
        { error: `Invalid seat count. For ${vehicleKind || 'CAR'}, seats must be between 1 and ${maxSeats}.` },
        { status: 400 }
      );
    }

    // Validate price per seat
    const priceNum = Number(pricePerSeat);
    if (isNaN(priceNum) || priceNum <= 0 || priceNum > 5000) {
      return NextResponse.json({ error: 'Price per seat must be a positive amount up to ₹5000.' }, { status: 400 });
    }

    // Validate departure time: cannot be in the past
    const depDate = departureTime ? new Date(departureTime) : new Date();
    if (isNaN(depDate.getTime())) {
      return NextResponse.json({ error: 'Invalid departure time format.' }, { status: 400 });
    }
    if (depDate.getTime() < Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Departure time cannot be in the past.' }, { status: 400 });
    }

    await supabase.from('rides').insert({
      id: rideId,
      driver_id: driverId,
      origin: fromLocation,
      destination: toLocation,
      vehicle_kind: vehicleKind || 'CAR',
      available_seats: seatsNum,
      price_per_seat: priceNum,
      departure_time: depDate.toISOString(),
      status: 'PUBLISHED',
    });

    const newRide = {
      id: rideId,
      driver_name: driverName,
      driver_rating: 5.0,
      vehicle: vehicleKind === 'BIKE' ? 'Bike' : 'Car',
      origin: fromLocation,
      destination: toLocation,
      departure_time: formattedDeparture,
      available_seats: Number(seatsAvailable) || 3,
      price_per_seat: Number(pricePerSeat) || 80,
      is_verified: true,
      created_at: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    // Add to active published rides store so it lists instantly across all search queries
    publishedRidesStore.unshift(newRide);

    return NextResponse.json({
      success: true,
      rideId,
      message: `Your ride from ${fromLocation} to ${toLocation} is now published live! Passengers can search and book seats immediately.`,
      ride: newRide,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
