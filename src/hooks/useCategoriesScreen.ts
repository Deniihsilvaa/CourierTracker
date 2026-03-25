import { CategoryType, CategoryTypeType, categoryTypesService } from '@/src/services/categoryTypes.service';
import { useRef, useState } from 'react';
import { Alert, Animated, LayoutAnimation } from 'react-native';
import { useCategories } from './useCategories';

export default function useCategoriesScreen() {
  const { categories, loading, refresh: loadCategories } = useCategories();
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
      // Refresh the list after creation
      await loadCategories();
      
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
      await categoryTypesService.update(editingId, {
        name: editName.trim(),
        description: editDescription.trim(),
        type: editType,
      });
      // Refresh the list after update
      await loadCategories();
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
