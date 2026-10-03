'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { createTeamMember, removeTeamMember, setMemberBlocked, updateTeamRole } from './actions';

const ROLE_LABEL = { admin: 'Admin', staff: 'Staff', customer: 'Customer' };
const ROLE_STYLE = {
  admin: 'bg-brand-50 text-brand-900',
  staff: 'bg-emerald-50 text-emerald-700',
  customer: 'bg-slate-100 text-slate-600',
};

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-4 py-2.5">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      {pending ? 'Creating…' : label}
    </button>
  );
}

function AddMemberForm({ onDone }) {
  const [state, formAction] = useFormState(createTeamMember, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Account created for {state.email}. They can sign in now.
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">
            Name
          </label>
          <input id="full_name" name="full_name" className="input" placeholder="Suresh Patil" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email *
          </label>
          <input id="email" name="email" type="email" className="input" required placeholder="staff@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Temporary password *
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="input pr-16"
              required
              minLength={12}
              placeholder="At least 12 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-800"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="role">
            Role
          </label>
          <select id="role" name="role" defaultValue="staff" className="input">
            <option value="staff">Staff — manage products and orders</option>
            <option value="admin">Admin — full access including this page</option>
          </select>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Share the password with them over a call or in person — not over email or WhatsApp together with the
        email address. Ask them to change it after the first sign in.
      </p>

      <div className="flex gap-2">
        <SubmitButton label="Create account" />
        <button type="button" onClick={onDone} className="btn-outline px-4 py-2.5">
          Close
        </button>
      </div>
    </form>
  );
}

export default function TeamManager({ members, currentUserId }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  async function run(key, fn) {
    setBusy(key);
    setError('');
    const result = await fn();
    setBusy('');
    if (result?.error) setError(result.error);
    else router.refresh();
  }

  const admins = members.filter((m) => m.role === 'admin').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setAdding((v) => !v)} className="btn-brand">
          {adding ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {adding ? 'Cancel' : 'Add team member'}
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      {adding && (
        <section className="card p-5">
          <h2 className="text-base font-bold">New account</h2>
          <p className="mt-1 text-xs text-slate-500">
            There is no public sign up — accounts can only be created here.
          </p>
          <div className="mt-4">
            <AddMemberForm onDone={() => setAdding(false)} />
          </div>
        </section>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Person</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const isSelf = m.id === currentUserId;
                const isLastAdmin = m.role === 'admin' && admins <= 1;
                const locked = isSelf || isLastAdmin;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {m.full_name || m.email || 'Unnamed'}
                        </span>
                        {isSelf && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            you
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-500">{m.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.role}
                        disabled={isSelf || busy === `role-${m.id}`}
                        onChange={(e) =>
                          run(`role-${m.id}`, () => updateTeamRole(m.id, e.target.value))
                        }
                        className="input w-auto py-1.5 text-xs disabled:opacity-60"
                        title={isSelf ? 'You cannot change your own role' : undefined}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="customer">Customer</option>
                      </select>
                      <span
                        className={`ms-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ROLE_STYLE[m.role] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ROLE_LABEL[m.role] || m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          m.is_blocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {m.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={locked || busy === `block-${m.id}`}
                          onClick={() =>
                            run(`block-${m.id}`, () => setMemberBlocked(m.id, !m.is_blocked))
                          }
                          title={
                            isSelf
                              ? 'You cannot block yourself'
                              : m.is_blocked
                                ? 'Allow this account to sign in again'
                                : 'Stop this account from signing in'
                          }
                          className="btn-ghost px-2 py-1.5 disabled:opacity-30"
                        >
                          {busy === `block-${m.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : m.is_blocked ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <UserX className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={locked || busy === `del-${m.id}`}
                          onClick={() => {
                            if (!window.confirm(`Delete the account for ${m.email}?\n\nThey lose access immediately. This cannot be undone.`)) return;
                            run(`del-${m.id}`, () => removeTeamMember(m.id));
                          }}
                          title={locked ? 'Cannot delete this account' : 'Delete account'}
                          className="btn-ghost px-2 py-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          {busy === `del-${m.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Guard rails: you cannot change your own role, block yourself, or remove the last admin — so the shop
        can never lose access to this panel.
      </p>
    </div>
  );
}
