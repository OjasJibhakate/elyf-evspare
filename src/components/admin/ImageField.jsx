'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ImagePlus,
  Link2,
  Loader2,
  Move,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react';
import { uploadImage } from '@/lib/upload-image';
import { DEFAULT_FOCUS, focusToField, parseFocus } from '@/lib/image-focus';

/**
 * A single image field with four ways to fill it:
 *   · upload from the device (compressed first)
 *   · pick a photo from any product in the catalogue
 *   · paste a URL
 *   · adjust the framing, so a wide photo still works in a square tile
 *
 * Renders two hidden inputs so it drops straight into an existing <form>:
 * `<urlName>` for the URL and `<focusName>` for the framing JSON.
 */
export default function ImageField({
  urlName = 'image_url',
  focusName = 'image_focus',
  initialUrl = '',
  initialFocus = null,
  label = 'Photo',
  help = '',
  folder = 'categories',
  previewAspect = '4 / 3',
}) {
  const [url, setUrl] = useState(initialUrl || '');
  const [focus, setFocus] = useState(parseFocus(initialFocus) || { ...DEFAULT_FOCUS });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(null);
  const fileRef = useRef(null);

  function apply(nextUrl) {
    setUrl(nextUrl);
    setFocus({ ...DEFAULT_FOCUS });
    setError('');
    setPanel(null);
  }

  async function onFiles(event) {
    const file = event.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    setBusy(true);
    setError('');
    const result = await uploadImage(file, { folder, maxSide: 1600 });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    apply(result.url);
  }

  return (
    <div>
      <input type="hidden" name={urlName} value={url} />
      <input type="hidden" name={focusName} value={focusToField(focus)} />

      <span className="label">{label}</span>

      <div className="flex gap-3">
        <div
          className="h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
          style={{ aspectRatio: previewAspect }}
        >
          {url ? (
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              style={focusStyleFor(focus)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
              No photo
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn-outline px-2.5 py-1.5 text-xs"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {busy ? 'Uploading…' : 'From device'}
            </button>

            <button
              type="button"
              onClick={() => setPanel('pick')}
              className="btn-outline px-2.5 py-1.5 text-xs"
            >
              <Search className="h-3.5 w-3.5" /> From a product
            </button>

            <button
              type="button"
              onClick={() => setPanel('url')}
              className="btn-outline px-2.5 py-1.5 text-xs"
            >
              <Link2 className="h-3.5 w-3.5" /> URL
            </button>

            {url && (
              <>
                <button
                  type="button"
                  onClick={() => setPanel('adjust')}
                  className="btn-outline px-2.5 py-1.5 text-xs"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                </button>
                <button
                  type="button"
                  onClick={() => apply('')}
                  className="btn-ghost px-2 py-1.5 text-xs text-slate-400 hover:text-rose-600"
                  title="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {url && isAdjusted(focus) && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-800">
              <Move className="h-3 w-3" /> Framing adjusted
            </span>
          )}

          {help && !error && <p className="text-[11px] text-slate-500">{help}</p>}
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFiles}
        disabled={busy}
      />

      {panel === 'url' && (
        <UrlPanel
          initial={url}
          onCancel={() => setPanel(null)}
          onApply={apply}
        />
      )}

      {panel === 'pick' && <ProductPicker onCancel={() => setPanel(null)} onPick={apply} />}

      {panel === 'adjust' && url && (
        <AdjustPanel
          url={url}
          focus={focus}
          onChange={setFocus}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

function focusStyleFor(focus) {
  const style = { objectPosition: `${focus.x}% ${focus.y}%` };
  if (focus.zoom !== 1) {
    style.transform = `scale(${focus.zoom})`;
    style.transformOrigin = `${focus.x}% ${focus.y}%`;
  }
  return style;
}

function isAdjusted(focus) {
  return focus.x !== 50 || focus.y !== 50 || focus.zoom !== 1;
}

function Shell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-sm font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-slate-200 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- url panel */

function UrlPanel({ initial, onCancel, onApply }) {
  const [value, setValue] = useState(initial || '');

  return (
    <Shell
      title="Paste an image URL"
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-outline px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply(value.trim())}
            disabled={!value.trim()}
            className="btn-brand px-4 py-2"
          >
            Use this image
          </button>
        </div>
      }
    >
      <label className="label" htmlFor="image-url">
        Image URL
      </label>
      <input
        id="image-url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input"
        placeholder="https://…"
        autoFocus
      />
      {value.trim() && (
        <img
          src={value.trim()}
          alt=""
          className="mt-3 h-40 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
        />
      )}
    </Shell>
  );
}

/* ----------------------------------------------------------- product picker */

function ProductPicker({ onCancel, onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setError('');
      return;
    }

    let cancelled = false;
    setBusy(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/product-search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error === 'not-authorised' ? 'Not authorised.' : 'Search failed.');
          setResults([]);
        } else {
          setError('');
          setResults(data.results || []);
        }
      } catch (e) {
        if (!cancelled) setError('Search failed. Check your connection.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <Shell title="Choose a photo from a product" onClose={onCancel}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-9"
          placeholder="Search by name or part number…"
          autoFocus
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Type at least two letters. The first photo of the product is used.
      </p>

      {busy && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching…
        </p>
      )}

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {!busy && !error && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No products matched.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {results.map((product) => (
            <li key={product.slug}>
              <button
                type="button"
                disabled={!product.image}
                onClick={() => onPick(product.image)}
                className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded border border-slate-200 bg-white p-1">
                  {product.image ? (
                    <img src={product.image} alt="" className="h-full w-full object-contain" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="clamp-2 block text-sm font-medium text-slate-800">
                    {product.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {product.partNo ? `${product.partNo} · ` : ''}
                    {product.image ? 'Tap to use this photo' : 'This product has no photo'}
                  </span>
                </span>
                {product.image && <Check className="h-4 w-4 shrink-0 text-slate-300" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

/* -------------------------------------------------------------- adjust panel */

function AdjustPanel({ url, focus, onChange, onClose }) {
  const boxRef = useRef(null);
  const dragRef = useRef(null);

  function onPointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, startX: focus.x, startY: focus.y };
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    const box = boxRef.current?.getBoundingClientRect();
    if (!drag || !box) return;

    // Dragging the photo right should show more of its left edge, which means a
    // smaller object-position percentage. Zoomed-in photos move less per pixel.
    const dx = ((event.clientX - drag.x) / box.width) * 100 / focus.zoom;
    const dy = ((event.clientY - drag.y) / box.height) * 100 / focus.zoom;

    onChange({
      ...focus,
      x: Math.min(100, Math.max(0, drag.startX - dx)),
      y: Math.min(100, Math.max(0, drag.startY - dy)),
    });
  }

  function onPointerUp(event) {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  const frame = { objectPosition: `${focus.x}% ${focus.y}%` };
  if (focus.zoom !== 1) {
    frame.transform = `scale(${focus.zoom})`;
    frame.transformOrigin = `${focus.x}% ${focus.y}%`;
  }

  return (
    <Shell
      title="Adjust the photo"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FOCUS })}
            className="btn-ghost px-3 py-2 text-xs"
          >
            Reset
          </button>
          <button type="button" onClick={onClose} className="btn-brand px-5 py-2">
            Done
          </button>
        </div>
      }
    >
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-[34vh] max-h-[280px] min-h-[150px] w-full cursor-grab touch-none overflow-hidden rounded-lg border border-slate-200 bg-slate-100 active:cursor-grabbing"
      >
        <img src={url} alt="" draggable={false} className="h-full w-full object-cover" style={frame} />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-white">
            <Move className="mr-1 inline h-3 w-3" /> Drag to reposition
          </span>
        </span>
      </div>

      <div className="mt-4">
        <label className="label flex items-center gap-1.5" htmlFor="focus-zoom">
          <ZoomIn className="h-3.5 w-3.5" /> Zoom
        </label>
        <input
          id="focus-zoom"
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={focus.zoom}
          onChange={(e) => onChange({ ...focus, zoom: Number(e.target.value) })}
          className="w-full accent-brand-800"
        />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        How it will look
      </p>
      <div className="mt-2 flex gap-3">
        <div>
          <span className="mb-1 block text-[11px] text-slate-500">Square</span>
          <span className="block h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={url} alt="" className="h-full w-full object-cover" style={frame} />
          </span>
        </div>
        <div className="flex-1">
          <span className="mb-1 block text-[11px] text-slate-500">Wide tile</span>
          <span className="block h-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={url} alt="" className="h-full w-full object-cover" style={frame} />
          </span>
        </div>
      </div>
    </Shell>
  );
}
