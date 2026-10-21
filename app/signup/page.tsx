'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { ShieldCheck, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request Email OTP
  const handleSendEmailOtp = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address first.');
      return;
    }
    setMessage('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          passengerName: fullName.trim() || 'Commuter',
          purpose: 'REGISTRATION',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Failed to send verification code.');
        return;
      }
      setOtpSent(true);
      setCooldown(60);
      setMessage(data.message || 'Verification code sent to your email address.');
    } catch {
      setMessage('Network error sending verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setMessage('Please enter the 6-digit verification code.');
      return;
    }
    setMessage('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Invalid verification code.');
        return;
      }
      setOtpVerified(true);
      setMessage('Email verified successfully! ✓');
    } catch {
      setMessage('Network error verifying code.');
    } finally {
      setOtpLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpVerified) {
      setMessage('Please verify your email address with the 6-digit code before completing registration.');
      return;
    }
    setLoading(true);
    setMessage('');
    trackEvent('signup_started');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || undefined,
            is_email_verified: true,
            role,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        trackEvent('signup_completed');
        setMessage('Account created & verified! Redirecting to your dashboard…');
        setTimeout(() => (window.location.href = '/dashboard'), 1000);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!loginError) {
        setMessage('Account created & verified! Redirecting…');
        setTimeout(() => (window.location.href = '/dashboard'), 1000);
        return;
      }

      setMessage('Account created! Redirecting to login…');
      setTimeout(() => (window.location.href = '/login'), 1500);
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <main className="finder-page">
      <div className="shell finder">
        <form onSubmit={handleSubmit} className="find-card" style={{ maxWidth: 480, margin: '0 auto', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#087c64', fontWeight: 800, fontSize: 12 }}>
            <ShieldCheck size={18} /> RIDE WITH ME VERIFIED ACCOUNT
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>Create your account</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 8px' }}>Register to book or offer rides across Indore, Dewas, and Ujjain.</p>

          <label>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>FULL NAME</span>
            <div className="find-input" style={{ borderRadius: 12 }}>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Arjun Singh"
              />
            </div>
          </label>

          {/* Email Address & Email OTP Verification */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'grid', gap: 12 }}>
            <label style={{ margin: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#087c64', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} /> EMAIL ADDRESS (FOR 6-DIGIT OTP)
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <div className="find-input" style={{ flex: 1, borderRadius: 10 }}>
                  <input
                    required
                    type="email"
                    disabled={otpVerified}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={otpLoading || cooldown > 0}
                    style={{
                      background: cooldown > 0 ? '#cbd5e1' : '#087c64',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '0 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cooldown > 0 ? `Resend (${cooldown}s)` : 'Send OTP'}
                  </button>
                )}
              </div>
            </label>

            {otpSent && !otpVerified && (
              <div style={{ display: 'grid', gap: 8, paddingTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <KeyRound size={14} /> ENTER 6-DIGIT EMAIL CODE
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="find-input" style={{ flex: 1, borderRadius: 10 }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="6-digit code"
                      style={{ letterSpacing: 4, fontWeight: 800 }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    style={{
                      background: otpCode.length === 6 ? '#087c64' : '#cbd5e1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '0 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {otpLoading ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {otpVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Email verified successfully
              </div>
            )}
          </div>

          <label>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>PASSWORD</span>
            <div className="find-input" style={{ borderRadius: 12 }}>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
          </label>

          <label>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>PHONE NUMBER (OPTIONAL)</span>
            <div className="find-input" style={{ borderRadius: 12 }}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
          </label>

          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>ACCOUNT ROLE</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setRole('viewer')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: role === 'viewer' ? '2px solid #087c64' : '1px solid #cbd5e1',
                  background: role === 'viewer' ? '#f0fdf4' : '#fff',
                  color: role === 'viewer' ? '#087c64' : '#475569',
                  cursor: 'pointer',
                }}
              >
                Passenger / Commuter
              </button>
              <button
                type="button"
                onClick={() => setRole('driver')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: role === 'driver' ? '2px solid #087c64' : '1px solid #cbd5e1',
                  background: role === 'driver' ? '#f0fdf4' : '#fff',
                  color: role === 'driver' ? '#087c64' : '#475569',
                  cursor: 'pointer',
                }}
              >
                Driver / Vehicle Owner
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !otpVerified}
            className="search-button"
            style={{
              marginTop: 8,
              background: !otpVerified ? '#cbd5e1' : undefined,
              cursor: !otpVerified ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          {message && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                color: message.includes('✓') || message.includes('success') ? '#166534' : '#dc2626',
                margin: 0,
              }}
            >
              {message}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
            <span>Already have an account?</span>
            <Link href="/login" style={{ color: '#087c64', fontWeight: 700 }}>
              Log in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
