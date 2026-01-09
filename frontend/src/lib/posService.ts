import api from './api'

export interface Product {
  id: number
  sku?: string
  name: string
  description?: string
  price_usd: number
  cost_usd: number
  category_id?: number
  brand?: string
  model?: string
  is_active: boolean
  inventory_quantity?: number
  in_stock?: boolean
  category?: {
    id: number
    name: string
    description?: string
  }
}

export interface SaleItem {
  product_id: number
  quantity: number
}

export interface SaleCreate {
  items: SaleItem[]
  customer_id?: number
  payment_method: string
  payment_currency?: string
  notes?: string
}

export interface Sale {
  id: number
  customer_id?: number
  user_id: number
  total_usd: number
  total_ves: number
  exchange_rate: number
  payment_method: string
  payment_status: string
  notes?: string
  created_at: string
  items: {
    id: number
    product_id: number
    product_name?: string
    quantity: number
    unit_price_usd: number
    subtotal_usd: number
  }[]
}

const posService = {
  // Get all products with optional filters
  async getProducts(params?: {
    search?: string
    category_id?: number
    in_stock?: boolean
    skip?: number
    limit?: number
  }): Promise<Product[]> {
    const response = await api.get('/inventory/products', { params })
    return response.data
  },

  // Get categories
  async getCategories() {
    const response = await api.get('/inventory/categories')
    return response.data
  },

  // Create a new sale
  async createSale(saleData: SaleCreate): Promise<Sale> {
    const response = await api.post('/sales/', saleData)
    return response.data
  },

  // Get sale by ID
  async getSale(saleId: number): Promise<Sale> {
    const response = await api.get(`/sales/${saleId}/`)
    return response.data
  },

  // Get all sales
  async getSales(skip = 0, limit = 100): Promise<Sale[]> {
    const response = await api.get('/sales/', {
      params: { skip, limit }
    })
    return response.data
  },

  async exportSales(): Promise<void> {
    const response = await api.get('/sales/export-csv', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'historial_ventas.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}

export default posService
