import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: number
  name: string
  price_usd: number
  quantity: number
  max_stock: number
  sku?: string
}

interface CartState {
  items: CartItem[]
  addItem: (product: Omit<CartItem, 'quantity'>) => void
  removeItem: (product_id: number) => void
  updateQuantity: (product_id: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalUSD: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        const items = get().items
        const existingItem = items.find(item => item.product_id === product.product_id)
        
        if (existingItem) {
          // Increment quantity if item exists
          set({
            items: items.map(item =>
              item.product_id === product.product_id
                ? { ...item, quantity: Math.min(item.quantity + 1, item.max_stock) }
                : item
            )
          })
        } else {
          // Add new item
          set({
            items: [...items, { ...product, quantity: 1 }]
          })
        }
      },
      
      removeItem: (product_id) => {
        set({
          items: get().items.filter(item => item.product_id !== product_id)
        })
      },
      
      updateQuantity: (product_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(product_id)
          return
        }
        
        set({
          items: get().items.map(item =>
            item.product_id === product_id
              ? { ...item, quantity: Math.min(quantity, item.max_stock) }
              : item
          )
        })
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalUSD: () => {
        return get().items.reduce((total, item) => total + (item.price_usd * item.quantity), 0)
      }
    }),
    {
      name: 'serviceflow-cart-storage-v2',
    }
  )
)
