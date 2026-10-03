'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Search, X } from 'lucide-react';
import { resolvePickerProducts } from '@/lib/product-search';
import { inr } from '@/lib/format';

/**
 * Picks products for a home-page section: search, add, reorder, remove.
 * The chosen slugs are posted as a hidden JSON field.
 */
export default function ProductPicker({ name, label, hint, limit, initial = [] }) {
  const [picked, setPicked] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const resolvedOnce = useRef(false);

  // Load the products that are already selected so the admin sees names.
  useEffect(() => {
    if (resolvedOnce.current) return;
    resolvedOnce.current = true;
    if (!initial.length) return;

    let cancelled = false;
    resolvePickerProducts(initial).then((res) => {
      if (!cancelled) setPicked(res.results || []);
    });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/product-search?q=${encodeURIComponent(q)}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (cancelled) return;
        setResults(data.results || []);
        setError(res.ok ? '' : data.error || 'search-failed');
        setOpen(true);
      } catch (err) {
        if (!cancelled) setError('network');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const full = picked.length >= limit;

  function add(product) {
    if (full || picked.some((p) => p.slug === product.slug)) return;
    setPicked((current) => [...current, product]);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= picked.length) return;
    const next = [...picked];
    [next[index], next[target]] = [next[target], next[index]];
    setPicked(next);
  }

  function removeAt(index) {
    setPicked((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div ref={boxRef}>
      <input type="hidden" name={name} value={JSON.stringify(picked.map((p) => p.slug))} />

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-xs ${full ? 'font-semibold text-amber-600' : 'text-slate-400'}`}>
          {picked.length} of {limit} picked
        </span>
      </div>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}

      {picked.length > 0 && (
        <ul className="mt-3 space-y-2">
          {picked.map((p, index) => (
            <li key={p.slug} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                {p.image ? (
                  <img src={p.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="clamp-2 block text-xs font-medium text-slate-800">{p.name}</span>
                <span className="block text-[11px] text-slate-500">
                  {inr(p.price)} / {p.unit}
                  {p.partNo ? ` · ${p.partNo}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === picked.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search a product to add…"
            className="input py-2 pl-9"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}

          {error && (
            <p className="mt-2 text-xs text-rose-600">
              Search failed ({error}). Reload the page and try again.
            </p>
          )}

          {open && results.length === 0 && query.trim().length >= 2 && !loading && !error && (
            <p className="mt-2 text-xs text-slate-500">No products matched “{query.trim()}”.</p>
          )}

          {open && results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lift">
              {results.map((r) => {
                const already = picked.some((p) => p.slug === r.slug);
                return (
                  <li key={r.slug}>
                    <button
                      type="button"
                      onClick={() => add(r)}
                      disabled={already}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50"
                    >
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                        {r.image ? (
                          <img src={r.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="clamp-2 block text-xs font-medium text-slate-800">{r.name}</span>
                        <span className="block text-[11px] text-slate-500">
                          {inr(r.price)} / {r.unit}
                        </span>
                      </span>
                      {already ? (
                        <span className="shrink-0 text-[11px] text-slate-400">added</span>
                      ) : (
                        <Plus className="h-4 w-4 shrink-0 text-brand-800" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
