'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ label = 'Print / save PDF' }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline px-5 py-3">
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
