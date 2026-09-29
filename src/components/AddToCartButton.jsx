'use client';

import { useState } from 'react';
import { Check, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function AddToCartButton({
  product,
  quantity,
  variant = 'primary',
  size = 'md',
  label = 'Add',
  className = '',
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    add(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const sizing =
    size === 'lg' ? 'px-5 py-3 text-base' : size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 text-sm';

  const tone = variant === 'brand' ? 'btn-brand' : variant === 'outline' ? 'btn-outline' : 'btn-primary';

  return (
    <button type="button" onClick={onClick} className={`${tone} ${sizing} ${className}`}>
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added
        </>
      ) : size === 'sm' ? (
        <>
          <Plus className="h-3.5 w-3.5" /> {label}
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> {label}
        </>
      )}
    </button>
  );
}
