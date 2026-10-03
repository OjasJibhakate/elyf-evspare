import { redirect } from 'next/navigation';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';
import TeamManager from './TeamManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team', robots: { index: false } };

export default async function AdminTeamPage() {
  const session = await requireAdmin();
  if (!session) redirect('/admin');

  // Service role: profiles are readable by staff, but an admin list is only
  // needed here and this keeps the query snapshot-consistent.
  const admin = createAdminClient();
  const { data: members } = await admin
    .from('profiles')
    .select('id, role, full_name, email, phone, is_blocked, created_at')
    .order('role')
    .order('created_at');

  const admins = (members || []).filter((m) => m.role === 'admin').length;
  const staff = (members || []).filter((m) => m.role === 'staff').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Who can sign in to this panel. {admins} admin{admins === 1 ? '' : 's'}, {staff} staff.
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-800" />
        Staff can manage products, categories, home page content and orders. Only admins can manage the team,
        settings and see this page.
      </p>

      {admins <= 1 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          You have a single admin account. If you lose access to it you cannot get back into this panel — consider
          adding a second admin you trust.
        </p>
      )}

      <TeamManager members={members || []} currentUserId={session.user.id} />
    </div>
  );
}
