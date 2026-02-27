import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { client } from '@/services/api/client';

interface ExchangeRateState {
  rate: number;
  source: string;
  lastUpdated: string | null;
  isLoading: boolean;
  setRate: (rate: number) => void;
  fetchRate: () => Promise<number>;
  syncRate: () => Promise<number>;
}

export const useExchangeRateStore = create<ExchangeRateState>()(
  persist(
    (set) => ({
      rate: 36.5,
      source: 'Manual',
      lastUpdated: null,
      isLoading: false,
      setRate: (rate) => set({
        rate,
        source: 'Manual',
        lastUpdated: new Date().toISOString()
      }),
      fetchRate: async () => {
        set({ isLoading: true });
        try {
          const { data } = await client.get('finance/exchange-rates/current/');
          const newRate = parseFloat(data.rate);
          set({
            rate: newRate,
            source: data.source || 'Manual',
            lastUpdated: data.effective_date,
            isLoading: false
          });
          return newRate;
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      syncRate: async () => {
        set({ isLoading: true });
        try {
          const { data } = await client.post('finance/exchange-rates/update-auto');
          const newRate = parseFloat(data.rate);
          set({
            rate: newRate,
            source: data.source || 'Auto',
            lastUpdated: data.effective_date,
            isLoading: false
          });
          return newRate;
        } catch (error) {
          console.error('Failed to sync exchange rate:', error);
          set({ isLoading: false });
          throw error;
        }
      }
    }),
    {
      name: 'serviceflow-rate',
    }
  )
);

