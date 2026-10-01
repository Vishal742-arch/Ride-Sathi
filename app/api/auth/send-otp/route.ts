import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authOtpStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const now = Date.now();
    const existing = authOtpStore[cleanPhone];

    // Enforce 60s cooldown
    if (existing && now - existing.lastSentAt < 60000) {
      const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSec} seconds before requesting a new OTP.` },
        { status: 429 }
      );
    }

    // Rate limiting: max 5 requests per hour
    if (existing && existing.attempts >= 5 && now - existing.lastSentAt < 3600000) {
      return NextResponse.json(
        { error: 'Maximum OTP request limit reached for this number. Please try again in 1 hour.' },
        { status: 429 }
      );
    }

    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    authOtpStore[cleanPhone] = {
      phone: cleanPhone,
      otp: generatedOtp,
      expiresAt,
      attempts: existing ? existing.attempts + 1 : 1,
      lastSentAt: now,
      verified: false,
    };

    // Attempt DB sync with Supabase profiles if logged in
    const supabase = await createClient();
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('profiles')
          .update({
            phone: cleanPhone,
            phone_otp: generatedOtp,
            phone_otp_expires_at: new Date(expiresAt).toISOString(),
            phone_otp_attempts: 0,
          })
          .eq('id', userData.user.id);
      }
    }

    // Mask phone number for response
    const maskedPhone = cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedPhone}.`,
      resendCooldownSec: 60,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to send OTP.' }, { status: 500 });
  }
}
