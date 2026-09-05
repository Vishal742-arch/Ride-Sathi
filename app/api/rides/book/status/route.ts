import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDodoPayment } from '@/lib/dodo';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId parameter is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ status: 'UNKNOWN' });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, ride_id, seats, booking_final_fare, payment_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify directly with Dodo API if payment_id exists and status is PENDING
    if (booking.payment_id && booking.status === 'PENDING_PAYMENT') {
      try {
        const payment = await getDodoPayment(booking.payment_id);
        if (payment && (payment.status === 'succeeded' || payment.status === 'paid')) {
          await supabase
            .from('bookings')
            .update({ status: 'PAID' })
            .eq('id', bookingId);
          booking.status = 'PAID';
        }
      } catch (e) {
        console.warn('[Status API] Error verifying payment with Dodo:', e);
      }
    }

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      rideId: booking.ride_id,
      seats: booking.seats,
      fareAmount: booking.booking_final_fare,
      paymentId: booking.payment_id,
      isConfirmed: booking.status === 'PAID',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to check status' }, { status: 500 });
  }
}
