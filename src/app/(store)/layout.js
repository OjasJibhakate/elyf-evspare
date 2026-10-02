import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { getCategories } from '@/lib/catalog';

export default async function StoreLayout({ children }) {
  const categories = await getCategories();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
