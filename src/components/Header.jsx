'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Phone, ShoppingCart, Truck, X, ShieldCheck, BadgeIndianRupee } from 'lucide-react';
import SearchBox from '@/components/SearchBox';
import { useCart } from '@/context/CartContext';

export default function Header({ categories = [], settings }) {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const store = settings?.store || { name: 'ELYF EVSPARE', tagline: '', phone: '', phoneRaw: '' };

  return (
    <>
      <div className="bg-brand-900 text-white">
        <div className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-[11px] font-medium sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <BadgeIndianRupee className="h-3.5 w-3.5" /> Wholesale rates · GST invoice
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Dispatch in 24–48 hrs
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Genuine parts, verified suppliers
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container">
          <div className="flex items-center gap-3 py-3">
            <button
              type="button"
              className="btn-ghost -ml-2 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
                EV
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                  {store.name}
                </span>
                <span className="hidden text-[11px] text-slate-500 sm:block">{store.tagline}</span>
              </span>
            </Link>

            <div className="mx-auto hidden max-w-xl flex-1 md:block">
              <SearchBox />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <a
                href={`tel:+${store.phoneRaw}`}
                className="btn-ghost hidden text-slate-700 sm:inline-flex"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden text-sm font-medium lg:inline">{store.phone}</span>
              </a>
              <button type="button" onClick={openCart} className="btn-outline relative px-3 py-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">Cart</span>
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="pb-3 md:hidden">
            <SearchBox compact />
          </div>
        </div>

        <nav className="hidden border-t border-slate-100 lg:block">
          <div className="container flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
            <Link
              href="/categories"
              className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              All categories
            </Link>
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-bold">{store.name}</span>
              <button
                type="button"
                className="btn-ghost"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Shop by category
              </p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-slate-400">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <a
                href={`tel:+${store.phoneRaw}`}
                className="btn-brand mt-4 w-full"
                onClick={() => setMenuOpen(false)}
              >
                <Phone className="h-4 w-4" /> Call {store.phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
