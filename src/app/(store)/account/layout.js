import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/supabase/server';
import { safeNext } from '@/lib/safe-next';
import AccountNav from './AccountNav';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My account', robots: { index: false, follow: false } };

export default async function AccountLayout({ children }) {
  const session = await getSessionProfile();
  if (!session) redirect(`/login?next=${encodeURIComponent('/account')}`);

  const { profile } = session;
  const initial = (profile.full_name || profile.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-base font-bold text-white">
            {initial}
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">
              {profile.full_name || 'My account'}
            </span>
            <span className="block text-xs text-slate-500">{profile.email}</span>
          </span>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6">
        <AccountNav />
      </div>

      <div className="mt-6">{children}</div>

      <p className="mt-10 text-center text-xs text-slate-400">
        Need help with an order?{' '}
        <Link href="/contact" className="font-medium text-brand-800 hover:underline">
          Contact us
        </Link>{' '}
        or message us on WhatsApp.
      </p>
    </div>
  );
}
