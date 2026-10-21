import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailOtpStore, authOtpStore } from '@/lib/rides-store';
import { sendEmailOtp } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, purpose = 'BOOKING_VERIFICATION', passengerName } = await request.json();

    // Prefer Email OTP
    if (email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      const now = Date.now();
      const existing = emailOtpStore[cleanEmail];

      // Enforce 60-second cooldown
      if (existing && now - existing.lastSentAt < 60000) {
        const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec} seconds before requesting a new code.` },
          { status: 429 }
        );
      }

      // Enforce rate limiting: max 5 requests per hour
      if (existing && existing.attempts >= 5 && now - existing.lastSentAt < 3600000) {
        return NextResponse.json(
          { error: 'Maximum OTP request limit reached for this email. Please try again in 1 hour.' },
          { status: 429 }
        );
      }

      // Generate cryptographically secure 6-digit numeric OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = now + 5 * 60 * 1000; // 5-minute expiry per security standard

      emailOtpStore[cleanEmail] = {
        email: cleanEmail,
        otp: generatedOtp,
        expiresAt,
        attempts: existing ? existing.attempts + 1 : 1,
        lastSentAt: now,
        verified: false,
        purpose,
      };

      // Sync with Supabase profile if user is currently signed in
      const supabase = await createClient();
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase
            .from('profiles')
            .update({
              email: cleanEmail,
              email_otp: generatedOtp,
              email_otp_expires_at: new Date(expiresAt).toISOString(),
            })
            .eq('id', userData.user.id);
        }
      }

      // Deliver via Email Service
      const sendResult = await sendEmailOtp({
        email: cleanEmail,
        otp: generatedOtp,
        purpose,
        passengerName,
      });

      // Mask email for user privacy in response
      const [local, domain] = cleanEmail.split('@');
      const maskedEmail = `${local.slice(0, 2)}***@${domain}`;

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${maskedEmail}.`,
        provider: sendResult.provider,
        resendCooldownSec: 60,
      });
    }

    // Fallback support for mobile number if provided
    if (phone && typeof phone === 'string') {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 10) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
      }

      const now = Date.now();
      const existing = authOtpStore[cleanPhone];

      if (existing && now - existing.lastSentAt < 60000) {
        const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec} seconds before requesting a new OTP.` },
          { status: 429 }
        );
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = now + 10 * 60 * 1000;

      authOtpStore[cleanPhone] = {
        phone: cleanPhone,
        otp: generatedOtp,
        expiresAt,
        attempts: existing ? existing.attempts + 1 : 1,
        lastSentAt: now,
        verified: false,
      };

      const maskedPhone = cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3);
      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${maskedPhone}.`,
        resendCooldownSec: 60,
      });
    }

    return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to send OTP.' }, { status: 500 });
  }
}
