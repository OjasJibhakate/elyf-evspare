'use client';

import { useState } from 'react';
import ProductImage from '@/components/ProductImage';

export default function ProductGallery({ images, alt }) {
  const [active, setActive] = useState(0);
  const list = images && images.length ? images : [''];

  return (
    <div className="lg:sticky lg:top-24">
      <div className="card overflow-hidden">
        <div className="aspect-square bg-white p-4">
          <ProductImage
            key={list[active]}
            src={list[active]}
            alt={alt}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {list.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1.5 transition ${
                i === active ? 'border-brand-800' : 'border-slate-200 hover:border-slate-300'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <ProductImage src={img} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
