import api from './api';
import { Product } from './posService';

// --- Types ---

export interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface SupplierCreate {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
}

export interface PurchaseItemCreate {
  product_id: number;
  quantity: number;
  unit_cost_usd: number;
}

export interface PurchaseItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost_usd: number;
  subtotal_usd: number;
}

export interface PurchaseOrderCreate {
  supplier_id: number;
  expected_date?: string; // YYYY-MM-DD
  notes?: string;
  items: PurchaseItemCreate[];
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier_name: string;
  user_id: number;
  username: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_amount_usd: number;
  expected_date?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
  items: PurchaseItem[];
}

// --- Service ---

export const purchaseService = {
  // Suppliers
  getSuppliers: async (activeOnly = true) => {
    const response = await api.get('/inventory/suppliers/', { params: { active_only: activeOnly } });
    return response.data as Supplier[];
  },

  createSupplier: async (data: SupplierCreate) => {
    const response = await api.post('/inventory/suppliers/', data);
    return response.data as Supplier;
  },

  updateSupplier: async (id: number, data: Partial<SupplierCreate>) => {
    const response = await api.put(`/inventory/suppliers/${id}/`, data);
    return response.data as Supplier;
  },

  deleteSupplier: async (id: number) => {
    await api.delete(`/inventory/suppliers/${id}/`);
  },

  // Purchases
  getPurchases: async () => {
    const response = await api.get('/inventory/purchases/');
    return response.data as PurchaseOrder[];
  },

  getPurchase: async (id: number) => {
    const response = await api.get(`/inventory/purchases/${id}/`);
    return response.data as PurchaseOrder;
  },

  createPurchase: async (data: PurchaseOrderCreate) => {
    const response = await api.post('/inventory/purchases/', data);
    return response.data as PurchaseOrder;
  },

  receivePurchase: async (id: number) => {
    const response = await api.post(`/inventory/purchases/${id}/receive/`);
    return response.data as PurchaseOrder;
  },

  cancelPurchase: async (id: number) => {
    const response = await api.post(`/inventory/purchases/${id}/cancel/`);
    return response.data as PurchaseOrder;
  }
};
