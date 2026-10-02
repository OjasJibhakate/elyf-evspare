'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm({ next = '/admin' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Very light client-side throttle. The real protection is server-side.
  const [attempts, setAttempts] = useState(0);
  const lockedOut = attempts >= 5;

  async function onSubmit(event) {
    event.preventDefault();
    if (lockedOut) return;
    setError('');
    setBusy(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setAttempts((n) => n + 1);
      // Never reveal whether the email exists.
      setError('Email or password is incorrect.');
      setBusy(false);
      return;
    }

    // Confirm the account actually has a staff role before entering /admin.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.is_blocked || !['admin', 'staff'].includes(profile.role)) {
      await supabase.auth.signOut();
      setError('That account does not have access to the admin panel.');
      setBusy(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input pl-9"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input pl-9"
            placeholder="••••••••••••"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {lockedOut && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Too many attempts. Reload the page and try again in a few minutes.
        </p>
      )}

      <button type="submit" disabled={busy || lockedOut} className="btn-brand w-full py-2.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
