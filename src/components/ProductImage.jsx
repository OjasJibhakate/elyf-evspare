'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function ProductImage({ src, alt, className = '', sizes }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 text-slate-300 ${className}`}>
        <ImageOff className="h-1/3 w-1/3 max-h-10 max-w-10" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      sizes={sizes}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
