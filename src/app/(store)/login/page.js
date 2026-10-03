import Link from 'next/link';
import { PackageCheck, History, Truck } from 'lucide-react';
import LoginForm from './LoginForm';
import { safeNext } from '@/lib/safe-next';

export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

const perks = [
  { icon: History, title: 'Your order history', note: 'Every order you have placed, in one place' },
  { icon: Truck, title: 'Track deliveries', note: 'See exactly where your parcel is' },
  { icon: PackageCheck, title: 'Faster checkout', note: 'Your address and GSTIN filled in already' },
];

export default function LoginPage({ searchParams }) {
  const next = safeNext(searchParams?.next, '/account');

  return (
    <div className="container py-12">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 md:items-center">
        <div className="order-2 md:order-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to see your orders and track your deliveries.
          </p>

          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
            <p className="text-sm font-semibold text-brand-900">Why create an account?</p>
            <ul className="mt-4 space-y-4">
              {perks.map(({ icon: Icon, title, note }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-800 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-800">{title}</span>
                    <span className="block text-xs text-slate-500">{note}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-brand-100 pt-4 text-xs text-slate-500">
              Prefer not to? You can still{' '}
              <Link href="/categories" className="font-medium text-brand-800 hover:underline">
                order without an account
              </Link>{' '}
              — we only need your delivery details at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
