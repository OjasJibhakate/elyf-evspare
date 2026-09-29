import Link from 'next/link';
import { productHref, inr, partNumberLabel, stockLabel } from '@/lib/format';
import ProductImage from '@/components/ProductImage';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductCard({ product, priority = false }) {
  const stock = stockLabel(product.stock);
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="group card flex flex-col overflow-hidden transition hover:shadow-lift">
      <Link href={productHref(product.slug)} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-white p-3">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
          />
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {discount > 0 && (
            <span className="rounded-md bg-accent-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {discount}% off
            </span>
          )}
          {product.tags?.includes('Discounted') && (
            <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
              Deal
            </span>
          )}
        </div>
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            stock.tone === 'ok'
              ? 'bg-emerald-50 text-emerald-700'
              : stock.tone === 'warn'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-700'
          }`}
        >
          {stock.text}
        </span>
      </Link>

      <div className="flex flex-1 flex-col border-t border-slate-100 p-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {product.categoryName}
        </p>
        <h3 className="mt-1 clamp-2 text-sm font-semibold leading-5 text-slate-800">
          <Link href={productHref(product.slug)} className="hover:text-brand-800">
            {product.name}
          </Link>
        </h3>
        {product.partNo && (
          <p className="mt-1 text-xs text-slate-500">{partNumberLabel(product.partNo)}</p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-base font-bold text-slate-900">
                {inr(product.price)}
                <span className="ml-1 text-xs font-medium text-slate-500">/ {product.unit}</span>
              </p>
              {product.mrp > product.price && (
                <p className="text-xs text-slate-400 line-through">{inr(product.mrp)}</p>
              )}
            </div>
            <AddToCartButton product={product} size="sm" label="Add" />
          </div>
          {product.moq > 1 && (
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              Min. order {product.moq} {product.unit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
