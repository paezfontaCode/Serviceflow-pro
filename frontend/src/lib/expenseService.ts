import api from './api';

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  payment_method: string;
  category_id: number;
  date: string;
  user_id: number;
  exchange_rate: number;
  amount_usd: number;
  created_at: string;
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  currency?: string;
  payment_method: string;
  category_id: number;
  date?: string;
  session_id?: number;
}

export const expenseService = {
  // Categories
  getCategories: async () => {
    const response = await api.get('/expenses/categories');
    return response.data as ExpenseCategory[];
  },

  createCategory: async (data: { name: string; description?: string }) => {
    const response = await api.post('/expenses/categories', data);
    return response.data as ExpenseCategory;
  },

  // Expenses
  getExpenses: async (skip = 0, limit = 100) => {
    const response = await api.get('/expenses/', { params: { skip, limit } });
    return response.data as Expense[];
  },

  createExpense: async (data: ExpenseCreate) => {
    const response = await api.post('/expenses/', data);
    return response.data as Expense;
  },

  getMonthlyExpenses: async (year: number, month: number) => {
    const response = await api.get(`/expenses/monthly/${year}/${month}`);
    return response.data as Expense[];
  }
};
