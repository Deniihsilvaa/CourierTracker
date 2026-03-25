import { CategoryType, CategoryTypeType, categoryTypesService } from '@/src/services/categoryTypes.service';
import { useCallback, useEffect, useState } from 'react';

export function useCategories(type?: CategoryTypeType) {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryTypesService.list();
      
      if (type) {
        setCategories(data.filter(c => c.type === type));
      } else {
        setCategories(data);
      }
    } catch (e) {
      setError('Não foi possível carregar as categorias.');
      console.warn('[useCategories] Load failed', e);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    refresh: loadCategories
  };
}
