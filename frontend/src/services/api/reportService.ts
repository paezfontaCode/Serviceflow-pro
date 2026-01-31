import { client } from './client';

export const reportService = {
  getReplenishmentPreview: async () => {
    const response = await client.get('/reports/inventory/replenishment-report?format=json');
    return response.data;
  },

  downloadReport: async (format: 'pdf' | 'excel') => {
    const response = await client.get(`/reports/inventory/replenishment-report`, {
      params: { format },
      responseType: 'blob', // Critical for binary files
    });
    return response.data;
  },

  getProfitLoss: async (start_date: string, end_date: string, format: 'json' | 'pdf' = 'json') => {
    const response = await client.get('/reports/profit-loss', {
      params: { start_date, end_date, format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
    return response.data;
  },

  getAgingReport: async (format: 'json' | 'pdf' = 'json') => {
    const response = await client.get('/reports/aging', {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
    return response.data;
  },

  getKardex: async (productId: number, format: 'json' | 'pdf' = 'json') => {
    const response = await client.get(`/reports/kardex/${productId}`, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
    return response.data;
  }
};
