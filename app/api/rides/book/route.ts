import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBooking, publishedRidesStore, emailOtpStore } from '@/lib/rides-store';
import { calculateRoadRoute, calculateFare, LocationPoint } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const {
      rideId,
      seats = 1,
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

    const requestedSeats = Number(seats) > 0 ? Number(seats) : 1;

    // Validate passenger name
    if (!passengerName || typeof passengerName !== 'string' || !passengerName.trim()) {
      return NextResponse.json({ error: 'Please enter a valid passenger name.' }, { status: 400 });
    }

    // Get user from Supabase if logged in
    const supabase = await createClient();
    let currentUser: any = null;
    let passengerId = 'anon_passenger';
    let finalPassengerName = passengerName.trim();
    let finalPassengerEmail = passengerEmail?.trim()?.toLowerCase() || '';

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      currentUser = userData?.user || null;
      if (currentUser) {
        passengerId = currentUser.id;
        if (!finalPassengerEmail) {
          finalPassengerEmail = currentUser.email?.toLowerCase() || '';
        }
      }
    }

    // Check email verification requirement:
    // If passenger is logged in and email_confirmed_at is present, or email is verified via emailOtpStore
    const isEmailVerified =
      (currentUser && (currentUser.email_confirmed_at || currentUser.user_metadata?.email_verified)) ||
      (finalPassengerEmail && emailOtpStore[finalPassengerEmail]?.verified);

    // Calculate authoritative fare
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
        const fareCalc = calculateFare(routeInfo.distanceKm, vehicleType === 'BIKE' ? 'BIKE' : 'CAR', requestedSeats);
        totalFare = Math.max(20, Math.round(fareCalc.fareAmount));
      } catch (err) {
        console.warn('[Book API] Route verification warning:', err);
      }
    } else {
      // Find ride in publishedRidesStore or Supabase database to get price per seat
      const foundRide = publishedRidesStore.find(r => r.id === rideId);
      if (foundRide) {
        totalFare = foundRide.price_per_seat * requestedSeats;
      } else if (supabase) {
        const { data: dbRide } = await supabase.from('rides').select('*').eq('id', rideId).single();
        if (dbRide) {
          totalFare = (dbRide.price_per_seat || 80) * requestedSeats;
          publishedRidesStore.unshift({
            id: dbRide.id,
            driver_name: 'Verified Driver',
            driver_rating: 4.9,
            vehicle: dbRide.vehicle_kind === 'BIKE' ? 'Bike' : 'Car',
            origin: dbRide.origin,
            destination: dbRide.destination,
            departure_time: new Date(dbRide.departure_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
            available_seats: dbRide.available_seats,
            price_per_seat: dbRide.price_per_seat || 80,
            is_verified: true,
            created_at: dbRide.created_at || new Date().toISOString(),
          });
        }
      }
    }

    // Try DB atomic transaction RPC if connected to Supabase
    const generatedBoardingPin = Math.floor(100000 + Math.random() * 900000).toString();

    if (supabase && currentUser) {
      const { data: dbBookingRes, error: rpcErr } = await supabase.rpc('book_ride_seats', {
        p_ride_id: rideId,
        p_passenger_id: passengerId,
        p_seats: requestedSeats,
        p_fare: totalFare,
        p_otp: generatedBoardingPin,
        p_passenger_name: finalPassengerName,
        p_passenger_phone: passengerPhone || null,
      });

      if (!rpcErr && dbBookingRes && dbBookingRes.success) {
        return NextResponse.json({
          success: true,
          bookingId: dbBookingRes.booking_id,
          bookingReference: `RWM-${String(dbBookingRes.booking_id).slice(0, 8).toUpperCase()}`,
          rideId,
          boardingPin: dbBookingRes.otp,
          bookingOtp: dbBookingRes.otp,
          fareAmount: totalFare,
          seats: requestedSeats,
          passengerName: finalPassengerName,
          passengerEmail: finalPassengerEmail,
          paymentMethod: 'DIRECT_CASH',
          paymentStatus: 'NOT_PAID',
          status: 'CONFIRMED',
          isEmailVerified: !!isEmailVerified,
        });
      }
    }

    // Atomic in-memory booking store execution
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

    const bookingRef = `RWM-${result.booking.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      bookingId: result.booking.id,
      bookingReference: bookingRef,
      rideId,
      boardingPin: result.booking.booking_otp,
      bookingOtp: result.booking.booking_otp,
      fareAmount: result.booking.fareAmount,
      seats: result.booking.seats,
      passengerName: result.booking.passenger_name,
      passengerEmail: finalPassengerEmail,
      paymentMethod: 'DIRECT_CASH',
      paymentStatus: 'NOT_PAID',
      status: result.booking.status,
      booking: result.booking,
      isEmailVerified: !!isEmailVerified,
    });
  } catch (err: any) {
    console.error('[Book API] Error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Booking failed. Please try again.' }, { status: 500 });
  }
}
