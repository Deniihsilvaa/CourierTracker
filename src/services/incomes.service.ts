import { api } from './api';

export interface Income {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  source: string;
  description: string;
  category_id: string;
  date_competition: string;
  created_at: string;
}

export interface CreateIncomePayload {
  amount: number;
  source: string;
  description: string;
  sessionId: string;
  categoryId: number;
  dateCompetition: string;
}

export const incomesService = {
  list: async (params?: { date?: string; name?: string; categories?: string }): Promise<Income[]> => {
    const response = await api.get('/incomes/v1/', { params });
    if (response.data?.success) {
      return response.data.data as Income[];
    }
    return [];
  },

  create: async (payload: CreateIncomePayload): Promise<Income> => {
    const response = await api.post('/incomes/v1/', payload);
    if (response.data?.success) {
      return response.data.data as Income;
    }
    throw new Error('Failed to create income');
  },

  update: async (id: string, payload: CreateIncomePayload): Promise<Income> => {
    const response = await api.put(`/incomes/v1/${id}`, payload);
    if (response.data?.success) {
      return response.data.data as Income;
    }
    throw new Error('Failed to update income');
  },
};
