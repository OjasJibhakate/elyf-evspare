'use client';

import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, min = 1, max, onChange, size = 'md' }) {
  const step = (delta) => {
    const next = Number(value) + delta;
    if (next < min) return;
    if (max && next > max) return;
    onChange(next);
  };

  const btn =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-10 w-10';
  const input = size === 'sm' ? 'h-8 w-12 text-sm' : 'h-10 w-16 text-base';

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={Number(value) <= min}
        className={`${btn} flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          if (raw === '') return;
          onChange(Number(raw));
        }}
        onBlur={(e) => {
          const n = Number(e.target.value) || min;
          onChange(Math.max(n, min));
        }}
        className={`${input} border-x border-slate-200 text-center font-semibold text-slate-900 focus:outline-none`}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => step(1)}
        className={`${btn} flex items-center justify-center text-slate-600 hover:bg-slate-50`}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
