import { useAnalyticsStore } from '@/src/modules/analytics/store';
import { listSessions } from '@/src/modules/sessions/service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { Expense, expensesService } from '@/src/services/expenses.service';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useBaseCrud } from './useBaseCrud';
import { useCategories } from './useCategories';

export default function useExpensesScreen() {
  const { activeSession, history } = useSessionStore();
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

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryTypeId, setCategoryTypeId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryTypeId, setEditCategoryTypeId] = useState('');
  const [editSessionId, setEditSessionId] = useState('');

  useEffect(() => {
    if (!categoryTypeId && categories.length > 0) {
      setCategoryTypeId(categories[0].id);
    }
  }, [categories, categoryTypeId]);

  useEffect(() => {
    void listSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      const preferredSessionId = activeSession?.id || history[0]?.id || '';
      if (preferredSessionId) {
        setSelectedSessionId(preferredSessionId);
      }
    }
  }, [activeSession?.id, history, selectedSessionId]);

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
    void loadData();
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
    if (!selectedSessionId) {
      Alert.alert('Atenção', 'Selecione uma sessão para vincular a despesa.');
      return;
    }

    try {
      setSaving(true);
      const created = await expensesService.create({
        amount: Number(amount.trim()),
        description: description.trim(),
        sessionId: selectedSessionId,
        categoryTypeId: Number(categoryTypeId),
      });
      setExpenses(prev => [created, ...prev]);
      setAmount('');
      setDescription('');
      toggleForm();
      useAnalyticsStore.getState().fetchFinancialSummary("month");
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
    setEditSessionId(exp.session_id);
    const cat = categories.find(c => c.name === exp.category);
    setEditCategoryTypeId(cat ? cat.id : (categories[0]?.id || ''));
  };

  const handleUpdate = async () => {
    if (!editingId || isNaN(Number(editAmount))) return;
    if (!editSessionId) {
      Alert.alert('Atenção', 'Selecione uma sessão para vincular a despesa.');
      return;
    }

    try {
      setSaving(true);
      const updated = await expensesService.update(editingId, {
        amount: Number(editAmount),
        description: editDescription.trim(),
        sessionId: editSessionId,
        categoryTypeId: Number(editCategoryTypeId),
      });
      setExpenses(prev => prev.map(e => (e.id === editingId ? updated : e)));
      setEditingId(null);
      useAnalyticsStore.getState().fetchFinancialSummary("month");
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a despesa.');
    } finally {
      setSaving(false);
    }
  };

  return {
    activeSession,
    sessions: history,
    expenses,
    categories,
    loading: loading || loadingCats,
    saving,
    formExpanded,
    amount, setAmount,
    description, setDescription,
    categoryTypeId, setCategoryTypeId,
    selectedSessionId, setSelectedSessionId,
    editingId, setEditingId,
    editAmount, setEditAmount,
    editDescription, setEditDescription,
    editCategoryTypeId, setEditCategoryTypeId,
    editSessionId, setEditSessionId,
    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  };
}
