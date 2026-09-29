'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SORTS = [
  { id: 'relevance', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name-asc', label: 'Name: A to Z' },
];

export default function ListingToolbar({ total, bounds }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [open, setOpen] = useState(false);

  const sort = params.get('sort') || 'relevance';
  const inStock = params.get('stock') === '1';
  const min = params.get('min') || '';
  const max = params.get('max') || '';

  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  function push(next) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined || v === false) sp.delete(k);
      else sp.set(k, v);
    });
    sp.delete('page');
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const activeCount = [inStock, Boolean(min || max)].filter(Boolean).length;

  return (
    <div className="border-b border-slate-200 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            push({ q });
          }}
          className="relative min-w-[180px] flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search within results…"
            className="input py-2 pl-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                push({ q: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <select
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
          className="input w-auto py-2 pr-8 text-sm"
          aria-label="Sort products"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`btn-outline py-2 ${open || activeCount ? 'border-brand-800 text-brand-800' : ''}`}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-brand-800 px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="filter-min">
              Min price (₹)
            </label>
            <input
              id="filter-min"
              type="number"
              defaultValue={min}
              placeholder={String(bounds.min)}
              onBlur={(e) => push({ min: e.target.value })}
              className="input py-2"
            />
          </div>
          <div>
            <label className="label" htmlFor="filter-max">
              Max price (₹)
            </label>
            <input
              id="filter-max"
              type="number"
              defaultValue={max}
              placeholder={String(bounds.max)}
              onBlur={(e) => push({ max: e.target.value })}
              className="input py-2"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => push({ stock: e.target.checked ? '1' : '' })}
                className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
              />
              In stock only
            </label>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">{total} products</p>
    </div>
  );
}
