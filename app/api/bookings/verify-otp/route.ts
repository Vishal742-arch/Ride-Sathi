import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyBookingOtp, bookingsStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, otp } = await request.json();

    if (!bookingId || !otp) {
      return NextResponse.json(
        { error: 'Booking ID and 6-digit Boarding PIN are required.' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();

    // Check Supabase database first
    const supabase = await createClient();
    if (supabase) {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*, rides(*)')
        .eq('id', bookingId)
        .single();

      if (!fetchErr && booking) {
        if (booking.status === 'CANCELLED') {
          return NextResponse.json(
            { error: 'This booking has been cancelled and cannot be boarded.' },
            { status: 400 }
          );
        }

        if (booking.status === 'VERIFIED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
          return NextResponse.json(
            { error: 'This passenger boarding PIN has already been verified.' },
            { status: 400 }
          );
        }

        // Rate limit attempts
        const attempts = (booking.otp_attempts || 0) + 1;
        if (attempts > 5) {
          return NextResponse.json(
            { error: 'Too many incorrect PIN attempts. Verification is locked for security.' },
            { status: 429 }
          );
        }

        // Check PIN match
        if (booking.booking_otp !== cleanOtp) {
          await supabase
            .from('bookings')
            .update({ otp_attempts: attempts })
            .eq('id', bookingId);

          return NextResponse.json(
            { error: 'Invalid Boarding PIN. Please check the code with your passenger.' },
            { status: 400 }
          );
        }

        // Valid PIN: update status to VERIFIED / IN_PROGRESS
        const nowIso = new Date().toISOString();
        const { error: updateErr } = await supabase
          .from('bookings')
          .update({
            status: 'VERIFIED',
            verified_at: nowIso,
            otp_attempts: attempts,
          })
          .eq('id', bookingId);

        // Also update ride status if not already started
        if (booking.rides && booking.rides.status !== 'STARTED' && booking.rides.status !== 'COMPLETED') {
          await supabase
            .from('rides')
            .update({ status: 'STARTED' })
            .eq('id', booking.ride_id);
        }

        if (!updateErr) {
          return NextResponse.json({
            success: true,
            message: 'Passenger verified successfully! Boarding confirmed.',
            status: 'VERIFIED',
            verifiedAt: nowIso,
          });
        }
      }
    }

    // In-memory fallback
    const result = verifyBookingOtp(bookingId, cleanOtp);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      status: 'VERIFIED',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Verification failed.' }, { status: 500 });
  }
}
