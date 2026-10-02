import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
import { createProduct } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add product' };

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Add product</h1>
        <p className="mt-1 text-sm text-slate-500">
          It appears on the store the moment you save.
        </p>
      </div>
      <ProductForm action={createProduct} categories={categories || []} />
    </div>
  );
}
