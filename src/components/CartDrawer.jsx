'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag, ArrowRight, Truck, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import QuantityStepper from '@/components/QuantityStepper';
import ProductImage from '@/components/ProductImage';
import { inr } from '@/lib/format';

export default function CartDrawer() {
  const { isOpen, closeCart, items, setQty, remove, subtotal, gst, shipping, total, lines, store } =
    useCart();
  const router = useRouter();

  if (!isOpen) return null;

  function go(path) {
    closeCart();
    router.push(path);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={closeCart} aria-hidden="true" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <ShoppingBag className="h-4 w-4 text-brand-800" />
            Your cart
            <span className="text-sm font-medium text-slate-500">({lines} items)</span>
          </h2>
          <button type="button" onClick={closeCart} className="btn-ghost" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-800">Your cart is empty</p>
            <p className="text-sm text-slate-500">
              Add spare parts to your cart and they will show up here.
            </p>
            <button type="button" onClick={() => go('/categories')} className="btn-brand mt-1">
              Browse categories
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.slug} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5"
                    >
                      <ProductImage src={item.image} alt={item.name} className="h-full w-full object-contain" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="clamp-2 text-sm font-semibold text-slate-800 hover:text-brand-800"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {inr(item.price)} / {item.unit}
                        {item.moq > 1 ? ` · min ${item.moq}` : ''}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QuantityStepper
                          size="sm"
                          value={item.qty}
                          min={item.moq}
                          onChange={(qty) => setQty(item, qty)}
                        />
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {inr(item.price * item.qty)}
                          </p>
                          <button
                            type="button"
                            onClick={() => remove(item.slug)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-slate-800">{inr(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>GST</dt>
                  <dd className="font-medium text-slate-800">{inr(gst)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt className="inline-flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> Shipping
                  </dt>
                  <dd className="font-medium text-slate-800">
                    {shipping === 0 ? 'Free' : inr(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                  <dt className="font-bold text-slate-900">Total</dt>
                  <dd className="font-bold text-slate-900">{inr(total)}</dd>
                </div>
              </dl>

              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => go('/checkout')} className="btn-primary w-full py-3">
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => go('/cart')} className="btn-outline w-full">
                    View cart
                  </button>
                  <a
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline w-full text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Prices exclude GST. Final invoice is shared before dispatch.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
