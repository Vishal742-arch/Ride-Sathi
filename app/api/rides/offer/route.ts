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

    const newRide = {
      id: rideId,
      driver_name: 'You (Driver ✓)',
      driver_rating: 5.0,
      vehicle: vehicleKind === 'BIKE' ? 'Bike' : 'Car',
      origin: fromLocation,
      destination: toLocation,
      departure_time: formattedDeparture,
      available_seats: Number(seatsAvailable) || 3,
      price_per_seat: Number(pricePerSeat) || 80,
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    // Add to active published rides store so it lists instantly across all search queries
    publishedRidesStore.unshift(newRide);

    const supabase = await createClient();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from('rides').insert({
          id: rideId,
          driver_id: userData.user.id,
          available_seats: Number(seatsAvailable) || 3,
          departure_time: new Date(departureTime || Date.now()).toISOString(),
          status: 'PUBLISHED',
        });
      }
    }

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
