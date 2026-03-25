import { CategoryType, CategoryTypeType, categoryTypesService } from '@/src/services/categoryTypes.service';
import { useState, useEffect } from 'react'; // Added useEffect import
import { Alert } from 'react-native';
import { useCategories } from './useCategories';
import { useBaseCrud } from './useBaseCrud';

export default function useCategoriesScreen() {
  const { categories, loading: loadingCats, refresh: loadCategories } = useCategories();
  const {
      loading, setLoading,
      saving, setSaving,
      formExpanded, toggleForm,
      rotateAnim,
      editingId, setEditingId,
      startEditBase,
      cancelEditBase
  } = useBaseCrud();

  // Sync loading state with useCategories
  useEffect(() => {
    if (!loadingCats && loading) {
      setLoading(false);
    }
  }, [loadingCats, loading, setLoading]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CategoryTypeType>('expenses');

  // Edit state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<CategoryTypeType>('expenses');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome da categoria é obrigatório.');
      return;
    }
    try {
      setSaving(true);
      await categoryTypesService.create({
        name: name.trim(),
        description: description.trim(),
        type,
      });
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
    startEditBase(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description);
    setEditType(cat.type);
  };

  const cancelEdit = () => {
    cancelEditBase();
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
    loading: loading || loadingCats,
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
