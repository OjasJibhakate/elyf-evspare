'use client';

import Link from 'next/link';
import { ArrowRight, Trash2, ShoppingBag, Truck, BadgeIndianRupee, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import QuantityStepper from '@/components/QuantityStepper';
import ProductImage from '@/components/ProductImage';
import { inr } from '@/lib/format';
import { store, shippingMethods } from '@/lib/config';

export default function CartPage() {
  const {
    items,
    setQty,
    remove,
    clear,
    subtotal,
    gst,
    shipping,
    total,
    count,
    shippingId,
    setShippingId,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <ShoppingBag className="h-6 w-6 text-slate-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-slate-500">
            Browse our categories and add the parts you need — cart items stay saved on this device.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/categories" className="btn-brand">
              Browse categories
            </Link>
            <Link href="/" className="btn-outline">
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">
        Shopping cart <span className="text-base font-medium text-slate-500">({count} units)</span>
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="card divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.slug} className="flex gap-4 p-4 sm:p-5">
              <Link
                href={`/product/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 sm:h-28 sm:w-28"
              >
                <ProductImage src={item.image} alt={item.name} className="h-full w-full object-contain" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="clamp-2 text-sm font-semibold text-slate-800 hover:text-brand-800 sm:text-base"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.partNo ? `Part No. ${item.partNo.toUpperCase()} · ` : ''}
                      {inr(item.price)} / {item.unit}
                    </p>
                    {item.moq > 1 && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        Minimum order quantity {item.moq} {item.unit}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.slug)}
                    className="btn-ghost text-slate-400 hover:text-rose-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <QuantityStepper
                    value={item.qty}
                    min={item.moq}
                    onChange={(qty) => setQty(item, qty)}
                  />
                  <p className="text-base font-bold text-slate-900">{inr(item.price * item.qty)}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <Link href="/categories" className="text-sm font-semibold text-brand-800 hover:underline">
              ← Continue shopping
            </Link>
            <button type="button" onClick={clear} className="btn-ghost text-slate-500 hover:text-rose-600">
              Clear cart
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-base font-bold">Order summary</h2>

            <div className="mt-4 space-y-3">
              {shippingMethods
                .filter((m) => m.enabled)
                .map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      shippingId === m.id ? 'border-brand-800 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingId === m.id}
                      onChange={() => setShippingId(m.id)}
                      className="mt-0.5 h-4 w-4 text-brand-800 focus:ring-brand-800"
                    />
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{m.label}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {m.rate === 0 ? 'Free' : inr(m.rate)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{m.note}</span>
                    </span>
                  </label>
                ))}
            </div>

            <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal (excl. GST)</dt>
                <dd className="font-medium text-slate-800">{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt className="inline-flex items-center gap-1">
                  <BadgeIndianRupee className="h-3.5 w-3.5" /> GST
                </dt>
                <dd className="font-medium text-slate-800">{inr(gst)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Shipping
                </dt>
                <dd className="font-medium text-slate-800">{shipping === 0 ? 'Free' : inr(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-bold">Total payable</dt>
                <dd className="font-bold">{inr(total)}</dd>
              </div>
            </dl>

            <Link href="/checkout" className="btn-primary mt-5 w-full py-3 text-base">
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline mt-2 w-full text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" /> Send cart on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
