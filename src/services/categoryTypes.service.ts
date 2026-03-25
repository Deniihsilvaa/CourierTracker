import { api } from './api';

export type CategoryTypeType = 'expenses' | 'incomes';

export interface CategoryType {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: CategoryTypeType;
}

export interface CreateCategoryTypePayload {
  name: string;
  description: string;
  type: CategoryTypeType;
}

export const categoryTypesService = {
  list: async (): Promise<CategoryType[]> => {
    const response = await api.get('/category-types/v1/');
    if (response.data?.success) {
      return response.data.data as CategoryType[];
    }
    return [];
  },

  create: async (payload: CreateCategoryTypePayload): Promise<CategoryType> => {
    const response = await api.post('/category-types/v1/', payload);
    if (response.data?.success) {
      return response.data.data as CategoryType;
    }
    throw new Error('Failed to create category type');
  },

  update: async (id: string, payload: Partial<CreateCategoryTypePayload>): Promise<CategoryType> => {
    const response = await api.put(`/category-types/v1/${id}`, payload);
    if (response.data?.success) {
      return response.data.data as CategoryType;
    }
    throw new Error('Failed to update category type');
  },
};
