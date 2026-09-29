export const store = {
  name: 'ELYF EVSPARE',
  tagline: 'Electric Vehicle Spare Parts',
  phone: '+91 93258 80128',
  phoneRaw: '919325880128',
  whatsapp: '919325880128',
  email: 'ojasjibhakate2006@gmail.com',
  address: 'India',
  gstin: '',
  currency: 'INR',
  minOrderNote: 'Wholesale pricing — minimum order quantity applies per item.',
};

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
