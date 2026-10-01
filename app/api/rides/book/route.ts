import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBooking, publishedRidesStore } from '@/lib/rides-store';
import { calculateRoadRoute, calculateFare, LocationPoint } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const {
      rideId,
      seats = 1,
      passengerName,
      passengerPhone,
      pickupCoords,
      dropCoords,
      vehicleType = 'CAR',
    } = await request.json();

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required.' }, { status: 400 });
    }

    const requestedSeats = Number(seats) > 0 ? Number(seats) : 1;

    // Calculate fare
    let totalFare = 80 * requestedSeats;
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
        totalFare = Math.max(20, Math.round(fareCalc.fareAmount * requestedSeats));
      } catch (err) {
        console.warn('[Book API] Route verification warning:', err);
      }
    } else {
      // Find ride in publishedRidesStore to get price per seat
      const foundRide = publishedRidesStore.find(r => r.id === rideId);
      if (foundRide) {
        totalFare = foundRide.price_per_seat * requestedSeats;
      }
    }

    // Get user from Supabase if logged in
    const supabase = await createClient();
    let passengerId = 'anon_passenger';
    let finalPassengerName = passengerName?.trim() || 'Commuter';

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        passengerId = userData.user.id;
        finalPassengerName = passengerName?.trim() ||
          userData.user.user_metadata?.display_name ||
          userData.user.user_metadata?.full_name ||
          userData.user.email?.split('@')[0] ||
          'Verified Passenger';

        // Execute atomic RPC procedure on Supabase database if function exists
        const generatedBookingOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const { data: dbBookingRes, error: rpcErr } = await supabase.rpc('book_ride_seats', {
          p_ride_id: rideId,
          p_passenger_id: passengerId,
          p_seats: requestedSeats,
          p_fare: totalFare,
          p_otp: generatedBookingOtp,
          p_passenger_name: finalPassengerName,
          p_passenger_phone: passengerPhone || null,
        });

        if (!rpcErr && dbBookingRes && dbBookingRes.success) {
          return NextResponse.json({
            success: true,
            bookingId: dbBookingRes.booking_id,
            rideId,
            bookingOtp: dbBookingRes.otp,
            tripPin: dbBookingRes.otp,
            fareAmount: totalFare,
            seats: requestedSeats,
            passengerName: finalPassengerName,
            status: 'CONFIRMED',
          });
        }
      }
    }

    // Execute atomic in-memory booking store
    const result = createBooking({
      rideId,
      seats: requestedSeats,
      passengerName: finalPassengerName,
      passengerPhone,
      passengerId,
      fareAmount: totalFare,
    });

    if (!result.success || !result.booking) {
      return NextResponse.json({ error: result.error || 'Failed to book ride.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bookingId: result.booking.id,
      rideId,
      bookingOtp: result.booking.booking_otp,
      tripPin: result.booking.booking_otp,
      fareAmount: result.booking.fareAmount,
      seats: result.booking.seats,
      passengerName: result.booking.passenger_name,
      status: result.booking.status,
      booking: result.booking,
    });
  } catch (err: any) {
    console.error('[Book API] Error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Booking failed. Please try again.' }, { status: 500 });
  }
}
