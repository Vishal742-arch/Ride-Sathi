'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('If an account exists with this email, a reset link is on its way.');
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell grid min-h-[75vh] place-items-center">
      <form onSubmit={handleSubmit} className="card w-full max-w-md">
        <h1 className="text-2xl font-black">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">We’ll send a secure reset link.</p>

        <input
          name="email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-6"
          placeholder="you@example.com"
        />

        <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
          {loading ? 'Sending link...' : 'Send reset link'}
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </form>
    </main>
  );
}
