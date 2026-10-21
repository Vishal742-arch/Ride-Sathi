import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bookingsStore, publishedRidesStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, action, rating, reviewText } = await request.json();

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'bookingId and action are required.' }, { status: 400 });
    }

    // Supported actions: 'START_RIDE', 'COMPLETE_RIDE', 'CONFIRM_PAYMENT', 'SUBMIT_RATING'
    const allowedActions = ['START_RIDE', 'COMPLETE_RIDE', 'CONFIRM_PAYMENT', 'SUBMIT_RATING'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    const supabase = await createClient();
    const nowIso = new Date().toISOString();

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*, rides(*)')
        .eq('id', bookingId)
        .single();

      if (!fetchErr && booking) {
        if (booking.status === 'CANCELLED') {
          return NextResponse.json({ error: 'This booking has been cancelled.' }, { status: 400 });
        }

        if (action === 'START_RIDE') {
          if (booking.status !== 'VERIFIED' && booking.status !== 'CONFIRMED') {
            return NextResponse.json({ error: 'Passenger boarding must be confirmed before starting ride.' }, { status: 400 });
          }
          await supabase.from('bookings').update({ status: 'IN_PROGRESS' }).eq('id', bookingId);
          await supabase.from('rides').update({ status: 'STARTED' }).eq('id', booking.ride_id);
          return NextResponse.json({ success: true, message: 'Ride is now in progress.', status: 'IN_PROGRESS' });
        }

        if (action === 'COMPLETE_RIDE') {
          if (booking.status !== 'IN_PROGRESS' && booking.status !== 'VERIFIED') {
            return NextResponse.json({ error: 'Ride must be verified and started before completion.' }, { status: 400 });
          }
          await supabase.from('bookings').update({ status: 'COMPLETED' }).eq('id', bookingId);
          await supabase.from('rides').update({ status: 'COMPLETED' }).eq('id', booking.ride_id);
          return NextResponse.json({ success: true, message: 'Ride marked as completed.', status: 'COMPLETED' });
        }

        if (action === 'CONFIRM_PAYMENT') {
          // Driver confirms direct payment received at pickup/drop
          await supabase.from('bookings').update({ payment_status: 'PAID' }).eq('id', bookingId);
          return NextResponse.json({ success: true, message: 'Direct payment confirmed as received.', paymentStatus: 'PAID' });
        }

        if (action === 'SUBMIT_RATING') {
          if (booking.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Ratings can only be submitted after ride is completed.' }, { status: 400 });
          }
          const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
          await supabase.from('reviews').insert({
            ride_id: booking.ride_id,
            reviewer_id: currentUserId || booking.passenger_id,
            rating: numRating,
            comment: reviewText || 'Smooth and pleasant carpool trip.',
          });
          return NextResponse.json({ success: true, message: 'Thank you for rating your ride!', rating: numRating });
        }
      }
    }

    // In-memory fallback
    const memBooking = bookingsStore.find(b => b.id === bookingId);
    if (!memBooking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (action === 'START_RIDE') {
      memBooking.status = 'IN_PROGRESS';
      return NextResponse.json({ success: true, message: 'Ride is now in progress.', status: 'IN_PROGRESS' });
    }

    if (action === 'COMPLETE_RIDE') {
      memBooking.status = 'COMPLETED';
      return NextResponse.json({ success: true, message: 'Ride marked as completed.', status: 'COMPLETED' });
    }

    if (action === 'CONFIRM_PAYMENT') {
      return NextResponse.json({ success: true, message: 'Direct payment confirmed as received.', paymentStatus: 'PAID' });
    }

    if (action === 'SUBMIT_RATING') {
      return NextResponse.json({ success: true, message: 'Rating recorded. Thank you!', rating: Number(rating) || 5 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lifecycle update failed.' }, { status: 500 });
  }
}
