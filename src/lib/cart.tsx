import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  /** Unique per product + chosen variation. */
  id: string;
  productId: string;
  slug: string;
  name: string;
  /** e.g. "Colour: Midnight" — empty when the product has no variations. */
  variantLabel: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity" | "id"> & { id?: string }, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "altair-cart-v2";

export function lineId(productId: string, variantLabel: string) {
  return variantLabel ? `${productId}::${variantLabel}` : productId;
}

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
          const id = line.id ?? lineId(line.productId, line.variantLabel);
          const existing = current.find((l) => l.id === id);
          if (existing) {
            return current.map((l) =>
              l.id === id ? { ...l, quantity: l.quantity + quantity } : l,
            );
          }
          return [...current, { ...line, id, quantity }];
        }),
      setQuantity: (id, quantity) =>
        setLines((current) =>
          quantity <= 0
            ? current.filter((l) => l.id !== id)
            : current.map((l) => (l.id === id ? { ...l, quantity } : l)),
        ),
      remove: (id) => setLines((current) => current.filter((l) => l.id !== id)),
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
