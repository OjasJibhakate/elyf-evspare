'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { isDefaultFocus, normaliseFocus } from '@/lib/image-focus';

/**
 * Image with an optional focal point.
 *
 * `focus` only matters for images displayed with object-cover — a square
 * thumbnail and a wide tile crop the same photo very differently. When it is
 * absent nothing changes, so product photos behave exactly as before.
 *
 * Zoom is applied to a wrapper rather than the <img> itself, because an inline
 * transform would silently beat the `group-hover:scale-105` class the tiles use.
 */
export default function ProductImage({ src, alt, className = '', sizes, focus }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 text-slate-300 ${className}`}>
        <ImageOff className="h-1/3 w-1/3 max-h-10 max-w-10" />
      </div>
    );
  }

  const adjusted = focus && !isDefaultFocus(focus);
  const f = adjusted ? normaliseFocus(focus) : null;

  const image = (
    <img
      src={src}
      alt={alt || ''}
      sizes={sizes}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      style={f ? { objectPosition: `${f.x}% ${f.y}%` } : undefined}
    />
  );

  if (f && f.zoom !== 1) {
    return (
      <div
        className="h-full w-full"
        style={{ transform: `scale(${f.zoom})`, transformOrigin: `${f.x}% ${f.y}%` }}
      >
        {image}
      </div>
    );
  }

  return image;
}
