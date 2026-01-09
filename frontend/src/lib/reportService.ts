import api from './api';

export interface ProfitLossReport {
  period: {
    start: string;
    end: string;
  };
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
  currency: string;
  exchange_rate: number;
}

export interface AgingReport {
  "0-30": number;
  "31-60": number;
  "61-90": number;
  "90+": number;
}

export interface KardexEntry {
  date: string;
  type: 'VENTA' | 'AJUSTE' | 'COMPRA';
  reference: string;
  change: number;
  user: string;
}

export const reportService = {
  getProfitLoss: async (startDate: string, endDate: string, currency = 'USD') => {
    const response = await api.get('/reports/profit-loss', {
      params: { start_date: startDate, end_date: endDate, currency }
    });
    return response.data as ProfitLossReport;
  },

  getAging: async () => {
    const response = await api.get('/reports/aging');
    return response.data as AgingReport;
  },

  getProductKardex: async (productId: number) => {
    const response = await api.get(`/reports/products/${productId}/kardex`);
    return response.data as KardexEntry[];
  }
};
