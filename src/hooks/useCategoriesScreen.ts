import { CategoryType, CategoryTypeType, categoryTypesService } from '@/src/services/categoryTypes.service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, LayoutAnimation } from 'react-native';

export default function useCategoriesScreen() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CategoryTypeType>('expenses');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<CategoryTypeType>('expenses');

  const rotateAnim = useRef(new Animated.Value(0)).current;

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryTypesService.list();
      setCategories(data);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar as categorias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome da categoria é obrigatório.');
      return;
    }
    try {
      setSaving(true);
      const created = await categoryTypesService.create({
        name: name.trim(),
        description: description.trim(),
        type,
      });
      setCategories(prev => [created, ...prev]);
      setName('');
      setDescription('');
      setType('expenses');
      toggleForm(); 
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar a categoria.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: CategoryType) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description);
    setEditType(cat.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      setSaving(true);
      const updated = await categoryTypesService.update(editingId, {
        name: editName.trim(),
        description: editDescription.trim(),
        type: editType,
      });
      setCategories(prev => prev.map(c => (c.id === editingId ? updated : c)));
      setEditingId(null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a categoria.');
    } finally {
      setSaving(false);
    }
  };

  return {
    categories,
    loading,
    saving,
    formExpanded,
    
    // Creation State
    name, setName,
    description, setDescription,
    type, setType,

    // Edit State
    editingId, setEditingId,
    editName, setEditName,
    editDescription, setEditDescription,
    editType, setEditType,

    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit,
    cancelEdit
  };
}
