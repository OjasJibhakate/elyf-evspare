import Link from 'next/link';
import { store } from '@/lib/config';

export const metadata = {
  title: 'Terms & conditions',
  description: 'Pricing, GST, minimum order quantities and order confirmation terms.',
};

const sections = [
  {
    title: 'Pricing',
    body: [
      'All prices are listed in Indian Rupees (₹) and are exclusive of GST unless stated otherwise.',
      'GST is charged at 18% on most items and 5% on chargers. The applicable tax is shown at checkout before you place the order.',
      'Wholesale rates are subject to change with manufacturer price revisions. Where a price changes after your order is placed, we confirm the revised rate with you on WhatsApp before dispatch.',
    ],
  },
  {
    title: 'Minimum order quantity',
    body: [
      'Several SKUs are sold in minimum pack sizes (for example a set of 5 guards). The minimum order quantity is shown on each product page and enforced in the cart.',
      'Mixed-item orders are welcome — the minimum applies per item, not per order value.',
    ],
  },
  {
    title: 'Orders and confirmation',
    body: [
      'An order placed on this website is a purchase enquiry. Our team confirms stock, freight and the final invoice value on WhatsApp or phone before dispatch.',
      'If any part is unavailable we will inform you the same working day and suggest an alternative or issue a full refund for that item.',
    ],
  },
  {
    title: 'Warranty and replacements',
    body: [
      'Electrical parts carry the manufacturer warranty where applicable and are replaced if found dead on arrival.',
      'Report damaged or incorrect parts within 48 hours of delivery with photos of the parcel and the item.',
    ],
  },
  {
    title: 'Shipping and risk',
    body: [
      'We dispatch through reputed courier partners. Delivery timelines are indicative and depend on your location.',
      'Risk of loss or damage in transit is covered by the courier partner. Please inspect the parcel before accepting it where possible.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Terms &amp; conditions</h1>
        <p className="mt-2 text-sm text-slate-500">
          These terms apply to all orders placed with {store.name}.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.title} className="card p-6">
              <h2 className="text-base font-bold">{s.title}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {s.body.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-800" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Questions about these terms?{' '}
          <Link href="/contact" className="font-semibold text-brand-800 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
