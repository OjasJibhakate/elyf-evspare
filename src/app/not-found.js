import Link from 'next/link';
import { PackageSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <PackageSearch className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">That page went missing</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist. Try searching for the part number or browse
          our categories.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/categories" className="btn-brand">
            Browse categories
          </Link>
          <Link href="/" className="btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
