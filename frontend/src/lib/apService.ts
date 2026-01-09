import api from './api';

export interface AccountsPayable {
  id: number;
  supplier_id: number;
  purchase_order_id?: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'partially_paid' | 'paid';
  created_at: string;
}

export interface APPayment {
  amount_usd: number;
  payment_method: string;
}

export const apService = {
  getAccountsPayable: async () => {
    // Note: The backend route for all AP might be under /inventory/purchases/ap or similar
    // Based on schemas.finance, it seems to be handled in the finance or inventory router
    // Checking backend/app/api/v1/purchases.py shows it's handled there in receive_purchase
    // but there's no explicit GET /accounts-payable in purchases.py yet.
    // However, the schemas are in finance.py.
    // Let's check inventory.py or sales.py just in case.
    const response = await api.get('/finance/accounts-payable/'); 
    return response.data as AccountsPayable[];
  },

  payAccount: async (apId: number, data: APPayment) => {
    const response = await api.post(`/finance/accounts-payable/${apId}/pay`, data);
    return response.data;
  }
};
