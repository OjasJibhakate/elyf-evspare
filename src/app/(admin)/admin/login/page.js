import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getSessionProfile } from '@/lib/supabase/server';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }) {
  const session = await getSessionProfile();

  // Already signed in with a staff role? Straight through.
  if (session && ['admin', 'staff'].includes(session.profile.role)) {
    redirect(searchParams?.next || '/admin');
  }

  const notice =
    searchParams?.error === 'not-authorised'
      ? 'That account does not have access to the admin panel.'
      : '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Authorised staff only. Access is logged.
          </p>
        </div>

        {notice && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {notice}
          </p>
        )}

        <LoginForm next={searchParams?.next || '/admin'} />

        <p className="mt-6 text-center text-xs text-slate-400">
          Accounts are created by an existing admin. There is no public sign up.
        </p>
      </div>
    </div>
  );
}
