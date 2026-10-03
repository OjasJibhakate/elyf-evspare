'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const initial = { name: '', email: '', phone: '', password: '' };

export default function SignupForm({ next = '/account' }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Please enter a valid email.';

    const digits = form.phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) return 'Please enter a valid 10-digit mobile number.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';

    return '';
  }

  async function onSubmit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setBusy(true);

    const digits = form.phone.replace(/\D/g, '').slice(-10);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        // handle_new_user() reads these into the profile row.
        data: { full_name: form.name.trim(), phone: digits },
      },
    });

    if (signUpError) {
      setError(
        /already registered|already exists/i.test(signUpError.message)
          ? 'An account with that email already exists. Try signing in instead.'
          : signUpError.message,
      );
      setBusy(false);
      return;
    }

    // With email confirmation off, signUp returns a live session.
    if (!data.session) {
      setError(
        'Account created, but it needs email confirmation before you can sign in. Ask the store to enable sign-in.',
      );
      setBusy(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Full name
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="input pl-9"
            placeholder="Ramesh Kumar"
            autoComplete="name"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="input pl-9"
            placeholder="you@example.com"
            autoComplete="username"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="phone">
          Mobile number
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="phone"
            required
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="input pl-9"
            placeholder="98765 43210"
            autoComplete="tel"
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
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="input pl-9"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-brand w-full py-2.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-800 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
