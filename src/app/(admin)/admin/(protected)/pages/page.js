import { createClient } from '@/lib/supabase/server';
import PagesEditor from './PagesEditor';
import { savePage } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pages', robots: { index: false } };

export default async function AdminPagesPage() {
  const supabase = createClient();
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, title, body, is_active')
    .order('slug');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Terms, shipping policy and any other text page. Edit and publish instantly.
        </p>
      </div>

      <PagesEditor action={savePage} pages={pages || []} />
    </div>
  );
}
