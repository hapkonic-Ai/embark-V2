import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MentorshipCartItem = {
  id: string;
  type: "mentorship";
  mentorProfileId: number;
  mentorName: string;
  price: number;
  gdTotal: number;
  piTotal: number;
};

export type PlaybookCartItem = {
  id: string;
  type: "playbook";
  playbookId: number;
  title: string;
  price: number;
};

export type CartItem = MentorshipCartItem | PlaybookCartItem;

export type InsertCartItem =
  | Omit<MentorshipCartItem, "id">
  | Omit<PlaybookCartItem, "id">;

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: InsertCartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "embark-cart";

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStorage);

  useEffect(() => {
    writeStorage(items);
  }, [items]);

  const addItem = useCallback((item: InsertCartItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => {
        if (item.type === "mentorship" && i.type === "mentorship") {
          return i.mentorProfileId === item.mentorProfileId;
        }
        if (item.type === "playbook" && i.type === "playbook") {
          return i.playbookId === item.playbookId;
        }
        return false;
      });
      if (exists) return prev;
      const newItem: CartItem =
        item.type === "mentorship"
          ? {
              type: "mentorship",
              id: `mentorship-${item.mentorProfileId}-${Date.now()}`,
              mentorProfileId: item.mentorProfileId,
              mentorName: item.mentorName,
              price: item.price,
              gdTotal: item.gdTotal,
              piTotal: item.piTotal,
            }
          : {
              type: "playbook",
              id: `playbook-${item.playbookId}-${Date.now()}`,
              playbookId: item.playbookId,
              title: item.title,
              price: item.price,
            };
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addItem,
      removeItem,
      clearCart,
    }),
    [items, addItem, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
