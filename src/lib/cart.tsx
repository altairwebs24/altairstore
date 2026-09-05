import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "altair-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota errors */
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
      add: (line, quantity = 1) =>
        setLines((current) => {
          const existing = current.find((l) => l.productId === line.productId);
          if (existing) {
            return current.map((l) =>
              l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l,
            );
          }
          return [...current, { ...line, quantity }];
        }),
      setQuantity: (productId, quantity) =>
        setLines((current) =>
          quantity <= 0
            ? current.filter((l) => l.productId !== productId)
            : current.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
        ),
      remove: (productId) => setLines((current) => current.filter((l) => l.productId !== productId)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
