import api from './api'

export interface RepairItem {
  id: number
  product_id: number
  product_name?: string
  quantity: number
  unit_cost_usd?: number
  subtotal_usd?: number
}

export interface Repair {
  id: number
  customer_id?: number
  user_id?: number
  device_model: string
  device_imei?: string
  problem_description: string
  technical_report?: string
  status: string
  repair_type: 'software' | 'hardware' | 'service'
  estimated_cost_usd?: number
  labor_cost_usd?: number
  final_cost_usd?: number
  paid_amount_usd: number
  parts_cost_usd?: number
  customer_name?: string
  customer_dni?: string
  created_at: string
  updated_at?: string
  items?: RepairItem[]
}

export interface RepairFormData {
  customer_id?: number
  device_model: string
  device_imei?: string
  problem_description: string
  repair_type: 'software' | 'hardware' | 'service'
  estimated_cost_usd?: number
  labor_cost_usd?: number
}

export interface RepairItemCreate {
  product_id: number
  quantity: number
}

export interface RepairPaymentData {
  amount: number
  payment_method: string
  notes?: string
}

const repairService = {
  async getRepairs(status?: string): Promise<Repair[]> {
    const response = await api.get('/repairs/', { params: { status } })
    return response.data
  },

  async getRepair(id: number): Promise<Repair> {
    const response = await api.get(`/repairs/${id}/`)
    return response.data
  },

  async createRepair(data: RepairFormData): Promise<Repair> {
    const response = await api.post('/repairs/', data)
    return response.data
  },

  async updateRepair(id: number, data: Partial<Repair>): Promise<Repair> {
    const response = await api.put(`/repairs/${id}/`, data)
    return response.data
  },

  // --- Repair Parts Management ---
  async getRepairItems(repairId: number): Promise<RepairItem[]> {
    const response = await api.get(`/repairs/${repairId}/items/`)
    return response.data
  },

  async addRepairItem(repairId: number, data: RepairItemCreate): Promise<RepairItem> {
    const response = await api.post(`/repairs/${repairId}/items/`, data)
    return response.data
  },

  async removeRepairItem(repairId: number, itemId: number): Promise<void> {
    await api.delete(`/repairs/${repairId}/items/${itemId}`)
  },

  // --- Repair Payments ---
  async recordPayment(repairId: number, data: RepairPaymentData): Promise<Repair> {
    const response = await api.post(`/repairs/${repairId}/payments`, data)
    return response.data
  }
}

export default repairService


