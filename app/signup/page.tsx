'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
          setMessage('Email rate limit exceeded. Disable "Confirm Email" in Supabase Dashboard or wait a few minutes.');
        } else {
          setMessage(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setMessage('An account with this email already exists. Redirecting to login…');
        setTimeout(() => (window.location.href = '/login'), 1500);
        return;
      }

      // If email confirmation is disabled, user is automatically signed in
      if (data?.session) {
        setMessage('Account created successfully! Redirecting to your dashboard…');
        setTimeout(() => (window.location.href = '/dashboard'), 1000);
        return;
      }

      // Try signing in immediately if session wasn't auto-returned
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!loginError) {
        setMessage('Account created successfully! Redirecting to your dashboard…');
        setTimeout(() => (window.location.href = '/dashboard'), 1000);
        return;
      }

      setMessage('Account created! Please check your email or log in with your credentials.');
      setTimeout(() => (window.location.href = '/login'), 2000);
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <main className="finder-page">
      <div className="shell finder">
        <form onSubmit={handleSubmit} className="find-card">
          <p className="kicker">JOIN THE NETWORK</p>
          <h1>Create your account</h1>

          <label>
            <span>EMAIL</span>
            <div className="find-input">
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

          <label className="block mt-4">
            <span>PASSWORD</span>
            <div className="find-input">
              <input
                required
                minLength={8}
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
          </label>

          <label className="block mt-4">
            <span>I’M HERE AS</span>
            <div className="find-input">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="viewer">A passenger</option>
                <option value="creator">A driver</option>
              </select>
            </div>
          </label>

          <button type="submit" disabled={loading} className="search-button mt-6">
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          {message && <p className="form-note mt-4">{message}</p>}

          <p className="mt-6 text-center text-sm">
            Already a member? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
