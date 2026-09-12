import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRoadRoute, calculateFare, LocationPoint } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const {
      rideId,
      seats = 1,
      passengerName,
      passengerEmail,
      pickupCoords,
      dropCoords,
      vehicleType = 'CAR',
    } = await request.json();

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required.' }, { status: 400 });
    }

    const tripPin = Math.floor(1000 + Math.random() * 9000).toString();
    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Authoritative Server-side Route & Fare Calculation
    let fareAmount = 80 * Number(seats);

    if (pickupCoords?.latitude && dropCoords?.latitude) {
      try {
        const originPoint: LocationPoint = {
          latitude: Number(pickupCoords.latitude),
          longitude: Number(pickupCoords.longitude),
          placeName: pickupCoords.placeName || 'Pickup Location',
          formattedAddress: pickupCoords.formattedAddress || 'Pickup Location',
          city: pickupCoords.city || 'Indore',
        };
        const destPoint: LocationPoint = {
          latitude: Number(dropCoords.latitude),
          longitude: Number(dropCoords.longitude),
          placeName: dropCoords.placeName || 'Drop Location',
          formattedAddress: dropCoords.formattedAddress || 'Drop Location',
          city: dropCoords.city || 'Indore',
        };

        const routeInfo = await calculateRoadRoute(originPoint, destPoint);
        const fareCalc = calculateFare(routeInfo.distanceKm, vehicleType === 'BIKE' ? 'BIKE' : 'CAR');
        fareAmount = Math.max(20, Math.round(fareCalc.fareAmount * Number(seats)));
      } catch (err) {
        console.warn('[Book API] Server route verification warning:', err);
      }
    }

    // Get authenticated user (if logged in) for Supabase record
    let authenticatedUserId: string | null = null;
    let userEmail = passengerEmail;
    const supabase = await createClient();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        authenticatedUserId = userData.user.id;
        userEmail = userEmail || userData.user.email;

        await supabase.from('bookings').insert({
          id: bookingId,
          ride_id: rideId,
          passenger_id: authenticatedUserId,
          seats: Number(seats),
          status: 'CONFIRMED',
          booking_final_fare: fareAmount,
        });
      }
    }

    // Log booking (server-side only — no payment gateway involved)
    console.log(`[Book API] Booking confirmed: ${bookingId}, fare: ₹${fareAmount}, passenger: ${passengerName || userEmail || 'Anonymous'}`);

    return NextResponse.json({
      success: true,
      bookingId,
      rideId,
      tripPin,
      fareAmount,
    });
  } catch (err: any) {
    console.error('[Book API] Error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Booking failed. Please try again.' }, { status: 500 });
  }
}
