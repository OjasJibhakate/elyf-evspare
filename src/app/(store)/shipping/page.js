import Link from 'next/link';
import { Truck, PackageCheck, RotateCcw, BadgeIndianRupee } from 'lucide-react';
import { shippingMethods, store } from '@/lib/config';

export const metadata = {
  title: 'Shipping & returns',
  description: 'Dispatch timelines, courier partners and replacement policy.',
};

export default function ShippingPage() {
  const delivery = shippingMethods.find((m) => m.id === 'delivery');

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Shipping &amp; returns</h1>
        <p className="mt-2 text-sm text-slate-500">
          Everything you need to know about dispatch, delivery timelines and replacements.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <Truck className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold">Dispatch</h2>
            <p className="mt-1 text-sm text-slate-600">
              Orders confirmed before 4pm are packed the same day. Remaining orders leave our
              warehouse within 24–48 working hours.
            </p>
          </div>
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <PackageCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold">Shipping charges</h2>
            <p className="mt-1 text-sm text-slate-600">
              Courier delivery {delivery ? `₹${delivery.rate}` : 'as per weight'}
              {delivery?.freeAbove ? `, free on orders above ₹${delivery.freeAbove}` : ''}. Store
              pickup is free.
            </p>
          </div>
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <RotateCcw className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold">Damaged or wrong parts</h2>
            <p className="mt-1 text-sm text-slate-600">
              Share an unboxing photo within 48 hours of delivery — we ship a replacement or issue a
              credit note, no questions asked.
            </p>
          </div>
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <BadgeIndianRupee className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold">GST invoice</h2>
            <p className="mt-1 text-sm text-slate-600">
              Every order ships with a proper GST invoice. Add your GSTIN at checkout to claim input
              credit.
            </p>
          </div>
        </div>

        <div className="card mt-6 p-6">
          <h2 className="text-base font-bold">Need to check your order status?</h2>
          <p className="mt-2 text-sm text-slate-600">
            WhatsApp us your order number and we will share the courier tracking link right away.
          </p>
          <a
            href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Hi, please share tracking for my order.')}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-4"
          >
            Track my order
          </a>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Questions? <Link href="/contact" className="font-semibold text-brand-800 hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
