import './globals.css';
import { Inter } from 'next/font/google';
import { store } from '@/lib/config';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  title: {
    default: `${store.name} — ${store.tagline}`,
    template: `%s | ${store.name}`,
  },
  description:
    'Wholesale electric scooter spare parts — controllers, motors, chargers, brakes, body kits and more. Genuine parts, GST invoice, pan-India delivery.',
  keywords: [
    'EV spare parts',
    'electric scooter spare parts',
    'EV controller',
    'EV motor',
    'lithium battery charger',
    'EV body kit',
  ],
  openGraph: {
    title: `${store.name} — ${store.tagline}`,
    description: 'Wholesale electric scooter spare parts with GST invoice and pan-India delivery.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#154ba3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
