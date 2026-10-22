// Display-only. The server recalculates the real total from the database.
export const FREE_SHIPPING_ABOVE = 999; // keep in sync with server/services/order.service.js
export const SHIPPING_FEE = 49;

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function totals(items) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}
