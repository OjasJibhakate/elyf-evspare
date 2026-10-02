'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Percent } from 'lucide-react';
import { bulkAdjustPrices } from './actions';

export default function BulkPriceTool({ categories }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [percent, setPercent] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function apply() {
    const value = Number(percent);
    const scope = categories.find((c) => c.id === categoryId)?.name || 'the whole catalogue';

    const confirmed = window.confirm(
      `Change every price in “${scope}” by ${value > 0 ? '+' : ''}${value}%?\n\nThis cannot be undone in bulk (individual changes are logged).`,
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage('');
    setError('');

    const result = await bulkAdjustPrices({ categoryId: categoryId || null, percent: value });
    setBusy(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setMessage(`Updated ${result.updated} product${result.updated === 1 ? '' : 's'}.`);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline">
        <Percent className="h-4 w-4" /> Bulk price change
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div>
        <label className="label" htmlFor="bulk-category">
          Category
        </label>
        <select
          id="bulk-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input w-56 py-2"
        >
          <option value="">All products</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="bulk-percent">
          Change by %
        </label>
        <input
          id="bulk-percent"
          type="number"
          step="0.5"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="e.g. 5 or -10"
          className="input w-40 py-2"
        />
      </div>
      <button type="button" onClick={apply} disabled={busy || !percent} className="btn-brand py-2.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Apply
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost py-2.5">
        Cancel
      </button>
      {message && <span className="text-sm text-emerald-700">{message}</span>}
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  );
}
