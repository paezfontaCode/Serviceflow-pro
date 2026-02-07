import { client } from './client';
import { SaleCreate, SaleRead } from '@/types/api';

export const salesService = {
  createSale: async (saleData: SaleCreate) => {
    const { data } = await client.post<SaleRead>('sales/', saleData);
    return data;
  },

  getSales: async () => {
    const { data } = await client.get<SaleRead[]>('sales/');
    return data;
  },

  getSale: async (id: number) => {
    const { data } = await client.get<SaleRead>(`sales/${id}`);
    return data;
  },

  getHistory: async (params: { start_date?: string; end_date?: string; customer_id?: number; payment_status?: string }) => {
    const { data } = await client.get<{ sales: SaleRead[]; summary: any }>('sales/history', { params });
    return data;
  },

  sendWhatsApp: async (id: number) => {
    const { data } = await client.post(`sales/${id}/send-whatsapp`);
    return data;
  }
};
