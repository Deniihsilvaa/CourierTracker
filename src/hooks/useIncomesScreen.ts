import { incomesService, Income } from '@/src/services/incomes.service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useCategories } from './useCategories';
import { useBaseCrud } from './useBaseCrud';

export default function useIncomesScreen() {
  const { activeSession } = useSessionStore();
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

  // Filters state
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Creation state
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateCompetition, setDateCompetition] = useState(new Date().toISOString().split('T')[0]);

  // Edit state
  const [editAmount, setEditAmount] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDateCompetition, setEditDateCompetition] = useState('');

  // Sync categoryId with loaded categories
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

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
    loadData();
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
    if (!activeSession) {
      Alert.alert('Atenção', 'É necessário uma sessão ativa para criar uma receita.');
      return;
    }

    try {
      setSaving(true);
      const created = await incomesService.create({
        amount: Number(amount.trim()),
        source: source.trim(),
        description: description.trim(),
        sessionId: activeSession.id,
        categoryId,
        dateCompetition: dateCompetition ? new Date(dateCompetition).toISOString() : new Date().toISOString(),
      });
      setIncomes(prev => [created, ...prev]);
      setAmount('');
      setSource('');
      setDescription('');
      toggleForm();
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
  };

  const handleUpdate = async () => {
    if (!editingId || !activeSession) return;
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
        sessionId: activeSession.id,
        categoryId: editCategoryId,
        dateCompetition: new Date(editDateCompetition).toISOString(),
      });
      setIncomes(prev => prev.map(inc => inc.id === editingId ? updated : inc));
      setEditingId(null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a receita.');
    } finally {
      setSaving(false);
    }
  };

  return {
    activeSession,
    incomes,
    categories,
    loading: loading || loadingCats,
    saving,
    formExpanded,
    nameFilter, setNameFilter,
    dateFilter, setDateFilter,
    
    // Creation State
    amount, setAmount,
    source, setSource,
    description, setDescription,
    categoryId, setCategoryId,
    dateCompetition, setDateCompetition,

    // Edit State
    editingId, setEditingId,
    editAmount, setEditAmount,
    editSource, setEditSource,
    editDescription, setEditDescription,
    editCategoryId, setEditCategoryId,
    editDateCompetition, setEditDateCompetition,

    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  };
}
