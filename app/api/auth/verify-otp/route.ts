import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authOtpStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and verification code are required.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const cleanOtp = String(otp).trim();

    const record = authOtpStore[cleanPhone];

    if (!record) {
      return NextResponse.json({ error: 'No active OTP request found for this phone number. Please request a new code.' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      delete authOtpStore[cleanPhone];
      return NextResponse.json({ error: 'The verification code has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        delete authOtpStore[cleanPhone];
        return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new verification code.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    // OTP match! Mark as verified
    record.verified = true;

    // Update Supabase profile if authenticated
    const supabase = await createClient();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('profiles')
          .update({
            phone: cleanPhone,
            is_phone_verified: true,
            phone_otp: null,
          })
          .eq('id', userData.user.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully! Welcome to Ride With Me.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'OTP verification failed.' }, { status: 500 });
  }
}
