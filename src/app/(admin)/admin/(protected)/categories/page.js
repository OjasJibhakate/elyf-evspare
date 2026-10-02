import { FolderTree } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CategoryManager from './CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, image_url, position, is_active')
      .order('position')
      .order('name'),
    supabase.from('products').select('category_id'),
  ]);

  const counts = (products || []).reduce((acc, p) => {
    if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {});

  const rows = (categories || []).map((c) => ({ ...c, count: counts[c.id] || 0 }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <FolderTree className="h-4 w-4" />
          {rows.length} categories · order here controls the home page and the menu
        </p>
      </div>

      <CategoryManager categories={rows} />
    </div>
  );
}
