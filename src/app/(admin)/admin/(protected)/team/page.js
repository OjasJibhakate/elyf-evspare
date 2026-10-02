import { redirect } from 'next/navigation';
import { Clock, ShieldCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team', robots: { index: false } };

export default async function AdminTeamPage() {
  const session = await requireAdmin();
  if (!session) redirect('/admin');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="mt-1 text-sm text-slate-500">Who can sign in to this admin panel.</p>
      </div>

      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <ShieldCheck className="h-4 w-4 text-brand-800" /> You are the owner
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <span className="font-semibold">{session.profile.email}</span> with the{' '}
          <span className="font-semibold">admin</span> role.
        </p>
      </div>

      <div className="card p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock className="h-3.5 w-3.5" /> Phase 4
        </span>
        <h2 className="mt-3 text-base font-bold">Adding staff accounts</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Until this screen is built, accounts are created with a command (see ADMIN.md):
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
          node scripts/create-admin.mjs staff@example.com &quot;a-strong-password&quot; &quot;Staff name&quot;
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          Staff can manage products and categories. Only admins can manage the team, settings and
          see the audit log.
        </p>
      </div>
    </div>
  );
}
