'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function SearchBox({ compact = false }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled) {
          setResults(data.results || []);
          setOpen(true);
        }
      } catch (e) {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
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

  function submit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search by part name or part number…"
            className={`input pl-9 pr-9 ${compact ? 'py-2' : ''}`}
            aria-label="Search products"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No matching parts found.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
              {results.map((r) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                      router.push(`/product/${r.slug}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                      {r.image ? (
                        <img src={r.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{r.name}</span>
                      <span className="block text-xs text-slate-500">
                        {r.partNo ? `Part No. ${r.partNo.toUpperCase()} · ` : ''}₹{r.price} / {r.unit}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={submit}
            className="block w-full border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-brand-800 hover:bg-slate-100"
          >
            See all results for “{query.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
