'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Signed-in indicator for the header.
 *
 * Deliberately client-side: reading the session in the store layout would make
 * every storefront page dynamic and cost us static caching. This is a display
 * hint only — every real permission check happens on the server.
 */
export default function AccountMenu() {
  const [email, setEmail] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email || null);
      setReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    // Same footprint as the real control, so nothing shifts when it resolves.
    return <span className="h-9 w-9 rounded-full bg-slate-100" aria-hidden="true" />;
  }

  if (!email) {
    return (
      <Link href="/login" className="btn-ghost px-2.5 text-slate-700" aria-label="Sign in">
        <User className="h-4 w-4" />
        <span className="hidden text-sm font-medium sm:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="btn-ghost px-2 text-slate-700"
      title={`Signed in as ${email}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-[11px] font-bold text-white">
        {email.charAt(0).toUpperCase()}
      </span>
      <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:inline">
        {email.split('@')[0]}
      </span>
    </Link>
  );
}
