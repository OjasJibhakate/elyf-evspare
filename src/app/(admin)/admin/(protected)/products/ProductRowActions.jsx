'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { setProductActive, deleteProduct } from './actions';

export default function ProductRowActions({ product }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggleActive() {
    setBusy(true);
    setError('');
    startTransition(async () => {
      const result = await setProductActive(product.id, !product.is_active);
      setBusy(false);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function remove() {
    const confirmed = window.confirm(
      `Delete “${product.name}”?\n\nThis removes it from the catalogue permanently. If you only want to hide it, use the hide button instead.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError('');
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      setBusy(false);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="me-2 text-xs text-rose-600">{error}</span>}
      <button
        type="button"
        onClick={toggleActive}
        disabled={busy || pending}
        title={product.is_active ? 'Hide from store' : 'Show in store'}
        className="btn-ghost px-2 py-1.5"
      >
        {busy || pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : product.is_active ? (
          <Eye className="h-4 w-4 text-emerald-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-slate-400" />
        )}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy || pending}
        title="Delete product"
        className="btn-ghost px-2 py-1.5 text-slate-400 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
