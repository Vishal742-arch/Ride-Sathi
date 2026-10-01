'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { ShieldCheck, Phone, KeyRound, CheckCircle2 } from 'lucide-react';

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

  // Request Mobile OTP
  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) {
      setMessage('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setMessage('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Failed to send OTP.');
        return;
      }
      setOtpSent(true);
      setCooldown(60);
      setMessage(data.message || 'OTP code sent to your mobile number.');
    } catch {
      setMessage('Network error sending OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Mobile OTP
  const handleVerifyOtp = async () => {
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
        body: JSON.stringify({ phone: phone.trim(), otp: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Invalid OTP code.');
        return;
      }
      setOtpVerified(true);
      setMessage('Mobile number verified successfully! ✓');
    } catch {
      setMessage('Network error verifying OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpVerified) {
      setMessage('Please verify your mobile number with the OTP code before completing registration.');
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
            phone: phone.trim(),
            is_phone_verified: true,
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
        setMessage('Account created & phone verified! Redirecting to your dashboard…');
        setTimeout(() => (window.location.href = '/dashboard'), 1000);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!loginError) {
        setMessage('Account created & phone verified! Redirecting…');
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
            <ShieldCheck size={18} /> RIDE SATHI VERIFIED ACCOUNT
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

          <label>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>EMAIL ADDRESS</span>
            <div className="find-input" style={{ borderRadius: 12 }}>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
          </label>

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

          {/* Mobile Number & OTP Verification */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'grid', gap: 12 }}>
            <label style={{ margin: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#087c64', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} /> MOBILE NUMBER (FOR 6-DIGIT OTP)
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <div className="find-input" style={{ flex: 1, borderRadius: 10 }}>
                  <input
                    required
                    type="tel"
                    disabled={otpVerified}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                  />
                </div>
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
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
                  <KeyRound size={14} /> ENTER 6-DIGIT OTP CODE
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
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    style={{
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '0 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Verify OTP
                  </button>
                </div>
              </div>
            )}

            {otpVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontSize: 13, fontWeight: 800 }}>
                <CheckCircle2 size={16} /> Mobile Number Verified ✓
              </div>
            )}
          </div>

          <label>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>ACCOUNT TYPE</span>
            <div className="find-input" style={{ borderRadius: 12 }}>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="viewer">Passenger (Find rides)</option>
                <option value="creator">Driver (Offer rides)</option>
              </select>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !otpVerified}
            className="search-button mt-4"
            style={{ borderRadius: 12, background: otpVerified ? '#087c64' : '#94a3b8', cursor: otpVerified ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Creating account...' : 'Create Verified Account'}
          </button>

          {message && <p className="form-note mt-2" role="status" style={{ color: otpVerified ? '#166534' : '#991b1b', fontWeight: 600 }}>{message}</p>}

          <p className="mt-4 text-center text-sm" style={{ color: '#64748b' }}>
            Already a member? <Link href="/login" style={{ color: '#087c64', fontWeight: 700 }}>Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
