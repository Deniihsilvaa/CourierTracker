import { api } from './api';

export interface Expense {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

export interface CreateExpensePayload {
  amount: number;
  description: string;
  sessionId: string;
  categoryTypeId: string;
}

export const expensesService = {
  list: async (): Promise<Expense[]> => {
    const response = await api.get('/expenses/v1/');
    if (response.data?.success) {
      return response.data.data as Expense[];
    }
    return [];
  },

  create: async (payload: CreateExpensePayload): Promise<Expense> => {
    const response = await api.post('/expenses/v1/', payload);
    if (response.data?.success) {
      return response.data.data as Expense;
    }
    throw new Error('Failed to create expense');
  },

  update: async (id: string, payload: CreateExpensePayload): Promise<Expense> => {
    const response = await api.put(`/expenses/v1/${id}`, payload);
    if (response.data?.success) {
      return response.data.data as Expense;
    }
    throw new Error('Failed to update expense');
  },
};
