import { create } from "zustand";
import { client } from "@/services/api/client";

interface CashSession {
  id: number;
  session_code: string;
  opening_amount: number;
  opening_amount_ves: number;
  expected_amount: number;
  expected_amount_ves: number;
  status: "open" | "closed";
  opened_at: string;
}

interface FinanceState {
  activeSession: CashSession | null;
  isLoading: boolean;
  checkActiveSession: () => Promise<void>;
  openSession: (
    amount: number,
    amountVes: number,
    notes?: string,
  ) => Promise<void>;
  closeSession: (
    actualAmount: number,
    actualAmountVes: number,
    notes?: string,
  ) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  activeSession: null,
  isLoading: false,
  checkActiveSession: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get("finance/cash-sessions/current/");
      set({ activeSession: data, isLoading: false });
    } catch (error) {
      set({ activeSession: null, isLoading: false });
    }
  },
  openSession: async (amount, amountVes, notes) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post("finance/cash-sessions/open/", {
        opening_amount: amount,
        opening_amount_ves: amountVes,
        notes,
      });
      set({ activeSession: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  closeSession: async (actualAmount, actualAmountVes, notes) => {
    set({ isLoading: true });
    try {
      const { data } = await client.post("finance/cash-sessions/close/", {
        actual_amount: actualAmount,
        actual_amount_ves: actualAmountVes,
        notes,
      });
      set({ activeSession: null, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
