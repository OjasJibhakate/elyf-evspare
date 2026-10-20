import { redirect } from 'next/navigation';
import { KeyRound, Mail, UserRound } from 'lucide-react';
import { requireStaff } from '@/lib/supabase/server';
import { NameForm, PasswordForm, EmailForm } from './AccountForms';
import { changeName, changePassword, changeEmail } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My account', robots: { index: false, follow: false } };

export default async function AdminAccountPage() {
  const session = await requireStaff();
  if (!session) redirect('/admin/login?error=not-authorised');

  const { profile } = session;
  const roleLabel = profile.role === 'admin' ? 'Administrator' : 'Staff';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">My account</h1>
        <p className="mt-1 text-sm text-slate-600">
          These are the credentials you use to open the admin panel. Change them before handing
          the panel to the shop owner.
        </p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">{profile.full_name || 'No name set'}</p>
          <p className="text-xs text-slate-500">{profile.email}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
          {roleLabel}
        </span>
      </div>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <UserRound className="h-4 w-4 text-brand-800" /> Name
        </h2>
        <div className="mt-4">
          <NameForm action={changeName} profile={profile} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <KeyRound className="h-4 w-4 text-brand-800" /> Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          You need your current password to set a new one.
        </p>
        <div className="mt-4">
          <PasswordForm action={changePassword} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Mail className="h-4 w-4 text-brand-800" /> Email address
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          This is the login ID for the admin panel. Changing it changes what you sign in with.
        </p>
        <div className="mt-4">
          <EmailForm action={changeEmail} profile={profile} />
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Handing the panel over?</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            On <span className="font-medium">Team</span>, create an account for the shop owner with
            their own email and a temporary password.
          </li>
          <li>Give them that password — they change it here, on their first sign-in.</li>
          <li>
            Once they are in, they can remove your account from Team. Keep it as a backup until
            they are comfortable, then decide together.
          </li>
        </ol>
      </div>
    </div>
  );
}
