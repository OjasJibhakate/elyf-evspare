import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
import { updateProduct } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }) {
  const supabase = createClient();

  const [{ data: row }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, slug, category_id, price, mrp, unit, moq, stock, part_no, description, images, tags, is_active, updated_at',
      )
      .eq('id', params.id)
      .single(),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  if (!row) notFound();

  const product = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id || '',
    price: row.price,
    mrp: row.mrp ?? '',
    unit: row.unit,
    moq: row.moq,
    stock: row.stock,
    partNo: row.part_no || '',
    description: row.description || '',
    images: Array.isArray(row.images) ? row.images : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    isActive: row.is_active,
  };

  const action = updateProduct.bind(null, row.id);

  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="clamp-2 text-2xl font-bold">{row.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Last updated {new Date(row.updated_at).toLocaleString('en-IN')}
          </p>
        </div>
        <Link href={`/product/${row.slug}`} target="_blank" className="btn-outline">
          <ExternalLink className="h-4 w-4" /> View on store
        </Link>
      </div>

      <ProductForm action={action} categories={categories || []} product={product} />
    </div>
  );
}
