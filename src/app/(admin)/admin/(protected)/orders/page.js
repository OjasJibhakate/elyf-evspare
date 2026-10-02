import { Clock } from 'lucide-react';

export const metadata = { title: 'Orders', robots: { index: false } };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every order, its status and the customer&apos;s details.
        </p>
      </div>

      <div className="card p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock className="h-3.5 w-3.5" /> Phase 3
        </span>
        <h2 className="mt-3 text-base font-bold">Orders move to the database next</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Right now a customer&apos;s order reaches you on WhatsApp and is stored in their browser
          only — the shop has no record of it. Phase 3 saves every order here, so you get:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {[
            'A searchable list of every order, by name, phone or order number',
            'Status tracking — New → Confirmed → Packed → Shipped → Delivered',
            'Print or download a GST invoice with one tap',
            'Message the customer on WhatsApp from the order screen',
            'Customer history: how much each shop has bought from you',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-800" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          The database tables for orders are already in place — this is the screen that reads them.
        </p>
      </div>
    </div>
  );
}
