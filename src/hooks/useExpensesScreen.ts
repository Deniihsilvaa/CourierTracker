import { expensesService, Expense } from '@/src/services/expenses.service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useCategories } from './useCategories';
import { useBaseCrud } from './useBaseCrud';

export default function useExpensesScreen() {
  const { activeSession } = useSessionStore();
  const { categories, loading: loadingCats } = useCategories('expenses');
  const {
      loading, setLoading,
      saving, setSaving,
      formExpanded, toggleForm,
      rotateAnim,
      editingId, setEditingId,
      startEditBase
  } = useBaseCrud();

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryTypeId, setCategoryTypeId] = useState('');

  // Edit state
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryTypeId, setEditCategoryTypeId] = useState('');

  // Sync categoryTypeId with loaded categories
  useEffect(() => {
    if (!categoryTypeId && categories.length > 0) {
      setCategoryTypeId(categories[0].id);
    }
  }, [categories, categoryTypeId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const expData = await expensesService.list();
      setExpenses(expData);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!amount.trim() || isNaN(Number(amount.trim()))) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }
    if (!categoryTypeId) {
      Alert.alert('Atenção', 'Selecione uma categoria.');
      return;
    }
    if (!activeSession) {
      Alert.alert('Atenção', 'É necessário uma sessão ativa para criar uma despesa.');
      return;
    }

    try {
      setSaving(true);
      const created = await expensesService.create({
        amount: Number(amount.trim()),
        description: description.trim(),
        sessionId: activeSession.id,
        categoryTypeId,
      });
      setExpenses(prev => [created, ...prev]);
      setAmount('');
      setDescription('');
      toggleForm();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar a despesa.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (exp: Expense) => {
    startEditBase(exp.id);
    setEditAmount(exp.amount.toString());
    setEditDescription(exp.description);
    
    // Find category ID by name
    const cat = categories.find(c => c.name === exp.category);
    setEditCategoryTypeId(cat ? cat.id : (categories[0]?.id || ''));
  };

  const handleUpdate = async () => {
    if (!editingId || isNaN(Number(editAmount))) return;
    if (!activeSession) return;

    try {
      setSaving(true);
      const updated = await expensesService.update(editingId, {
        amount: Number(editAmount),
        description: editDescription.trim(),
        sessionId: activeSession.id,
        categoryTypeId: editCategoryTypeId,
      });
      setExpenses(prev => prev.map(e => (e.id === editingId ? updated : e)));
      setEditingId(null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a despesa.');
    } finally {
      setSaving(false);
    }
  };

  return {
    activeSession,
    expenses,
    categories,
    loading: loading || loadingCats,
    saving,
    formExpanded,
    
    // Creation State
    amount, setAmount,
    description, setDescription,
    categoryTypeId, setCategoryTypeId,

    // Edit State
    editingId, setEditingId,
    editAmount, setEditAmount,
    editDescription, setEditDescription,
    editCategoryTypeId, setEditCategoryTypeId,

    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  };
}
