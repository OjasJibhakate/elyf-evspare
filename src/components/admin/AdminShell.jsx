'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  LayoutTemplate,
  ShoppingBag,
  Settings,
  Users,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/content', label: 'Home page', icon: LayoutTemplate },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/team', label: 'Team', icon: Users, adminOnly: true },
];

export default function AdminShell({ profile, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => !item.adminOnly || profile.role === 'admin');

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  function isActive(item) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-brand-900">
          EV
        </span>
        <span className="text-sm font-bold text-white">ELYF EVSPARE</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          View store
        </Link>
        <div className="mt-2 rounded-lg bg-white/5 px-3 py-2.5">
          <p className="truncate text-xs font-medium text-white">{profile.email}</p>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{profile.role}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-900 lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button type="button" className="btn-ghost -ml-2" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold">ELYF EVSPARE admin</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-72 bg-slate-900">
            <button
              type="button"
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
