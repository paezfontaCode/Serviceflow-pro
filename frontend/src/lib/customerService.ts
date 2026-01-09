import api from './api'

export interface Customer {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  dni?: string
  created_at: string
}

export interface CustomerFormData {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  dni?: string
}

const customerService = {
  async getCustomers(search?: string): Promise<Customer[]> {
    const response = await api.get('/customers/', { params: { search } })
    return response.data
  },

  async getCustomer(id: number): Promise<Customer> {
    const response = await api.get(`/customers/${id}`)
    return response.data
  },

  async createCustomer(data: CustomerFormData): Promise<Customer> {
    const response = await api.post('/customers/', data)
    return response.data
  },

  async updateCustomer(id: number, data: Partial<CustomerFormData>): Promise<Customer> {
    const response = await api.put(`/customers/${id}`, data)
    return response.data
  },

  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`)
  }
}

export default customerService
