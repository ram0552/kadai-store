import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { totals } from '../utils/pricing.js';

const CartContext = createContext(null);
const KEY = 'kadai_cart';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load); // [{ product, qty }]

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable: cart just won't persist */
    }
  }, [items]);

  const value = useMemo(() => {
    const add = (product) =>
      setItems((prev) => {
        const found = prev.find((i) => i.product._id === product._id);
        if (!found) return [...prev, { product, qty: 1 }];
        return prev.map((i) =>
          i.product._id === product._id ? { ...i, qty: Math.min(i.qty + 1, product.stock, 20) } : i
        );
      });
    const setQty = (id, qty) =>
      setItems((prev) =>
        prev.map((i) => (i.product._id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.product.stock, 20)) } : i))
      );
    const remove = (id) => setItems((prev) => prev.filter((i) => i.product._id !== id));
    const clear = () => setItems([]);
    const count = items.reduce((n, i) => n + i.qty, 0);
    return { items, add, setQty, remove, clear, count, ...totals(items) };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
