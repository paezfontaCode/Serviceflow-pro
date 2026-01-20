import { client } from './client';

export interface FinanceSummary {
    total_receivables: number;
    overdue_amount: number;
    morosos_count: number;
    cash_in_session: number;
    cash_in_session_ves: number;
    exchange_rate: number;
    session_active: boolean;
    session_code?: string;
}

export interface CashSessionRead {
    id: number;
    user_id: number;
    session_code: string;
    opening_amount: number;
    opening_amount_ves: number;
    actual_amount?: number;
    actual_amount_ves?: number;
    expected_amount: number;
    expected_amount_ves: number;
    shortage?: number;
    overage?: number;
    shortage_ves?: number;
    overage_ves?: number;
    status: 'open' | 'closed';
    notes?: string;
    opened_at: string;
    closed_at?: string;
    cashier_name?: string;
}


export const financeService = {
  getSummary: async () => {
    const { data } = await client.get<FinanceSummary>('finance/summary');
    return data;
  },

  getCashSessions: async () => {
    const { data } = await client.get<CashSessionRead[]>('finance/cash-sessions/');
    return data;
  },


  getTransactions: async (sessionId: number) => {
    const { data } = await client.get(`finance/cash-sessions/${sessionId}/transactions`);
    return data;
  },

  getAccountsReceivable: async () => {
    const { data } = await client.get('finance/accounts-receivable/');
    return data;
  },

  getMorosos: async () => {
    const { data } = await client.get('finance/morosos');
    return data;
  },

  getCurrentRate: async () => {
    const { data } = await client.get('finance/exchange-rates/current/');
    return data;
  }
};
