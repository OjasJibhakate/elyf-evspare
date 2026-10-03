import { store as storeDefaults, shippingMethods, paymentMethods, trustPoints } from '@/lib/config';

/**
 * Settings values that are safe to use in the browser.
 *
 * This file must stay free of server-only imports: the cart lives on the client
 * and needs the GST rates and shipping options, while the database read lives
 * in src/lib/settings.js.
 */

export const settingsDefaults = {
  store: {
    name: storeDefaults.name,
    tagline: storeDefaults.tagline,
    phone: storeDefaults.phone,
    phoneRaw: storeDefaults.phoneRaw,
    whatsapp: storeDefaults.whatsapp,
    email: storeDefaults.email,
    address: storeDefaults.address,
  },
  gst: { default: 0.18, charger: 0.05 },
  shipping: shippingMethods,
  payments: paymentMethods,
  trustPoints,
  storeOpen: true,
};

const CHARGER_CATEGORIES = ['lithium-battery-chargers', 'lead-acid-ev-chargers'];

export function gstRateFor(categorySlug, gst) {
  const rates = gst || settingsDefaults.gst;
  return CHARGER_CATEGORIES.includes(categorySlug) ? rates.charger : rates.default;
}

export function normaliseWhatsapp(value) {
  return String(value || '').replace(/[^\d]/g, '');
}
