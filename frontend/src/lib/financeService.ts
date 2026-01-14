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
  opening_amount_ves: number;
  expected_amount: number;
  expected_amount_ves: number;
  actual_amount: number | null;
  actual_amount_ves: number | null;
  shortage: number;
  overage: number;
  shortage_ves: number;
  overage_ves: number;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface FinanceSummary {
  total_receivables: number;
  overdue_amount: number;
  morosos_count: number;
  cash_in_session: number;
  cash_in_session_ves: number;
  exchange_rate: number;
  session_active: boolean;
  session_code: string | null;
}

export interface Moroso {
  customer_id: number;
  customer_name: string;
  phone: string | null;
  total_debt: number;
  days_overdue: number;
  oldest_due_date: string;
  accounts: {
    id: number;
    balance: number;
    due_date: string;
    days_overdue: number;
  }[];
}

export interface MorososResponse {
  morosos: Moroso[];
  total_morosos: number;
  total_at_risk: number;
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

  // --- Dashboard KPIs ---
  getFinanceSummary: async (): Promise<FinanceSummary> => {
    const response = await api.get('/finance/summary');
    return response.data;
  },

  getMorosos: async (): Promise<MorososResponse> => {
    const response = await api.get('/finance/morosos');
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
  currency: string;
  reference?: string;
  notes?: string;
}


