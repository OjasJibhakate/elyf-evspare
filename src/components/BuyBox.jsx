'use client';

import { useState } from 'react';
import { ShoppingCart, MessageCircle, Truck, ShieldCheck, PackageCheck } from 'lucide-react';
import QuantityStepper from '@/components/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { inr, stockPhrase } from '@/lib/format';

export default function BuyBox({ product }) {
  const { add, store } = useCart();
  const [qty, setQty] = useState(product.moq || 1);
  const lineTotal = product.price * qty;

  const whatsappText = `Hi, I want to order:\n\n${product.name}\nQty: ${qty} ${product.unit}\nPrice: ₹${product.price}/${product.unit}\nTotal: ₹${lineTotal.toFixed(2)}`;

  return (
    <div className="card p-5 lg:sticky lg:top-24">
      <div className="flex items-end gap-3">
        <p className="text-3xl font-bold text-slate-900">{inr(product.price)}</p>
        <span className="pb-1 text-sm font-medium text-slate-500">/ {product.unit}</span>
        {product.mrp > product.price && (
          <span className="pb-1 text-sm text-slate-400 line-through">{inr(product.mrp)}</span>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Price excludes GST ·{' '}
        {product.category === 'lithium-battery-chargers' || product.category === 'lead-acid-ev-chargers'
          ? '5% GST'
          : '18% GST'}{' '}
        applied at checkout
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
        <span className="text-xs font-medium text-slate-600">Minimum order</span>
        <span className="text-sm font-semibold text-slate-800">
          {product.moq} {product.unit}
        </span>
      </div>

      <div className="mt-4">
        <p className="label">Quantity ({product.unit})</p>
        <div className="flex items-center gap-3">
          <QuantityStepper value={qty} min={product.moq} onChange={setQty} />
          <div className="text-right">
            <p className="text-xs text-slate-500">Line total</p>
            <p className="text-base font-bold text-slate-900">{inr(lineTotal)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={() => add(product, qty)}
          className="btn-primary w-full py-3 text-base"
        >
          <ShoppingCart className="h-5 w-5" /> Add to cart
        </button>
        <a
          href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline w-full py-3 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
        >
          <MessageCircle className="h-4 w-4" /> Order on WhatsApp
        </a>
      </div>

      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
        <li className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 shrink-0 text-brand-800" />
          {stockPhrase(product.stock, product.unit)}
        </li>
        <li className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0 text-brand-800" /> Dispatched within 24–48 working hours
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand-800" /> GST invoice provided for business orders
        </li>
      </ul>
    </div>
  );
}
