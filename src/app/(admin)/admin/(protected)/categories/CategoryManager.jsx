'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { deleteCategory, reorderCategory, saveCategory, setCategoryActive } from './actions';
import ProductImage from '@/components/ProductImage';
import ImageField from '@/components/admin/ImageField';

const EMPTY = {
  id: '',
  name: '',
  slug: '',
  description: '',
  image_url: '',
  image_focus: null,
  position: 0,
  is_active: true,
};

export default function CategoryManager({ categories }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function refresh() {
    router.refresh();
  }

  async function run(key, fn) {
    setBusy(key);
    setError('');
    setMessage('');
    const result = await fn();
    setBusy('');
    if (result?.error) {
      setError(result.error);
      return false;
    }
    refresh();
    return true;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing({ ...EMPTY })} className="btn-brand">
          <Plus className="h-4 w-4" /> New category
        </button>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      <div className="card overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {categories.map((c, index) => (
            <li key={c.id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0 || busy === `up-${c.id}`}
                  onClick={() => run(`up-${c.id}`, () => reorderCategory(c.id, 'up'))}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === categories.length - 1 || busy === `down-${c.id}`}
                  onClick={() => run(`down-${c.id}`, () => reorderCategory(c.id, 'down'))}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {c.image_url ? (
                  <ProductImage
                    src={c.image_url}
                    alt=""
                    focus={c.image_focus}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>

              <div className="min-w-0 flex-1">
                <p className="clamp-2 font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.count} product{c.count === 1 ? '' : 's'} · /category/{c.slug}
                </p>
              </div>

              <span
                className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-flex ${
                  c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {c.is_active ? 'Live' : 'Hidden'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => run(`edit-${c.id}`, () => setCategoryActive(c.id, !c.is_active))}
                  className="btn-ghost px-2 py-1.5"
                  title={c.is_active ? 'Hide' : 'Show'}
                >
                  {busy === `edit-${c.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : c.is_active ? (
                    <Eye className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...c })}
                  className="btn-ghost px-2 py-1.5"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    run(`del-${c.id}`, async () => {
                      const confirmed = window.confirm(
                        `Delete the category “${c.name}”?\n\nProducts are never deleted — they must be moved to another category first.`,
                      );
                      if (!confirmed) return { error: '' };
                      return deleteCategory(c.id);
                    })
                  }
                  className="btn-ghost px-2 py-1.5 text-slate-400 hover:text-rose-600"
                  title="Delete"
                >
                  {busy === `del-${c.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </li>
          ))}
          {!categories.length && (
            <li className="p-10 text-center text-sm text-slate-500">
              No categories yet. Create your first one.
            </li>
          )}
        </ul>
      </div>

      {editing && (
        <CategoryDrawer
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setMessage(msg);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryDrawer({ category, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const isNew = !category.id;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await saveCategory(category.id || null, {}, formData);

    setBusy(false);
    if (result?.fieldErrors) {
      setFieldErrors(result.fieldErrors);
      return;
    }
    if (result?.error) {
      setError(result.error);
      return;
    }
    onSaved(isNew ? 'Category created.' : 'Category updated.');
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold">{isNew ? 'New category' : 'Edit category'}</h2>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <label className="label" htmlFor="cat-name">
              Name *
            </label>
            <input
              id="cat-name"
              name="name"
              defaultValue={category.name}
              className="input"
              placeholder="EV Motors & Motor Accessories"
              required
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="label" htmlFor="cat-slug">
              Web address (slug) *
            </label>
            <input
              id="cat-slug"
              name="slug"
              defaultValue={category.slug}
              className="input font-mono text-xs"
              placeholder="ev-motors-and-motor-accessories"
              required
            />
            {fieldErrors.slug && <p className="mt-1 text-xs text-rose-600">{fieldErrors.slug}</p>}
          </div>

          <div>
            <ImageField
              label="Tile photo"
              initialUrl={category.image_url || ''}
              initialFocus={category.image_focus}
              folder="categories"
              help="Shown on the home page and category list. Leave empty to use the first product photo."
            />
          </div>

          <div>
            <label className="label" htmlFor="cat-description">
              Short description
            </label>
            <textarea
              id="cat-description"
              name="description"
              defaultValue={category.description || ''}
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label" htmlFor="cat-position">
              Order
            </label>
            <input
              id="cat-position"
              name="position"
              type="number"
              min="0"
              defaultValue={category.position ?? 0}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Lower numbers appear first. You can also reorder with the arrows in the list.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={category.is_active}
              className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
            />
            Show this category on the store
          </label>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy} className="btn-brand px-5 py-2.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isNew ? 'Create category' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline px-5 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
