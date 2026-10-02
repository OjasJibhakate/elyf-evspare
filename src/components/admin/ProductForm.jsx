'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import { slugify } from '@/lib/validation';

function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-5 py-3">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Saving…' : label}
    </button>
  );
}

export default function ProductForm({ action, categories, product }) {
  const [state, formAction] = useFormState(action, {});
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));

  const errors = state?.fieldErrors || {};

  function onNameChange(value) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Product details</h2>

            <Field label="Name *" error={errors.name}>
              <input
                name="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="input"
                placeholder="STEEL GUARD SL MODEL (2032)"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Web address (slug) *"
                hint="Used in the product link. Lowercase letters, numbers and dashes."
                error={errors.slug}
              >
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="input font-mono text-xs"
                  required
                />
              </Field>

              <Field label="Part number" hint="Customers search by this." error={errors.part_no}>
                <input
                  name="part_no"
                  defaultValue={product?.partNo || ''}
                  className="input"
                  placeholder="2032"
                />
              </Field>
            </div>

            <Field label="Description" hint="Basic formatting works: # heading, **bold**, - bullet">
              <textarea
                name="description"
                defaultValue={product?.description || ''}
                rows={10}
                className="input font-mono text-xs leading-5"
                placeholder={'# Heading\n\nWhat it fits, what it does…\n\n- point one\n- point two'}
              />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Photos</h2>
            <ImageUploader name="images" initial={product?.images || []} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Pricing &amp; stock</h2>

            <Field label="Price (₹) *" hint="Excludes GST." error={errors.price}>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.price ?? ''}
                className="input"
                required
              />
            </Field>

            <Field label="MRP (₹)" hint="Optional — shows a strikethrough price." error={errors.mrp}>
              <input
                name="mrp"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.mrp ?? ''}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Unit" error={errors.unit}>
                <input
                  name="unit"
                  defaultValue={product?.unit || 'PCS'}
                  className="input uppercase"
                  placeholder="PCS"
                />
              </Field>
              <Field label="Min. order" error={errors.moq}>
                <input
                  name="moq"
                  type="number"
                  min="1"
                  defaultValue={product?.moq ?? 1}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Stock" hint="Set to 0 to show as out of stock." error={errors.stock}>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
                className="input"
              />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Organisation</h2>

            <Field label="Category" error={errors.category_id}>
              <select name="category_id" defaultValue={product?.categoryId || ''} className="input">
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Link href="/admin/categories" className="text-xs font-semibold text-brand-800 hover:underline">
              Manage categories →
            </Link>

            <Field label="Tags" hint="Comma separated. Use “Discounted” for a deal badge.">
              <input
                name="tags"
                defaultValue={(product?.tags || []).join(', ')}
                className="input"
                placeholder="Discounted"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={product ? product.isActive : true}
                className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
              />
              Show on the store
            </label>
          </section>

          <div className="flex gap-2">
            <SubmitButton label={product ? 'Save changes' : 'Create product'} />
            <Link href="/admin/products" className="btn-outline px-5 py-3">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
