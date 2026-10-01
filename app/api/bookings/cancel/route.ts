import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelBooking } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    // Try Supabase DB first
    const supabase = await createClient();
    if (supabase) {
      const { data: booking } = await supabase.from('bookings').select('*, rides(*)').eq('id', bookingId).single();
      if (booking) {
        if (booking.status === 'CANCELLED') {
          return NextResponse.json({ error: 'Booking is already cancelled.' }, { status: 400 });
        }
        await supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', bookingId);
        if (booking.rides) {
          const restoredSeats = booking.rides.available_seats + booking.seats;
          await supabase.from('rides').update({
            available_seats: restoredSeats,
            status: 'PUBLISHED',
          }).eq('id', booking.ride_id);
        }
        return NextResponse.json({ success: true, message: 'Booking cancelled successfully.' });
      }
    }

    // In-memory fallback
    const res = cancelBooking(bookingId);
    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to cancel booking.' }, { status: 500 });
  }
}
