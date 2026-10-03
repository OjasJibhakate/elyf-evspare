'use client';

import { Truck, PartyPopper } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { inr } from '@/lib/format';

/**
 * Shows how much more the customer needs to spend to unlock free delivery, and
 * confirms it once they get there. Renders nothing when the selected method has
 * no threshold (store pickup) or the cart is empty.
 */
export default function FreeDeliveryNote({ className = '' }) {
  const {
    items,
    gross,
    freeDeliveryGap,
    freeDeliveryThreshold,
    freeDeliverySaving,
    shippingMethod,
  } = useCart();

  if (!items.length || !freeDeliveryThreshold) return null;
  if (Number(shippingMethod?.rate) === 0) return null;

  const progress = Math.min(100, Math.round((gross / freeDeliveryThreshold) * 100));

  if (freeDeliveryGap > 0) {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50 p-3 ${className}`}>
        <p className="flex items-start gap-2 text-xs font-medium text-amber-900">
          <Truck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Add <strong>{inr(freeDeliveryGap)}</strong> more to get{' '}
            <strong>free delivery</strong>
          </span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200/70">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-emerald-200 bg-emerald-50 p-3 ${className}`}>
      <p className="flex items-start gap-2 text-xs font-medium text-emerald-900">
        <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Free delivery unlocked.</strong>
          {freeDeliverySaving > 0 ? ` You saved ${inr(freeDeliverySaving)} on shipping.` : ''}
        </span>
      </p>
    </div>
  );
}
