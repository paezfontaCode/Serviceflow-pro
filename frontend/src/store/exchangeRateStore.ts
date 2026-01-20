import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { client } from '@/services/api/client';

interface ExchangeRateState {
  rate: number;
  lastUpdated: string | null;
  setRate: (rate: number) => void;
  fetchRate: () => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateState>()(
  persist(
    (set) => ({
      rate: 36.5, // Default/Fallback rate
      lastUpdated: null,
      setRate: (rate) => set({ rate, lastUpdated: new Date().toISOString() }),
      fetchRate: async () => {
        try {
          const { data } = await client.get('finance/exchange-rates/current/');
          set({ 
            rate: parseFloat(data.rate), 
            lastUpdated: data.effective_date 
          });
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error);
        }
      }
    }),
    {
      name: 'serviceflow-rate',
    }
  )
);
