'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { STATUSES, STATUS_LABEL } from '@/lib/order-status';

function Submit({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-4 py-2.5">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function StatusForm({ action, order }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={order.status} className="input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="note">
            Note (optional)
          </label>
          <input
            id="note"
            name="note"
            className="input"
            placeholder="e.g. dispatched via DTDC, AWB 12345"
          />
        </div>
      </div>

      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Status updated and the customer&apos;s order page shows it.
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}

      <Submit label="Update status" />
    </form>
  );
}

export function NotesForm({ action, order }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <label className="label" htmlFor="admin_notes">
        Internal notes
      </label>
      <textarea
        id="admin_notes"
        name="admin_notes"
        defaultValue={order.admin_notes || ''}
        rows={3}
        className="input resize-none"
        placeholder="Not visible to the customer"
      />
      {state?.ok && <p className="text-xs text-emerald-700">Notes saved.</p>}
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
      <Submit label="Save notes" />
    </form>
  );
}

export function TrackingForm({ action, order }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="courier_name">
            Courier
          </label>
          <input
            id="courier_name"
            name="courier_name"
            defaultValue={order.courier_name || ''}
            className="input"
            placeholder="DTDC, BlueDart, Delhivery…"
          />
        </div>
        <div>
          <label className="label" htmlFor="tracking_no">
            Tracking / AWB number
          </label>
          <input
            id="tracking_no"
            name="tracking_no"
            defaultValue={order.tracking_no || ''}
            className="input"
            placeholder="AWB 123456789"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Both fields appear on the customer&apos;s order page as soon as you save.
      </p>

      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Saved — the customer can see this now.
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}

      <Submit label="Save tracking" />
    </form>
  );
}
