'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';

const SORTS = [
  { id: 'name-asc', label: 'Name A → Z' },
  { id: 'name-desc', label: 'Name Z → A' },
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'price-asc', label: 'Price: low → high' },
  { id: 'price-desc', label: 'Price: high → low' },
  { id: 'stock-asc', label: 'Stock: low → high' },
  { id: 'stock-desc', label: 'Stock: high → low' },
];

export default function ProductsToolbar({ categories, total, showing }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') || '');

  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  const category = params.get('category') || '';
  const stock = params.get('stock') || '';
  const active = params.get('active') || '';
  const sort = params.get('sort') || 'name-asc';

  const activeCount = [category, stock, active, params.get('q')].filter(Boolean).length;

  function apply(patch) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) sp.delete(key);
      else sp.set(key, value);
    });
    sp.delete('page');
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    });
  }

  function submitSearch(event) {
    event.preventDefault();
    apply({ q });
  }

  function clearAll() {
    setQ('');
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or part number…"
            className="input py-2 pl-9 pr-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                apply({ q: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <select
          value={category}
          onChange={(e) => apply({ category: e.target.value })}
          className="input w-auto py-2"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stock}
          onChange={(e) => apply({ stock: e.target.value })}
          className="input w-auto py-2"
          aria-label="Filter by stock"
        >
          <option value="">Any stock</option>
          <option value="out">Out of stock</option>
          <option value="low">Low stock (≤ 50)</option>
          <option value="in">In stock</option>
        </select>

        <select
          value={active}
          onChange={(e) => apply({ active: e.target.value })}
          className="input w-auto py-2"
          aria-label="Filter by status"
        >
          <option value="">Live + hidden</option>
          <option value="live">Live only</option>
          <option value="hidden">Hidden only</option>
        </select>

        <select
          value={sort}
          onChange={(e) => apply({ sort: e.target.value === 'name-asc' ? '' : e.target.value })}
          className="input w-auto py-2"
          aria-label="Sort products"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="btn-ghost py-2 text-slate-600">
            <X className="h-4 w-4" /> Clear {activeCount}
          </button>
        )}
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
          </>
        ) : (
          <>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Showing {showing} of {total} products
            {activeCount > 0 ? ' (filtered)' : ''}
          </>
        )}
      </p>
    </div>
  );
}
