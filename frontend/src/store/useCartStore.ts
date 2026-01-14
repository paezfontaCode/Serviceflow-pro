import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItemType = "product" | "repair";

export interface CartItem {
  type: CartItemType;
  id: string; // Unique key: 'product_123' or 'repair_456'
  product_id?: number;
  repair_id?: number;
  name: string;
  description?: string; // For repairs: device model or problem
  price_usd: number;
  quantity: number;
  max_stock?: number; // Only for products
  sku?: string;
  // Repair-specific
  customer_name?: string;
  is_partial?: boolean; // If this is a partial payment
}

interface CartState {
  items: CartItem[];
  addProduct: (product: {
    product_id: number;
    name: string;
    price_usd: number;
    max_stock: number;
    sku?: string;
  }) => void;
  addRepair: (repair: {
    repair_id: number;
    name: string;
    description?: string;
    price_usd: number;
    customer_name?: string;
    is_partial?: boolean;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateRepairAmount: (id: string, amount: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalUSD: () => number;
  getProductItems: () => CartItem[];
  getRepairItems: () => CartItem[];
  hasRepairs: () => boolean;
  hasProducts: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addProduct: (product) => {
        const items = get().items;
        const itemId = `product_${product.product_id}`;
        const existingItem = items.find((item) => item.id === itemId);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + 1,
                      item.max_stock || 999
                    ),
                  }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                type: "product",
                id: itemId,
                product_id: product.product_id,
                name: product.name,
                price_usd: product.price_usd,
                quantity: 1,
                max_stock: product.max_stock,
                sku: product.sku,
              },
            ],
          });
        }
      },

      addRepair: (repair) => {
        const items = get().items;
        const itemId = `repair_${repair.repair_id}`;
        // Repairs are not stackable - replace if exists
        const filteredItems = items.filter((item) => item.id !== itemId);

        set({
          items: [
            ...filteredItems,
            {
              type: "repair",
              id: itemId,
              repair_id: repair.repair_id,
              name: repair.name,
              description: repair.description,
              price_usd: repair.price_usd,
              quantity: 1,
              customer_name: repair.customer_name,
              is_partial: repair.is_partial,
            },
          ],
        });
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(quantity, item.max_stock || 999) }
              : item
          ),
        });
      },

      updateRepairAmount: (id, amount) => {
        set({
          items: get().items.map((item) =>
            item.id === id && item.type === "repair"
              ? { ...item, price_usd: amount, is_partial: true }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalUSD: () => {
        return get().items.reduce(
          (total, item) => total + item.price_usd * item.quantity,
          0
        );
      },

      getProductItems: () => {
        return get().items.filter((item) => item.type === "product");
      },

      getRepairItems: () => {
        return get().items.filter((item) => item.type === "repair");
      },

      hasRepairs: () => {
        return get().items.some((item) => item.type === "repair");
      },

      hasProducts: () => {
        return get().items.some((item) => item.type === "product");
      },
    }),
    {
      name: "serviceflow-cart-storage-v3",
    }
  )
);

// Backward compatibility helper - legacy addItem
export const useLegacyAddItem = () => {
  const addProduct = useCartStore((state) => state.addProduct);
  return (product: {
    product_id: number;
    name: string;
    price_usd: number;
    max_stock: number;
    sku?: string;
  }) => {
    addProduct(product);
  };
};
