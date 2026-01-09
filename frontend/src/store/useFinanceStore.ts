import { create } from 'zustand';
import { CashSession, financeService } from '@/lib/financeService';

interface FinanceState {
  currentSession: CashSession | null;
  exchangeRate: number;
  isLoading: boolean;
  error: string | null;
  setExchangeRate: (rate: number) => void;
  fetchCurrentSession: () => Promise<void>;
  openSession: (amountUSD: number, amountVES?: number, notes?: string) => Promise<void>;
  closeSession: (amountUSD: number, amountVES?: number, notes?: string) => Promise<void>;
  clearError: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  currentSession: null,
  exchangeRate: 36.50, // Default exchange rate VES/USD
  isLoading: false,
  error: null,

  setExchangeRate: (rate) => set({ exchangeRate: rate }),

  fetchCurrentSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await financeService.getCurrentSession();
      set({ currentSession: session, isLoading: false });
    } catch (err: any) {
      if (err.response?.status === 404) {
        set({ currentSession: null, isLoading: false });
      } else {
        set({ error: err.message, isLoading: false });
      }
    }
  },

  openSession: async (amountUSD, amountVES = 0, notes) => {
    set({ isLoading: true, error: null });
    try {
      const session = await financeService.openSession(amountUSD, amountVES, notes);
      set({ currentSession: session, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      throw err;
    }
  },

  closeSession: async (amountUSD, amountVES = 0, notes) => {
    set({ isLoading: true, error: null });
    try {
      await financeService.closeSession(amountUSD, amountVES, notes);
      set({ currentSession: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
