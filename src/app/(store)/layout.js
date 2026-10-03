import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { getCategories } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';

export default async function StoreLayout({ children }) {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <CartProvider settings={settings}>
      <div className="flex min-h-screen flex-col">
        <Header categories={categories} settings={settings} />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} settings={settings} />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
