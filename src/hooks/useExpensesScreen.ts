import { expensesService, Expense } from '@/src/services/expenses.service';
import { CategoryType, categoryTypesService } from '@/src/services/categoryTypes.service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, LayoutAnimation } from 'react-native';

export default function useExpensesScreen() {
  const { activeSession } = useSessionStore();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryTypeId, setCategoryTypeId] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryTypeId, setEditCategoryTypeId] = useState('');

  const rotateAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expData, catData] = await Promise.all([
        expensesService.list(),
        categoryTypesService.list(),
      ]);
      setExpenses(expData);
      
      const expenseCats = catData.filter(c => c.type === 'expenses');
      setCategories(expenseCats);
      if (expenseCats.length > 0 && !categoryTypeId) {
        setCategoryTypeId(expenseCats[0].id);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [categoryTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const toExpanded = !formExpanded;
    setFormExpanded(toExpanded);
    Animated.timing(rotateAnim, {
      toValue: toExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

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
    setEditingId(exp.id);
    setEditAmount(exp.amount.toString());
    setEditDescription(exp.description);
    
    // Find category ID by name
    const cat = categories.find(c => c.name === exp.category);
    setEditCategoryTypeId(cat ? cat.id : categories[0]?.id || '');
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
    loading,
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
