import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailOtpStore, authOtpStore } from '@/lib/rides-store';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, otp } = await request.json();

    if (!otp) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const cleanOtp = String(otp).trim();

    // Verify Email OTP
    if (email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      const record = emailOtpStore[cleanEmail];

      // 1. Check in-memory store
      let isMatch = false;
      if (record && Date.now() <= record.expiresAt && record.otp === cleanOtp) {
        isMatch = true;
      }

      // 2. Also check with Supabase Auth verifyOtp (which handles the Supabase email code)
      const supabase = await createClient();
      if (supabase) {
        try {
          const { data: sbVerifyData, error: sbVerifyErr } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanOtp,
            type: 'email',
          });
          if (!sbVerifyErr && sbVerifyData?.user) {
            isMatch = true;
          }
        } catch {}
      }

      // 3. Fallback check on profiles table
      if (!isMatch && supabase) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email_otp, email_otp_expires_at')
            .eq('email', cleanEmail)
            .single();

          if (
            profile?.email_otp === cleanOtp &&
            (!profile.email_otp_expires_at || new Date(profile.email_otp_expires_at).getTime() > Date.now())
          ) {
            isMatch = true;
          }
        } catch {}
      }

      if (!isMatch) {
        if (record) {
          record.attempts = (record.attempts || 0) + 1;
          if (record.attempts >= 5) {
            delete emailOtpStore[cleanEmail];
            return NextResponse.json(
              { error: 'Too many incorrect attempts. Please request a new verification code.' },
              { status: 400 }
            );
          }
        }
        return NextResponse.json(
          { error: 'Invalid or expired verification code. Please check your email inbox and try again.' },
          { status: 400 }
        );
      }

      // Valid OTP: Invalidate record and mark verified
      if (record) {
        record.verified = true;
        delete emailOtpStore[cleanEmail];
      }

      // Update Supabase profile
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase
            .from('profiles')
            .update({
              email: cleanEmail,
              is_email_verified: true,
              email_otp: null,
            })
            .eq('id', userData.user.id);
        }
      }

      return NextResponse.json({
        success: true,
        email: cleanEmail,
        isVerified: true,
        message: 'Email verified successfully! ✓',
      });
    }

    // Fallback: Verify Mobile OTP
    if (phone && typeof phone === 'string') {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const record = authOtpStore[cleanPhone];

      if (!record) {
        return NextResponse.json(
          { error: 'No active OTP request found for this phone number. Please request a new code.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        delete authOtpStore[cleanPhone];
        return NextResponse.json(
          { error: 'The verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (record.otp !== cleanOtp) {
        record.attempts += 1;
        if (record.attempts >= 5) {
          delete authOtpStore[cleanPhone];
          return NextResponse.json(
            { error: 'Too many incorrect attempts. Please request a new verification code.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Invalid verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      delete authOtpStore[cleanPhone];

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
        message: 'Mobile number verified successfully!',
      });
    }

    return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'OTP verification failed.' }, { status: 500 });
  }
}
