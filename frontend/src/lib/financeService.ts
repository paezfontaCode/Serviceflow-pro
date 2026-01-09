import api from './api';

export interface ExchangeRate {
  id: number;
  rate: number;
  source: string;
  effective_date: string;
  is_active: boolean;
}

export interface CashSession {
  id: number;
  session_code: string;
  status: 'open' | 'closed';
  opening_amount: number;
  opening_amount_ves: number; // NEW
  expected_amount: number;
  expected_amount_ves: number; // NEW
  actual_amount: number | null;
  actual_amount_ves: number | null; // NEW
  shortage: number;
  overage: number;
  shortage_ves: number; // NEW
  overage_ves: number; // NEW
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export const financeService = {
  getCurrentRate: async () => {
    const response = await api.get('/finance/exchange-rates/current/');
    return response.data;
  },
  
  updateExchangeRate: async (rate: number) => {
    const response = await api.post('/finance/exchange-rates/', { rate });
    return response.data;
  },

  getCurrentSession: async () => {
    const response = await api.get('/finance/cash-sessions/current/');
    return response.data;
  },

  openSession: async (opening_amount: number, opening_amount_ves: number = 0, notes?: string) => {
    const response = await api.post('/finance/cash-sessions/open/', { 
      opening_amount, 
      opening_amount_ves,
      notes 
    });
    return response.data;
  },

  closeSession: async (actual_amount: number, actual_amount_ves: number = 0, notes?: string) => {
    const response = await api.post('/finance/cash-sessions/close/', { 
      actual_amount, 
      actual_amount_ves,
      notes 
    });
    return response.data;
  },

  // --- Accounts Receivable ---
  getAccountsReceivable: async (filters?: { customer_id?: number; status?: string }) => {
    const response = await api.get('/finance/accounts-receivable/', { params: filters });
    return response.data;
  },

  createAccountReceivable: async (data: AccountReceivableCreate) => {
    const response = await api.post('/finance/accounts-receivable/', data);
    return response.data;
  },

  registerPayment: async (accountId: number, data: CustomerPaymentCreate) => {
    const response = await api.post(`/finance/accounts-receivable/${accountId}/payments/`, data);
    return response.data;
  }
};

export interface AccountReceivable {
  id: number;
  customer_id: number;
  customer_name?: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
}

export interface AccountReceivableCreate {
  customer_id: number;
  total_amount: number;
  due_date: string;
  notes?: string;
}

export interface CustomerPaymentCreate {
  amount_usd: number;
  payment_method: string;
  currency: string; // NEW
  reference?: string;
  notes?: string;
}

