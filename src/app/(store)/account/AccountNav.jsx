'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'My orders' },
  { href: '/account/profile', label: 'Profile' },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 no-scrollbar">
      {tabs.map((tab) => {
        const active =
          tab.href === '/account' ? pathname === '/account' : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
