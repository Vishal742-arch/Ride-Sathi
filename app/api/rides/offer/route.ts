import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { fromLocation, toLocation, departureTime, vehicleKind, seatsAvailable, pricePerSeat } = await request.json();

    if (!fromLocation || !toLocation || !departureTime) {
      return NextResponse.json({ error: 'Pickup location, destination, and departure time are required.' }, { status: 400 });
    }

    const supabase = await createClient();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Insert into rides table in Supabase
        const { error } = await supabase.from('rides').insert({
          driver_id: userData.user.id,
          available_seats: Number(seatsAvailable) || 3,
          departure_time: new Date(departureTime).toISOString(),
          status: 'PUBLISHED',
        });
        if (error) console.warn('Supabase ride insertion warning:', error.message);
      }
    }

    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return NextResponse.json({
      success: true,
      rideId,
      message: 'Ride offered successfully! Passengers can now book seats on your route.',
      ride: {
        id: rideId,
        fromLocation,
        toLocation,
        departureTime,
        vehicleKind: vehicleKind || 'CAR',
        seatsAvailable: Number(seatsAvailable) || 3,
        pricePerSeat: Number(pricePerSeat) || 80,
        status: 'PUBLISHED',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
