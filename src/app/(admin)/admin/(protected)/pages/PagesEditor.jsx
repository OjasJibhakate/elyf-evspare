'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, FileText, Loader2, Plus, Save } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-5 py-2.5">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Saving…' : 'Save page'}
    </button>
  );
}

export const PAGE_DEFAULTS = {
  terms: {
    title: 'Terms & conditions',
    body: `Prices are in Indian Rupees and exclude GST unless stated otherwise.

GST is charged at 18% on most items and 5% on chargers.

# Minimum order quantity

Several items are sold in minimum pack sizes. The minimum is shown on each product page and enforced in the cart.

# Orders

An order placed on this website is a purchase enquiry. We confirm stock, freight and the final invoice on WhatsApp before dispatch.

# Warranty

Electrical parts carry the manufacturer warranty where applicable and are replaced if found dead on arrival. Report damaged parts within 48 hours of delivery with photos.`,
  },
  shipping: {
    title: 'Shipping & returns',
    body: `# Dispatch

Orders confirmed before 4pm are packed the same day. The rest leave our warehouse within 24–48 working hours.

# Delivery

We ship through reputed courier partners across India. Delivery timelines depend on your location.

# Damaged or wrong parts

Share an unboxing photo within 48 hours of delivery and we will ship a replacement or issue a credit note.

# GST invoice

Every order ships with a proper GST invoice. Add your GSTIN at checkout to claim input credit.`,
  },
  about: {
    title: 'About us',
    body: `We supply electric scooter spare parts to dealers, workshops and fleet owners across India.

Everything we sell is sourced from verified manufacturers, checked before dispatch, and billed with a proper GST invoice.`,
  },
};

export default function PagesEditor({ action, pages }) {
  const [state, formAction] = useFormState(action, {});
  const [selected, setSelected] = useState(pages[0]?.slug || 'terms');

  const existing = pages.find((p) => p.slug === selected);
  const fallback = PAGE_DEFAULTS[selected] || { title: '', body: '' };
  const current = {
    slug: selected,
    title: existing?.title || fallback.title,
    body: existing?.body || fallback.body,
    is_active: existing ? existing.is_active !== false : true,
  };

  const allSlugs = Array.from(new Set([...pages.map((p) => p.slug), ...Object.keys(PAGE_DEFAULTS)]));

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="card h-fit p-2">
        <ul className="space-y-1">
          {allSlugs.map((slug) => {
            const meta = pages.find((p) => p.slug === slug);
            const label = meta?.title || PAGE_DEFAULTS[slug]?.title || slug;
            return (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => setSelected(slug)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selected === slug
                      ? 'bg-brand-50 font-semibold text-brand-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  {!meta && (
                    <span className="ms-auto rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                      new
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* key={selected} forces the fields to remount when another page is
          picked — uncontrolled inputs would otherwise keep the previous
          page's text and save it into the wrong page. */}
      <form key={selected} action={formAction} className="card space-y-4 p-5">
        {state?.ok && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Saved and published.
          </p>
        )}
        {state?.error && (
          <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4" /> {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{current.title || 'New page'}</h2>
            <p className="text-xs text-slate-500">
              Live at <span className="font-mono">/{current.slug}</span>
            </p>
          </div>
          <a
            href={`/${current.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline py-2 text-xs"
          >
            View page
          </a>
        </div>

        <input type="hidden" name="slug" value={current.slug} />

        <div>
          <label className="label" htmlFor="page-title">
            Page title
          </label>
          <input id="page-title" name="title" defaultValue={current.title} className="input" required />
        </div>

        <div>
          <label className="label" htmlFor="page-body">
            Content
          </label>
          <textarea
            id="page-body"
            name="body"
            defaultValue={current.body}
            rows={20}
            className="input font-mono text-xs leading-6"
          />
          <p className="mt-1 text-xs text-slate-500">
            Formatting: <span className="font-mono"># Heading</span>,{' '}
            <span className="font-mono">**bold**</span>, <span className="font-mono">- bullet</span>.
            Leave a blank line between paragraphs.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={current.is_active}
            className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
          />
          Show this page on the website
        </label>

        <div className="flex items-center gap-2 pt-1">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
