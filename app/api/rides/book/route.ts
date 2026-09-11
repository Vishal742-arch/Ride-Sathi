import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDodoCheckoutSession } from '@/lib/dodo';
import { calculateRoadRoute, calculateFare, LocationPoint } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const {
      rideId,
      seats = 1,
      paymentMethod = 'UPI',
      passengerName,
      passengerEmail,
      passengerPhone,
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
          status: 'PENDING_PAYMENT',
          booking_final_fare: fareAmount,
        });
      }
    }

    // Create Dodo Payments checkout session (server-side only)
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/find?booking=${bookingId}`;

    const dodoSession = await createDodoCheckoutSession({
      amountInINR: fareAmount,
      rideId,
      passengerEmail: userEmail,
      passengerName: passengerName || 'Ride Sathi Commuter',
      returnUrl,
    });

    if (!dodoSession.checkoutUrl) {
      return NextResponse.json({ error: 'Failed to create payment checkout session with provider.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bookingId,
      rideId,
      tripPin,
      fareAmount,
      paymentMethod,
      checkoutUrl: dodoSession.checkoutUrl,
      paymentId: dodoSession.paymentId,
      isMockPayment: dodoSession.isMock,
    });
  } catch (err: any) {
    console.error('[Book API] Error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Booking failed. Please try again.' }, { status: 500 });
  }
}
