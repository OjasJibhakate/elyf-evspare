import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSettings } from '@/lib/settings';
import { gstRateFor } from '@/lib/settings-shared';
import { shippingFor } from '@/lib/config';

/**
 * Order creation, server side.
 *
 * The browser sends ONLY product ids and quantities. Everything that costs
 * money — unit price, line total, GST, shipping, grand total — is recomputed
 * here from the database. A tampered request that claims ₹1 for a ₹14,990 motor
 * simply has its numbers ignored.
 */

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 10_000;

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function orderNumber() {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `ELYF-${stamp}-${random}`;
}

function clean(value, max = 200) {
  return String(value ?? '').trim().slice(0, max);
}

export async function createOrder(payload) {
  const settings = await getSettings();

  if (!settings.storeOpen) {
    throw new OrderError('The store is not accepting orders right now.', 409);
  }

  const lines = Array.isArray(payload?.items) ? payload.items.slice(0, MAX_LINES) : [];
  if (!lines.length) throw new OrderError('Your cart is empty.');

  const slugs = [...new Set(lines.map((l) => clean(l.slug, 120)).filter(Boolean))];
  if (!slugs.length) throw new OrderError('Your cart is empty.');

  const name = clean(payload?.customer?.name, 120);
  const phone = clean(payload?.customer?.phone, 20).replace(/[^\d]/g, '');
  const email = clean(payload?.customer?.email, 160);
  const business = clean(payload?.customer?.business, 160);
  const gstin = clean(payload?.customer?.gstin, 20);

  if (!name) throw new OrderError('Please enter your name.');
  if (!/^[6-9]\d{9}$/.test(phone.slice(-10))) throw new OrderError('Please enter a valid mobile number.');

  const admin = createAdminClient();

  // ---- prices come from the database, never from the browser ---------------
  const { data: products, error } = await admin
    .from('products')
    .select('id, name, slug, price, unit, moq, stock, category_id, images, part_no, is_active')
    .in('slug', slugs);

  if (error) throw new OrderError('Could not read the catalogue. Please try again.', 500);

  const bySlug = new Map((products || []).map((p) => [p.slug, p]));

  const { data: categories } = await admin.from('categories').select('id, slug');
  const categorySlugById = new Map((categories || []).map((c) => [c.id, c.slug]));

  const items = [];
  for (const line of lines) {
    const slug = clean(line.slug, 120);
    const product = bySlug.get(slug);
    if (!product || !product.is_active) {
      throw new OrderError('One of the items is no longer available. Please review your cart.', 409);
    }

    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty <= 0) throw new OrderError('Invalid quantity in the cart.');
    if (qty > MAX_QTY_PER_LINE) throw new OrderError('Quantity is too large.');

    const moq = Number(product.moq) || 1;
    if (qty < moq) {
      throw new OrderError(`${product.name} has a minimum order of ${moq} ${product.unit}.`, 409);
    }

    items.push({
      slug: product.slug,
      name: product.name,
      partNo: product.part_no || '',
      unit: product.unit,
      moq,
      price: Number(product.price),
      qty,
      category: categorySlugById.get(product.category_id) || '',
      image: Array.isArray(product.images) ? product.images[0] || '' : '',
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const gst = items.reduce((sum, i) => sum + i.price * i.qty * gstRateFor(i.category, settings.gst), 0);

  const requestedShipping = clean(payload?.shipping?.id, 20);
  const method =
    settings.shipping.find((m) => m.id === requestedShipping && m.enabled !== false) ||
    settings.shipping.find((m) => m.enabled !== false) ||
    settings.shipping[0];

  if (!method) throw new OrderError('No delivery method is available right now.', 409);

  const gross = subtotal + gst;
  const shippingCost = shippingFor(method, gross);

  const requestedPayment = clean(payload?.payment?.id, 20);
  const payment =
    settings.payments.find((p) => p.id === requestedPayment && p.enabled !== false) ||
    settings.payments.find((p) => p.enabled !== false);
  if (!payment) throw new OrderError('No payment method is available right now.', 409);

  const address = payload?.customer?.address
    ? {
        line: clean(payload.customer.address, 300),
        city: clean(payload.customer.city, 80),
        state: clean(payload.customer.state, 80),
        zip: clean(payload.customer.zip, 10),
        notes: clean(payload.customer.notes, 200),
      }
    : null;

  if (method.id !== 'pickup') {
    if (!address?.line) throw new OrderError('Please enter the delivery address.');
    if (!/^\d{6}$/.test(address.zip)) throw new OrderError('Please enter a valid 6-digit pincode.');
  }

  const total = Math.round((gross + shippingCost) * 100) / 100;

  const { data: created, error: insertError } = await admin
    .from('orders')
    .insert({
      order_no: orderNumber(),
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      business_name: business || null,
      gstin: gstin || null,
      shipping_address: address,
      shipping_method: { id: method.id, label: method.label, note: method.note },
      payment_method: { id: payment.id, label: payment.label },
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      shipping: shippingCost,
      total,
      status: 'new',
    })
    .select('id, order_no, lookup_token, created_at')
    .single();

  if (insertError) {
    console.error('[orders] insert failed', insertError);
    throw new OrderError('Could not save your order. Please try again.', 500);
  }

  await admin.from('order_events').insert({
    order_id: created.id,
    status: 'new',
    note: 'Order placed on the website',
  });

  return {
    id: created.id,
    orderNo: created.order_no,
    token: created.lookup_token,
    total,
    createdAt: created.created_at,
  };
}

/** Reads a single order by its secret token — used by the confirmation page. */
export async function getOrderByToken(token) {
  if (!/^[0-9a-f-]{36}$/i.test(String(token || ''))) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select(
      'id, order_no, customer_name, customer_phone, business_name, shipping_address, shipping_method, payment_method, items, subtotal, gst, shipping, total, status, created_at',
    )
    .eq('lookup_token', token)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getOrderEvents(orderId) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('order_events')
    .select('status, note, created_at')
    .eq('order_id', orderId)
    .order('created_at');
  return data || [];
}
