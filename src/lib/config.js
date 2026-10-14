export const store = {
  name: 'Shri Ashapura Auto Part EV',
  tagline: 'EV Spare Parts · Mumbai',
  phone: '+91 90822 48351',
  phoneRaw: '919082248351',
  phone2: '+91 78925 15432',
  phone2Raw: '917892515432',
  whatsapp: '919082248351',
  email: 'shriashapura06@gmail.com',
  address: 'Shop No. 06, Ukaji House, Agiary Lane, Fort, Mumbai',
  gstin: '',
  currency: 'INR',
  minOrderNote: 'Wholesale pricing — minimum order quantity applies per item.',
};

/** Two letters for the square logo badge, derived from the shop name. */
export function storeInitials(name) {
  const words = String(name || '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w));
  if (!words.length) return 'EV';
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Chargers attract 5% GST, every other category is billed at 18%.
const GST_5_PERCENT = ['lithium-battery-chargers', 'lead-acid-ev-chargers'];

export function gstRate(categorySlug) {
  return GST_5_PERCENT.includes(categorySlug) ? 0.05 : 0.18;
}

export const shippingMethods = [
  {
    id: 'delivery',
    label: 'Courier delivery',
    note: 'Dispatched within 24–48 working hours',
    rate: 10,
    freeAbove: 5000,
    enabled: true,
  },
  {
    id: 'pickup',
    label: 'Store pickup',
    note: 'Collect from our warehouse — no shipping charge',
    rate: 0,
    freeAbove: null,
    enabled: true,
  },
];

/**
 * What this method costs for a basket of `gross` (subtotal + GST).
 *
 * Used by the storefront *and* by the order API, so the price a customer sees
 * is always the price the server charges.
 */
export function shippingFor(method, gross) {
  if (!method) return 0;
  const rate = Number(method.rate) || 0;
  if (rate === 0) return 0;
  if (method.freeAbove && gross >= method.freeAbove) return 0;
  return rate;
}

/** How much more the customer must spend to unlock free delivery, else 0. */
export function freeDeliveryGap(method, gross) {
  if (!method || !method.freeAbove) return 0;
  if (Number(method.rate) === 0) return 0;
  const gap = Number(method.freeAbove) - gross;
  return gap > 0 ? gap : 0;
}

export const paymentMethods = [
  { id: 'cod', label: 'Cash on delivery', note: 'Pay when the parcel reaches you', enabled: true },
  { id: 'upi', label: 'UPI / bank transfer', note: 'Account details shared on WhatsApp', enabled: true },
  { id: 'whatsapp', label: 'Confirm on WhatsApp', note: 'We share the final invoice on WhatsApp', enabled: true },
];

export const trustPoints = [
  { title: 'Genuine parts only', note: 'Sourced from verified manufacturers' },
  { title: 'Wholesale pricing', note: 'Direct rates for dealers and workshops' },
  { title: 'Pan-India delivery', note: 'Dispatched within 24–48 hours' },
  { title: 'GST invoice', note: 'Proper billing for business purchases' },
];
