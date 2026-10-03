import Link from 'next/link';
import { Mail, MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { getSettings } from '@/lib/settings';

export const metadata = {
  title: 'Contact us',
  description: 'Call or WhatsApp us for part availability, fitment help and bulk quotes.',
};

export const revalidate = 300;

export default async function ContactPage() {
  const { store } = await getSettings();
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Contact us</h1>
        <p className="mt-2 text-sm text-slate-500">
          Need help finding a part? Share your scooter model or part number and we will confirm
          availability the same day.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={`https://wa.me/${store.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="card flex items-start gap-4 p-5 transition hover:shadow-lift"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800">WhatsApp (fastest)</span>
              <span className="block text-sm text-slate-600">{store.phone}</span>
              <span className="mt-1 block text-xs text-slate-500">
                Send parts list, get rates and availability
              </span>
            </span>
          </a>

          <a href={`tel:+${store.phoneRaw}`} className="card flex items-start gap-4 p-5 transition hover:shadow-lift">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <Phone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800">Call us</span>
              <span className="block text-sm text-slate-600">{store.phone}</span>
              <span className="mt-1 block text-xs text-slate-500">Mon–Sat, 10am–7pm</span>
            </span>
          </a>

          <a href={`mailto:${store.email}`} className="card flex items-start gap-4 p-5 transition hover:shadow-lift">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800">Email</span>
              <span className="block text-sm text-slate-600">{store.email}</span>
              <span className="mt-1 block text-xs text-slate-500">For invoices and bulk enquiries</span>
            </span>
          </a>

          <div className="card flex items-start gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <MapPin className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-800">Warehouse</span>
              <span className="block text-sm text-slate-600">{store.address}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" /> Pickup by appointment
              </span>
            </span>
          </div>
        </div>

        <div className="card mt-6 p-6">
          <h2 className="text-base font-bold">Looking for a part that is not listed?</h2>
          <p className="mt-2 text-sm text-slate-600">
            We stock thousands of SKUs and can source most electric scooter spares on request. Send
            us the part photo or number on WhatsApp and we will get back with the price and lead
            time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Hi, I am looking for this part:')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <MessageCircle className="h-4 w-4" /> Send part enquiry
            </a>
            <Link href="/categories" className="btn-outline">
              Browse categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
