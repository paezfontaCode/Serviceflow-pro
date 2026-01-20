import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useExchangeRateStore } from './exchangeRateStore';

// Product type for inventory items
interface Product {
  id: number;
  name: string;
  price_usd: number;
  sku?: string;
  stock: number;
  category_id: number;
}

// Repair order type for service items
interface RepairOrder {
  id: number;
  customer_id: number;
  customer_name: string;
  brand: string;
  model: string;
  remaining_balance: number;
  description: string;
  created_at?: string;
}

// Discriminated union for cart items
interface ProductCartItem {
  type: 'product';
  product: Product;
  quantity: number;
}

interface RepairCartItem {
  type: 'repair';
  repair: RepairOrder;
}

type CartItem = ProductCartItem | RepairCartItem;

interface CartState {
  items: CartItem[];
  currency: 'VES' | 'USD';
  exchangeRateSnapshot: number;
  selectedCustomerId: number | null;
  
  // Product methods
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  
  // Repair methods
  addRepairItem: (repair: RepairOrder) => void;
  removeRepairItem: (repairId: number) => void;
  
  // General methods
  clearCart: () => void;
  setCurrency: (currency: 'VES' | 'USD') => void;
  setSelectedCustomer: (customerId: number | null) => void;
  
  // Getters
  getProductItems: () => ProductCartItem[];
  getRepairItems: () => RepairCartItem[];
  getTotalUSD: () => number;
  getTotalVES: () => number;
  getProductTotalUSD: () => number;
  getRepairTotalUSD: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      currency: 'USD',
      exchangeRateSnapshot: 0,
      selectedCustomerId: null,

      addItem: (product, quantity = 1) => {
        const { items, exchangeRateSnapshot } = get();
        const currentRate = useExchangeRateStore.getState().rate;
        const rateToUse = exchangeRateSnapshot === 0 ? currentRate : exchangeRateSnapshot;

        const existingItem = items.find(
          (item): item is ProductCartItem => 
            item.type === 'product' && item.product.id === product.id
        );

        let newItems: CartItem[];
        if (existingItem) {
          newItems = items.map((item) =>
            item.type === 'product' && item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...items, { type: 'product', product, quantity }];
        }

        set({ items: newItems, exchangeRateSnapshot: rateToUse });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.type === 'product' && item.product.id === productId)
          ),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.type === 'product' && item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      addRepairItem: (repair) => {
        const { items, exchangeRateSnapshot } = get();
        const currentRate = useExchangeRateStore.getState().rate;
        const rateToUse = exchangeRateSnapshot === 0 ? currentRate : exchangeRateSnapshot;

        // Check if repair already exists
        const exists = items.some(
          (item): item is RepairCartItem => 
            item.type === 'repair' && item.repair.id === repair.id
        );

        if (exists) return; // Don't add duplicates

        set({ 
          items: [...items, { type: 'repair', repair }],
          exchangeRateSnapshot: rateToUse,
          // Automate customer selection
          selectedCustomerId: repair.customer_id
        });
      },

      removeRepairItem: (repairId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.type === 'repair' && item.repair.id === repairId)
          ),
        }));
      },

      clearCart: () => set({ 
        items: [], 
        exchangeRateSnapshot: 0,
        selectedCustomerId: null 
      }),

      setCurrency: (currency) => set({ currency }),
      
      setSelectedCustomer: (customerId) => set({ selectedCustomerId: customerId }),

      getProductItems: () => {
        return get().items.filter(
          (item): item is ProductCartItem => item.type === 'product'
        );
      },

      getRepairItems: () => {
        return get().items.filter(
          (item): item is RepairCartItem => item.type === 'repair'
        );
      },

      getProductTotalUSD: () => {
        const productItems = get().getProductItems();
        return productItems.reduce(
          (total, item) => total + item.product.price_usd * item.quantity, 
          0
        );
      },

      getRepairTotalUSD: () => {
        const repairItems = get().getRepairItems();
        return repairItems.reduce(
          (total, item) => total + item.repair.remaining_balance, 
          0
        );
      },

      getTotalUSD: () => {
        return get().getProductTotalUSD() + get().getRepairTotalUSD();
      },

      getTotalVES: () => {
        const { exchangeRateSnapshot } = get();
        const rate = exchangeRateSnapshot || useExchangeRateStore.getState().rate;
        return get().getTotalUSD() * rate;
      }
    }),
    {
      name: 'serviceflow-cart',
    }
  )
);
