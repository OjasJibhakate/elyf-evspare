import { getContent } from '@/lib/content';
import { getSettings } from '@/lib/settings';
import HomeContentForm from './HomeContentForm';
import { saveHomeContent } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Home page', robots: { index: false } };

export default async function AdminContentPage() {
  const [content, settings] = await Promise.all([getContent(), getSettings()]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Home page</h1>
        <p className="mt-1 text-sm text-slate-500">
          The words and buttons visitors see first. Changes go live the moment you save.
        </p>
      </div>

      <HomeContentForm action={saveHomeContent} content={content} store={settings.store} />
    </div>
  );
}
