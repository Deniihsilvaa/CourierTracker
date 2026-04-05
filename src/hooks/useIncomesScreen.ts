import { useAnalyticsStore } from '@/src/modules/analytics/store';
import { listSessions } from '@/src/modules/sessions/service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { Income, incomesService } from '@/src/services/incomes.service';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useBaseCrud } from './useBaseCrud';
import { useCategories } from './useCategories';

export default function useIncomesScreen() {
  const { activeSession, history } = useSessionStore();
  const { categories, loading: loadingCats } = useCategories('incomes');
  const {
    loading, setLoading,
    saving, setSaving,
    formExpanded, toggleForm,
    rotateAnim,
    editingId, setEditingId,
    startEditBase
  } = useBaseCrud();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateCompetition, setDateCompetition] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [editAmount, setEditAmount] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDateCompetition, setEditDateCompetition] = useState('');
  const [editSessionId, setEditSessionId] = useState('');

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

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
      const incData = await incomesService.list({
        name: nameFilter || undefined,
        date: dateFilter || undefined
      });
      setIncomes(incData);
    } catch (e) {
      console.warn('[Incomes] LoadData failed', e);
    } finally {
      setLoading(false);
    }
  }, [nameFilter, dateFilter, setLoading]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!amount.trim() || isNaN(Number(amount.trim()))) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }
    if (!source.trim()) {
      Alert.alert('Atenção', 'A fonte da receita é obrigatória.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Atenção', 'Selecione uma categoria.');
      return;
    }
    if (!selectedSessionId) {
      Alert.alert('Atenção', 'Selecione uma sessão para vincular a receita.');
      return;
    }

    try {
      setSaving(true);
      const created = await incomesService.create({
        amount: Number(amount.trim()),
        source: source.trim(),
        description: description.trim(),
        sessionId: selectedSessionId,
        categoryId: Number(categoryId),
        dateCompetition: dateCompetition ? new Date(dateCompetition).toISOString() : new Date().toISOString(),
      });
      setIncomes(prev => [created, ...prev]);
      setAmount('');
      setSource('');
      setDescription('');
      toggleForm();
      useAnalyticsStore.getState().fetchFinancialSummary("month");
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar a receita.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: Income) => {
    startEditBase(item.id);
    setEditAmount(item.amount.toString());
    setEditSource(item.source);
    setEditDescription(item.description);
    setEditCategoryId(item.category_id);
    setEditDateCompetition(item.date_competition.split('T')[0]);
    setEditSessionId(item.session_id);
  };

  const handleUpdate = async () => {
    if (!editingId || !editSessionId) return;
    if (isNaN(Number(editAmount))) {
      Alert.alert('Atenção', 'Valor inválido.');
      return;
    }

    try {
      setSaving(true);
      const updated = await incomesService.update(editingId, {
        amount: Number(editAmount),
        source: editSource.trim(),
        description: editDescription.trim(),
        sessionId: editSessionId,
        categoryId: Number(editCategoryId),
        dateCompetition: new Date(editDateCompetition).toISOString(),
      });
      setIncomes(prev => prev.map(inc => inc.id === editingId ? updated : inc));
      setEditingId(null);
      useAnalyticsStore.getState().fetchFinancialSummary("month");
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a receita.');
    } finally {
      setSaving(false);
    }
  };

  return {
    activeSession,
    sessions: history,
    incomes,
    categories,
    loading: loading || loadingCats,
    saving,
    formExpanded,
    nameFilter, setNameFilter,
    dateFilter, setDateFilter,
    amount, setAmount,
    source, setSource,
    description, setDescription,
    categoryId, setCategoryId,
    dateCompetition, setDateCompetition,
    selectedSessionId, setSelectedSessionId,
    editingId, setEditingId,
    editAmount, setEditAmount,
    editSource, setEditSource,
    editDescription, setEditDescription,
    editCategoryId, setEditCategoryId,
    editDateCompetition, setEditDateCompetition,
    editSessionId, setEditSessionId,
    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  };
}
