const KEY = 'elyf.orders.v1';

export function saveOrder(order) {
  if (typeof window === 'undefined') return;
  try {
    const all = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    all[order.id] = order;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    /* ignore */
  }
}

export function getOrder(id) {
  if (typeof window === 'undefined') return null;
  try {
    const all = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return all[id] || null;
  } catch (e) {
    return null;
  }
}

export function newOrderId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `ELYF-${stamp}${rand}`;
}

export function orderToWhatsApp(order, store) {
  const lines = [];
  lines.push(`*New order ${order.id}*`);
  lines.push('');
  lines.push(`Name: ${order.customer.name}`);
  lines.push(`Phone: ${order.customer.phone}`);
  if (order.customer.email) lines.push(`Email: ${order.customer.email}`);
  lines.push('');
  lines.push('*Items*');
  order.items.forEach((i) => {
    lines.push(`• ${i.name} — ${i.qty} ${i.unit} x ₹${i.price} = ₹${(i.qty * i.price).toFixed(2)}`);
  });
  lines.push('');
  lines.push(`Subtotal: ₹${order.totals.subtotal.toFixed(2)}`);
  lines.push(`GST: ₹${order.totals.gst.toFixed(2)}`);
  lines.push(`Shipping: ₹${order.totals.shipping.toFixed(2)}`);
  lines.push(`*Total: ₹${order.totals.total.toFixed(2)}*`);
  lines.push('');
  lines.push(`Payment: ${order.payment.label}`);
  lines.push(`Shipping: ${order.shipping.label}`);
  if (order.customer.address) {
    lines.push('');
    lines.push('*Delivery address*');
    lines.push(order.customer.address);
    lines.push(`${order.customer.city || ''} ${order.customer.state || ''} ${order.customer.zip || ''}`.trim());
  }
  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}
