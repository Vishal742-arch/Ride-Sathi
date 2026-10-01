'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { PageViewTracker } from '@/components/analytics-tracker';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
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
        <form onSubmit={handleSubmit} className="find-card">
          <p className="kicker">WELCOME BACK</p>
          <h1>Log in to Ride With Me</h1>
          
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
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </label>
          
          <button type="submit" disabled={loading} className="search-button mt-6">
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          
          {message && <p className="form-note mt-4">{message}</p>}
          
          <div className="mt-6 flex justify-between text-sm">
            <Link href="/forgot-password">Forgot password?</Link>
            <Link href="/signup">Create account</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
