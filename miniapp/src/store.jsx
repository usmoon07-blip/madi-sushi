import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

const KEY = 'madi_cart_v1';
const CartContext = createContext(null);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'set': {
      const next = { ...state };
      const qty = Math.max(0, Math.min(50, action.qty));
      if (qty === 0) delete next[action.id];
      else next[action.id] = qty;
      return next;
    }
    case 'clear':
      return {};
    case 'prune': {
      const next = {};
      for (const [id, qty] of Object.entries(state)) if (action.ids.has(Number(id))) next[id] = qty;
      return next;
    }
    default:
      return state;
  }
}

export function CartProvider({ products, children }) {
  const [qtyById, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(qtyById));
    } catch {
      /* ignore */
    }
  }, [qtyById]);

  // Menyudan olib tashlangan mahsulotlarni savatdan tozalash
  useEffect(() => {
    if (products.length) dispatch({ type: 'prune', ids: new Set(products.map((p) => p.id)) });
  }, [products]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = useMemo(
    () =>
      Object.entries(qtyById)
        .map(([id, qty]) => ({ product: byId.get(Number(id)), qty }))
        .filter((l) => l.product),
    [qtyById, byId]
  );

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
      qtyOf: (id) => qtyById[id] || 0,
      setQty: (id, qty) => dispatch({ type: 'set', id, qty }),
      add: (id, n = 1) => dispatch({ type: 'set', id, qty: (qtyById[id] || 0) + n }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [lines, qtyById]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

// Kichik global toast
let toastListener = null;
export const toast = (text, tone = 'default') => toastListener?.({ text, tone, id: Date.now() });
export const useToastListener = (fn) => {
  const cb = useCallback(fn, [fn]);
  useEffect(() => {
    toastListener = cb;
    return () => {
      toastListener = null;
    };
  }, [cb]);
};
