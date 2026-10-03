'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2, Save, Image as ImageIcon, Star, Sparkles } from 'lucide-react';
import ProductPicker from '@/components/admin/ProductPicker';

function SubmitButton({ label = 'Save home page' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-5 py-3">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Saving…' : label}
    </button>
  );
}

function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function HomeContentForm({ action, content, store }) {
  const [state, formAction] = useFormState(action, {});
  const { hero, bulk_banner: banner, trust_points: trust, sections } = content;
  const sectionState = (key) =>
    sections.items.find((s) => s.key === key)?.enabled !== false;

  return (
    <form action={formAction} className="space-y-6">
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Saved. The live site has been refreshed.
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}

      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Star className="h-4 w-4 text-accent-500" /> Products shown on the home page
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Pick exactly which products appear. Leave a section empty and the store chooses
          automatically so the page is never blank.
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-bold">Hero collage</h3>
            </div>
            <ProductPicker
              name="hero_products"
              label="The four tiles beside the headline"
              hint="Square photos look best here."
              limit={4}
              initial={content.hero_products.items}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-bold">Best sellers</h3>
            </div>
            <ProductPicker
              name="featured_products"
              label="The product grid in the middle of the page"
              hint="These are the parts you want to push hardest."
              limit={8}
              initial={content.featured_products.items}
            />
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          The “Newly listed” section always shows the newest products added to the catalogue, so it
          stays fresh on its own.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-bold">Sections shown on the home page</h2>
        <p className="mt-1 text-xs text-slate-500">
          Untick anything you do not want visitors to see. The order is fixed.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: 'hero', label: 'Hero banner' },
            { key: 'categories', label: 'Shop by category' },
            { key: 'bestsellers', label: 'Best sellers' },
            { key: 'bulk_banner', label: 'Bulk quote banner' },
            { key: 'new_arrivals', label: 'Newly listed' },
          ].map((s) => (
            <label
              key={s.key}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name={`section_${s.key}_enabled`}
                defaultChecked={sectionState(s.key)}
                className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
              />
              <input type="hidden" name={`section_${s.key}_label`} value={s.label} />
              {s.label}
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="text-base font-bold">Hero banner</h2>
          <p className="-mt-2 text-xs text-slate-500">
            The big blue block at the top of the home page.
          </p>

          <Field label="Small badge" hint="Shown above the headline.">
            <input name="hero_badge" defaultValue={hero.badge} className="input" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Headline — first line">
              <input name="hero_heading" defaultValue={hero.heading} className="input" />
            </Field>
            <Field label="Headline — highlighted line" hint="Shown in orange.">
              <input name="hero_heading_accent" defaultValue={hero.heading_accent} className="input" />
            </Field>
          </div>

          <Field label="Paragraph">
            <textarea
              name="hero_subheading"
              defaultValue={hero.subheading}
              rows={3}
              className="input resize-none"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Main button text">
              <input name="hero_primary_label" defaultValue={hero.primary_cta_label} className="input" />
            </Field>
            <Field label="Main button link">
              <input name="hero_primary_href" defaultValue={hero.primary_cta_href} className="input font-mono text-xs" />
            </Field>
            <Field label="Second button text">
              <input name="hero_secondary_label" defaultValue={hero.secondary_cta_label} className="input" />
            </Field>
            <Field label="Second button link">
              <input name="hero_secondary_href" defaultValue={hero.secondary_cta_href} className="input font-mono text-xs" />
            </Field>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Bulk quote banner</h2>
            <p className="-mt-2 text-xs text-slate-500">
              The card that invites dealers to ask for a price on WhatsApp.
            </p>

            <Field label="Small chip text">
              <input name="banner_chip" defaultValue={banner.chip} className="input" />
            </Field>
            <Field label="Headline">
              <input name="banner_heading" defaultValue={banner.heading} className="input" />
            </Field>
            <Field label="Paragraph">
              <textarea
                name="banner_body"
                defaultValue={banner.body}
                rows={3}
                className="input resize-none"
              />
            </Field>
            <Field label="Button text" hint="Always opens WhatsApp with the number from Settings.">
              <input name="banner_cta_label" defaultValue={banner.cta_label} className="input" />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Trust points</h2>
            <p className="-mt-2 text-xs text-slate-500">
              The four badges above the footer, on every page.
            </p>

            {[0, 1, 2, 3].map((i) => {
              const item = trust.items[i] || { title: '', note: '' };
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-2">
                  <input
                    name={`trust_${i}_title`}
                    defaultValue={item.title}
                    className="input"
                    placeholder="Genuine parts only"
                  />
                  <input
                    name={`trust_${i}_note`}
                    defaultValue={item.note}
                    className="input"
                    placeholder="One line of detail"
                  />
                </div>
              );
            })}
          </section>

          <div className="flex items-center gap-2">
            <SubmitButton />
          </div>
          <p className="text-xs text-slate-500">
            Orders still reach you on WhatsApp at{' '}
            <span className="font-semibold">{store.phone}</span>. Change that in Settings.
          </p>
        </div>
      </div>
    </form>
  );
}
