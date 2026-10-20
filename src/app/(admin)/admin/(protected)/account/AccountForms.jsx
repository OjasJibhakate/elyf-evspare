'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function Submit({ label, pendingLabel }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-4 py-2.5">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

function Feedback({ state }) {
  if (state?.error) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
      </p>
    );
  }
  if (state?.ok) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
      </p>
    );
  }
  return null;
}

export function NameForm({ action, profile }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label" htmlFor="full_name">
          Your name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name || ''}
          className="input"
          placeholder="Hitesh Kumar Chouhan"
          required
        />
        <p className="mt-1 text-xs text-slate-500">Shown on the team list and in your order notes.</p>
      </div>
      <Feedback state={state} />
      <Submit label="Save name" pendingLabel="Saving…" />
    </form>
  );
}

export function PasswordForm({ action }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label" htmlFor="current_password">
          Current password
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="new_password">
            New password
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm_password">
            Repeat new password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        At least 12 characters. Nobody at the shop can see it — if you lose it, another admin
        resets it from the Team screen.
      </p>

      <Feedback state={state} />
      <Submit label="Change password" pendingLabel="Changing…" />
    </form>
  );
}

export function EmailForm({ action, profile }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label" htmlFor="email">
          New email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          defaultValue=""
          placeholder="new@example.com"
          autoComplete="email"
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          You currently sign in as <span className="font-medium">{profile.email}</span>.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="email_current_password">
          Current password
        </label>
        <input
          id="email_current_password"
          name="current_password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Make sure the new address is correct before saving. There is no password-reset email on
        this plan, so a typo locks you out until another admin fixes it from the Team screen.
      </div>

      <Feedback state={state} />
      <Submit label="Change email" pendingLabel="Changing…" />
    </form>
  );
}
