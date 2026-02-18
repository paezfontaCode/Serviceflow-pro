import { client } from './client';
import {
    SupplierRead,
    SupplierCreate,
    PurchaseOrderRead,
    PurchaseOrderCreate,
    PaginatedResponse
} from '@/types/api';

export const purchaseService = {
    // --- Suppliers ---
    getSuppliers: async (params?: { page?: number; size?: number; search?: string }) => {
        const response = await client.get<PaginatedResponse<SupplierRead>>('/purchases/suppliers/', { params });
        return response.data;
    },

    createSupplier: async (data: SupplierCreate) => {
        const response = await client.post<SupplierRead>('/purchases/suppliers/', data);
        return response.data;
    },

    updateSupplier: async (id: number, data: Partial<SupplierCreate>) => {
        const response = await client.put<SupplierRead>(`/purchases/suppliers/${id}`, data);
        return response.data;
    },

    deleteSupplier: async (id: number) => {
        const response = await client.delete(`/purchases/suppliers/${id}`);
        return response.data;
    },

    // --- Purchase Orders ---
    getPurchases: async (params?: { page?: number; size?: number; status?: string; search?: string }) => {
        const response = await client.get<PaginatedResponse<PurchaseOrderRead>>('/purchases/orders/', { params });
        return response.data;
    },

    getPurchaseById: async (id: number) => {
        const response = await client.get<PurchaseOrderRead>(`/purchases/orders/${id}`);
        return response.data;
    },

    createPurchase: async (data: PurchaseOrderCreate) => {
        const response = await client.post<PurchaseOrderRead>('/purchases/orders/', data);
        return response.data;
    },

    receivePurchase: async (id: number) => {
        const response = await client.post<PurchaseOrderRead>(`/purchases/orders/${id}/receive`);
        return response.data;
    },

    cancelPurchase: async (id: number) => {
        const response = await client.post<PurchaseOrderRead>(`/purchases/orders/${id}/cancel`);
        return response.data;
    }
};
