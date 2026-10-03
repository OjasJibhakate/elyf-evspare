export const STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

export const STATUS_LABEL = {
  new: 'New',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_STYLE = {
  new: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  packed: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
};

/** What the customer is told each status means. */
export const STATUS_NOTE = {
  new: 'We have your order and will confirm it shortly.',
  confirmed: 'Confirmed — we are preparing your parts.',
  packed: 'Packed and waiting for the courier.',
  shipped: 'On its way to you.',
  delivered: 'Delivered. Thank you for your order.',
  cancelled: 'This order was cancelled.',
};

/** The happy path, in order. Cancelled sits outside it. */
export const PROGRESS = ['new', 'confirmed', 'packed', 'shipped', 'delivered'];

export function progressIndex(status) {
  return PROGRESS.indexOf(status);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
