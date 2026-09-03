import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDodoCheckoutSession } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const { rideId, seats = 1, paymentMethod = 'UPI', passengerName, passengerPhone } = await request.json();

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required.' }, { status: 400 });
    }

    // Generate random Trip PIN (e.g. 4827)
    const tripPin = Math.floor(1000 + Math.random() * 9000).toString();
    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fareAmount = 80 * Number(seats);

    const supabase = await createClient();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from('bookings').insert({
          ride_id: rideId,
          passenger_id: userData.user.id,
          seats: Number(seats),
          status: 'CONFIRMED',
          booking_final_fare: fareAmount,
        });
      }
    }

    // Initiate Dodo Payments checkout session for UPI/Cards/Netbanking
    const dodoSession = await createDodoCheckoutSession({
      amountInINR: fareAmount,
      rideId,
      passengerName: passengerName || 'Ride Sathi Commuter',
    });

    return NextResponse.json({
      success: true,
      bookingId,
      rideId,
      tripPin,
      fareAmount,
      paymentMethod,
      checkoutUrl: dodoSession.checkoutUrl,
      message: 'Booking confirmed! Use your Trip PIN when boarding the ride.',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
