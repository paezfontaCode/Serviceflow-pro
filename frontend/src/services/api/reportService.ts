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
  },

  getDashboardSummary: async () => {
    const { data } = await client.get('/reports/summary');
    return data;
  },

  getMonthlySales: async () => {
    const { data } = await client.get('/reports/monthly-sales');
    return data;
  },

  getCategoryDistribution: async () => {
    const { data } = await client.get('/reports/category-distribution');
    return data;
  },

  getTopProducts: async (limit: number = 5) => {
    const { data } = await client.get(`/reports/top-products?limit=${limit}`);
    return data;
  },

  getTechnicianPerformance: async () => {
    const { data } = await client.get('/reports/technician-performance');
    return data;
  }
};
