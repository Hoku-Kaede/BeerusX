import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getBazaarProduct, type BazaarProduct } from "./bazaar";

export type CartLine = {
  productId: string;
  variantId: string | null;
  qty: number;
};

export type BazaarUser = {
  name: string;
  email: string;
  signedIn: boolean;
};

export type BazaarOrder = {
  id: string;
  placedAt: string;
  items: Array<{ productId: string; variantId: string | null; qty: number; price: number }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: "processing" | "shipped" | "delivered";
  address: { name: string; line: string; city: string; zip: string };
};

type FlyRequest = {
  key: number;
  productId: string;
  variantId: string | null;
  rect: { x: number; y: number; width: number; height: number };
};

type BazaarState = {
  cart: CartLine[];
  wishlist: string[];
  recentlyViewed: string[];
  theme: "light" | "dark";
  user: BazaarUser | null;
  orders: BazaarOrder[];
  lastRemoved: { key: string; qty: number } | null;
  flyRequest: FlyRequest | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  addToCart: (productId: string, variantId: string | null, qty?: number) => void;
  requestFly: (rect: { x: number; y: number; width: number; height: number }) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  removeLine: (productId: string, variantId: string | null) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  addRecent: (productId: string) => void;
  removeRecent: (productId: string) => void;
  setUser: (user: BazaarUser | null) => void;
  placeOrder: (order: Omit<BazaarOrder, "id" | "placedAt">) => BazaarOrder;
  setLastRemoved: (key: string, qty: number) => void;
  clearLastRemoved: () => void;
  clearFlyRequest: () => void;
};

export const lineKey = (productId: string, variantId: string | null): string =>
  `${productId}::${variantId ?? "default"}`;

const initialState = {
  cart: [] as CartLine[],
  wishlist: [] as string[],
  recentlyViewed: [] as string[],
  theme: "light" as "light" | "dark",
  user: null as BazaarUser | null,
  orders: [] as BazaarOrder[],
  lastRemoved: null as { key: string; qty: number } | null,
  flyRequest: null as FlyRequest | null,
};

export const useBazaarStore = create<BazaarState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setTheme: (theme) => set({ theme }),
      addToCart: (productId, variantId, qty = 1) =>
        set((state) => {
          const existing = state.cart.find(
            (line) => line.productId === productId && line.variantId === variantId,
          );
          const cart = existing
            ? state.cart.map((line) =>
                line === existing ? { ...line, qty: Math.min(line.qty + qty, 99) } : line,
              )
            : [...state.cart, { productId, variantId, qty }];
          return { cart };
        }),
      requestFly: (rect, productId, variantId) =>
        set({ flyRequest: { key: Date.now(), productId, variantId, rect } }),
      setQty: (productId, variantId, qty) =>
        set((state) => ({
          cart:
            qty <= 0
              ? state.cart.filter((line) => line.productId !== productId || line.variantId !== variantId)
              : state.cart.map((line) =>
                  line.productId === productId && line.variantId === variantId ? { ...line, qty } : line,
                ),
        })),
      removeLine: (productId, variantId) =>
        set((state) => ({ cart: state.cart.filter((line) => line.productId !== productId || line.variantId !== variantId) })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),
      addRecent: (productId) =>
        set((state) => ({
          recentlyViewed: [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 12),
        })),
      removeRecent: (productId) => set((state) => ({ recentlyViewed: state.recentlyViewed.filter((id) => id !== productId) })),
      setUser: (user) => set({ user }),
      placeOrder: (order) => {
        const placed: BazaarOrder = { ...order, id: `BZ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, placedAt: new Date().toISOString() };
        set((state) => ({ orders: [placed, ...state.orders] }));
        return placed;
      },
          setLastRemoved: (key, qty) => set({ lastRemoved: { key, qty } }),
      clearLastRemoved: () => set({ lastRemoved: null }),
      clearFlyRequest: () => set({ flyRequest: null }),
      setCartOpen: (open) => set({ cartOpen: open }),
    }),
    {
      name: "bazaar-store",
      storage: createJSONStorage(() => {
        try {
          if (typeof window === "undefined") return undefined;
          return window.localStorage;
        } catch {
          return undefined;
        }
      }),
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        theme: state.theme,
        user: state.user,
        orders: state.orders,
      }),
      onError: () => {
        // Storage can be unavailable (private mode, quota); fail soft rather than crash.
      },
    },
  ),
);

export type BazaarStore = ReturnType<typeof useBazaarStore>;

export function useCartCount(): number {
  const cart = useBazaarStore((state) => state.cart);
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

export function useCartDetailed(): Array<{
  line: CartLine;
  product: BazaarProduct;
  variant: BazaarProduct["variants"][number] | null;
}> {
  const cart = useBazaarStore((state) => state.cart);
  return cart
    .map((line) => {
      const product = getBazaarProduct(line.productId);
      const variant = product?.variants.find((v) => v.id === line.variantId) ?? null;
      return { line, product, variant };
    })
    .filter((entry): entry is { line: CartLine; product: BazaarProduct; variant: BazaarProduct["variants"][number] | null } => Boolean(entry.product));
}
