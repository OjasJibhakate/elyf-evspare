import { notFound } from 'next/navigation';
import { getPage } from '@/lib/content';
import { markdownToHtml, excerpt } from '@/lib/markdown';

export const revalidate = 300;

/**
 * Custom pages created in /admin/pages (about, warranty, bulk terms…).
 * Static routes such as /cart and /contact always win — this only catches
 * slugs that do not exist as real pages.
 */
export async function generateMetadata({ params }) {
  const page = await getPage(params.slug);
  if (!page) return { title: 'Page not found' };
  return {
    title: page.title,
    description: excerpt(page.body, 150),
  };
}

export default async function CustomPage({ params }) {
  const page = await getPage(params.slug);
  if (!page) notFound();

  const bodyHtml = markdownToHtml(page.body);

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">{page.title}</h1>
        <section className="card mt-6 p-6">
          <div className="prose-elyf" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </section>
      </div>
    </div>
  );
}
