import { client } from './client';

export interface ExpenseRead {
    id: number;
    description: string;
    amount: number;
    currency: 'USD' | 'VES';
    category: string;
    date: string;
    created_at: string;
}

export const expenseService = {
  getExpenses: async () => {
    const { data } = await client.get<ExpenseRead[]>('finance/expenses/');
    return data;
  },

  createExpense: async (expenseData: any) => {
    const { data } = await client.post<ExpenseRead>('finance/expenses/', expenseData);
    return data;
  },

  updateExpense: async (id: number, expenseData: any) => {
    const { data } = await client.put<ExpenseRead>(`finance/expenses/${id}`, expenseData);
    return data;
  },

  deleteExpense: async (id: number) => {
    await client.delete(`finance/expenses/${id}`);
  },

  getSummary: async () => {
    const { data } = await client.get('finance/summary/');
    return data;
  }
};
