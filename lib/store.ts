import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Custom design payload from design studio (stored on cart item and order item) */
export interface CustomDesignPayload {
  elements?: unknown[];
  elementsBack?: unknown[];
  shirtColor?: string;
  size?: string;
  quantitiesBySize?: Record<string, number>;
  productId?: string;
  productSlug?: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantSize: string;
  price: number;
  quantity: number;
  image: string;
  isBackorder?: boolean;
  /** When set, this line is a custom design; do not merge with other lines */
  customDesign?: CustomDesignPayload;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string) => void;
  removeItemAt: (index: number) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  updateQuantityAt: (index: number, quantity: number) => void;
  updateItemPrice: (variantId: string, newPrice: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          // Custom design lines are never merged (each design is a separate line)
          if (item.customDesign !== undefined && item.customDesign !== null) {
            return {
              items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
            };
          }
          // Find existing item with same product/variant (considering backorder status)
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId && i.isBackorder === item.isBackorder && i.customDesign == null
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantId === item.variantId && i.isBackorder === item.isBackorder && i.customDesign == null
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity: item.quantity || 1 }],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }));
      },
      /** Remove by productId + variantId + optional customDesign identity (for custom lines, same product+variant can appear multiple times) */
      removeItemAt: (index: number) => {
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === productId && i.variantId === variantId && i.customDesign == null
          );
          if (idx === -1) {
            const customIdx = state.items.findIndex(
              (i) => i.productId === productId && i.variantId === variantId
            );
            if (customIdx === -1) return state;
            return {
              items: state.items.map((i, n) => (n === customIdx ? { ...i, quantity } : i)),
            };
          }
          return {
            items: state.items.map((i, n) =>
              n === idx ? { ...i, quantity } : i
            ),
          };
        });
      },

      updateQuantityAt: (index, quantity) => {
        if (quantity <= 0) {
          get().removeItemAt(index);
          return;
        }
        set((state) => ({
          items: state.items.map((i, n) => (n === index ? { ...i, quantity } : i)),
        }));
      },

      updateItemPrice: (variantId, newPrice) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, price: newPrice }
              : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

