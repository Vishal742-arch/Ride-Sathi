import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyBookingOtp, bookingsStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, otp } = await request.json();

    if (!bookingId || !otp) {
      return NextResponse.json({ error: 'Booking ID and verification OTP code are required.' }, { status: 400 });
    }

    const cleanOtp = String(otp).trim();

    // Try Supabase database verification first
    const supabase = await createClient();
    if (supabase) {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!fetchErr && booking) {
        if (booking.status === 'CANCELLED') {
          return NextResponse.json({ error: 'This booking has been cancelled and cannot be verified.' }, { status: 400 });
        }
        if (booking.status === 'VERIFIED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
          return NextResponse.json({ error: 'This passenger has already been verified.' }, { status: 400 });
        }
        if (booking.booking_otp !== cleanOtp) {
          return NextResponse.json({ error: 'Invalid verification OTP code.' }, { status: 400 });
        }

        const { error: updateErr } = await supabase
          .from('bookings')
          .update({
            status: 'VERIFIED',
            verified_at: new Date().toISOString(),
          })
          .eq('id', bookingId);

        if (!updateErr) {
          return NextResponse.json({
            success: true,
            message: 'Passenger verified successfully! Boarding confirmed.',
            status: 'VERIFIED',
          });
        }
      }
    }

    // Fallback to in-memory store verification
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
