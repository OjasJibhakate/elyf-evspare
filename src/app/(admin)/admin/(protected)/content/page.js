import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Home page content', robots: { index: false } };

const ITEMS = [
  'Hero heading, sub-text, badge and buttons',
  'Which categories show on the home page and in what order',
  'Best sellers — pick the products yourself',
  'Bulk-quote banner text and WhatsApp button',
  'The four trust points',
];

export default function AdminContentPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Home page</h1>
        <p className="mt-1 text-sm text-slate-500">
          Edit the text and pictures visitors see first.
        </p>
      </div>

      <div className="card p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock className="h-3.5 w-3.5" /> Phase 2
        </span>
        <h2 className="mt-3 text-base font-bold">This screen is being built</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          The content blocks are already stored in the database and the home page reads them — the
          editing screen is the last piece. When it lands you will be able to change:
        </p>
        <ul className="mt-4 space-y-2">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-800" />
              {item}
            </li>
          ))}
        </ul>
        <Link href="/admin/products" className="btn-outline mt-5">
          Manage products instead <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
