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
  }
};
