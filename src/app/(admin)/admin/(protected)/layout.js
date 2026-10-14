import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  // Second gate: the middleware already checked, but every protected render
  // re-checks the role on the server so a matcher mistake cannot expose this.
  const session = await requireStaff();
  if (!session) redirect('/admin/login?error=not-authorised');

  const settings = await getSettings();

  return (
    <AdminShell profile={session.profile} store={settings.store}>
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </AdminShell>
  );
}
