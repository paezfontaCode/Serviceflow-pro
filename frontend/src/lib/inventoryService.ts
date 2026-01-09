import api from './api'
import { Product } from './posService'

export interface ProductFormData {
  sku?: string
  name: string
  description?: string
  price_usd: number
  cost_usd: number
  category_id?: number
  brand?: string
  model?: string
  initial_stock?: number
}

export interface StockAdjustmentData {
  quantity: number
  reason?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  is_active: boolean
}

const inventoryService = {
  // Products
  async getProducts(params?: {
    search?: string,
    category_id?: number,
    in_stock?: boolean,
    skip?: number,
    limit?: number
  }): Promise<Product[]> {
    const response = await api.get('/inventory/products/', { params })
    return response.data
  },

  async getProduct(id: number): Promise<Product> {
    const response = await api.get(`/inventory/products/${id}/`)
    return response.data
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await api.post('/inventory/products/', data)
    return response.data
  },

  async updateProduct(id: number, data: Partial<ProductFormData>): Promise<Product> {
    const response = await api.put(`/inventory/products/${id}/`, data)
    return response.data
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/inventory/products/${id}/`)
  },

  async adjustStock(id: number, data: StockAdjustmentData): Promise<any> {
    const response = await api.post(`/inventory/products/${id}/adjust-stock`, data)
    return response.data
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/inventory/categories/')
    return response.data
  },

  async exportProducts(): Promise<void> {
    const response = await api.get('/inventory/export-csv', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'inventario.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  async importProducts(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/inventory/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await api.post('/inventory/categories', data)
    return response.data
  },

  async updateCategory(id: number, data: Partial<{ name: string; description?: string }>): Promise<Category> {
    const response = await api.put(`/inventory/categories/${id}`, data)
    return response.data
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/inventory/categories/${id}`)
  }
}

export default inventoryService
