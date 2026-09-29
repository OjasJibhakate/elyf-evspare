import './globals.css';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { getCategories } from '@/lib/catalog';
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

export default async function RootLayout({ children }) {
  const categories = await getCategories();

  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer categories={categories} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
