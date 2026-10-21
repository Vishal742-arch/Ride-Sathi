'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { Mail, KeyRound, Lock } from 'lucide-react';

export default function Login() {
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'EMAIL_OTP'>('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request Email OTP for login
  const handleSendEmailOtp = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Please enter your registered email address.');
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
          purpose: 'LOGIN',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Failed to send login code.');
        return;
      }
      setOtpSent(true);
      setCooldown(60);
      setMessage(data.message || 'Single-use login code sent to your email.');
    } catch {
      setMessage('Network error sending login code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Email OTP for login
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setMessage('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setMessage('');
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
        setMessage(data.error || 'Invalid or expired code.');
        setLoading(false);
        return;
      }

      // Also sign in session via Supabase OTP if supported, or direct to dashboard
      const supabase = createClient();
      try {
        await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
        });
      } catch {}

      setMessage('Signed in successfully! Redirecting…');
      window.location.href = '/dashboard';
    } catch {
      setMessage('Network error verifying code.');
      setLoading(false);
    }
  };

  // Password Login
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    trackEvent('login_started');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        trackEvent('login_completed');
        setMessage('Signed in successfully! Redirecting...');
        window.location.href = '/dashboard';
      } else {
        setMessage('Signed in, but session was not returned. Please check email confirmation status.');
        setLoading(false);
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <main className="finder-page">
      <div className="shell finder">
        <div className="find-card" style={{ maxWidth: 440, margin: '0 auto', gap: 16 }}>
          <p className="kicker">WELCOME BACK</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>Log in to Ride With Me</h1>

          {/* Mode toggle: Password vs Email OTP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
            <button
              type="button"
              onClick={() => { setAuthMode('PASSWORD'); setMessage(''); }}
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: authMode === 'PASSWORD' ? '#fff' : 'transparent',
                color: authMode === 'PASSWORD' ? '#0f172a' : '#64748b',
                boxShadow: authMode === 'PASSWORD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Lock size={14} /> Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('EMAIL_OTP'); setMessage(''); }}
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: authMode === 'EMAIL_OTP' ? '#fff' : 'transparent',
                color: authMode === 'EMAIL_OTP' ? '#087c64' : '#64748b',
                boxShadow: authMode === 'EMAIL_OTP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Mail size={14} /> Email OTP
            </button>
          </div>

          {authMode === 'PASSWORD' ? (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: 14 }}>
              <label>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>EMAIL</span>
                <div className="find-input" style={{ borderRadius: 12 }}>
                  <input
                    required
                    name="email"
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
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <button type="submit" disabled={loading} className="search-button" style={{ marginTop: 6 }}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpLogin} style={{ display: 'grid', gap: 14 }}>
              <label>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>REGISTERED EMAIL</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <div className="find-input" style={{ flex: 1, borderRadius: 12 }}>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={otpLoading || cooldown > 0}
                    style={{
                      background: cooldown > 0 ? '#cbd5e1' : '#087c64',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '0 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cooldown > 0 ? `${cooldown}s` : 'Send Code'}
                  </button>
                </div>
              </label>

              {otpSent && (
                <label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#087c64', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <KeyRound size={14} /> ENTER 6-DIGIT EMAIL CODE
                  </span>
                  <div className="find-input" style={{ borderRadius: 12, marginTop: 4 }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 529148"
                      style={{ letterSpacing: 4, fontWeight: 800, textAlign: 'center' }}
                    />
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={loading || !otpSent || otpCode.length !== 6}
                className="search-button"
                style={{
                  marginTop: 6,
                  background: !otpSent || otpCode.length !== 6 ? '#cbd5e1' : undefined,
                  cursor: !otpSent || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Verifying & Signing in…' : 'Log in with Email Code'}
              </button>
            </form>
          )}

          {message && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                color: message.includes('success') ? '#166534' : '#dc2626',
                margin: 0,
              }}
            >
              {message}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginTop: 4 }}>
            <Link href="/forgot-password" style={{ color: '#64748b' }}>Forgot password?</Link>
            <Link href="/signup" style={{ color: '#087c64', fontWeight: 700 }}>Create account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
