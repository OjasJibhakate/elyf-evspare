import Link from 'next/link';
import { Mail, MapPin, MessageCircle, Phone, Truck, ShieldCheck, BadgeIndianRupee, Clock } from 'lucide-react';
import { store, trustPoints } from '@/lib/config';

const trustIcons = [ShieldCheck, BadgeIndianRupee, Truck, Clock];

export default function Footer({ categories = [] }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="container">
        <div className="grid gap-4 border-b border-slate-200 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, i) => {
            const Icon = trustIcons[i % trustIcons.length];
            return (
              <div key={point.title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-800 shadow-card">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{point.title}</span>
                  <span className="block text-xs text-slate-500">{point.note}</span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
                EV
              </span>
              <span className="text-sm font-bold text-slate-900">{store.name}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Wholesale supplier of electric scooter spare parts — controllers, motors, chargers,
              brakes, body kits and every small fitting your workshop needs.
            </p>
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-4"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Categories</h3>
            <ul className="mt-3 space-y-2">
              {categories.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-slate-600 hover:text-brand-800">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="text-sm font-semibold text-brand-800 hover:underline">
                  View all categories →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Help</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-slate-600 hover:text-brand-800">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-slate-600 hover:text-brand-800">
                  Shipping &amp; returns
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-600 hover:text-brand-800">
                  Terms &amp; conditions
                </Link>
              </li>
              <li>
                <Link href="/search?q=charger" className="text-sm text-slate-600 hover:text-brand-800">
                  Popular: chargers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Get in touch</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li>
                <a href={`tel:+${store.phoneRaw}`} className="inline-flex items-center gap-2 hover:text-brand-800">
                  <Phone className="h-4 w-4 text-brand-800" /> {store.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${store.email}`} className="inline-flex items-center gap-2 hover:text-brand-800">
                  <Mail className="h-4 w-4 text-brand-800" /> {store.email}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-800" /> {store.address}
              </li>
              <li className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-800" /> Mon–Sat, 10am–7pm
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>
          <p>Prices in INR, exclusive of GST unless stated otherwise.</p>
        </div>
      </div>
    </footer>
  );
}
