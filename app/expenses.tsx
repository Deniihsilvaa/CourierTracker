import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { categoryTypesService, CategoryType } from '@/src/services/categoryTypes.service';
import { expensesService, Expense } from '@/src/services/expenses.service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ExpensesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
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
      
      // Filter categories to only 'expenses'
      const expenseCats = catData.filter(c => c.type === 'expenses');
      setCategories(expenseCats);
      if (expenseCats.length > 0) {
        setCategoryTypeId(expenseCats[0].id);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

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
    
    // Find category ID by name (since response only has name)
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

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const inputBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const subtleBg = isDark ? '#252525' : '#fafafa';

  const renderItem = ({ item }: { item: Expense }) => {
    const isEditing = editingId === item.id;
    return (
      <TouchableWithoutFeedback
        onLongPress={() => startEdit(item)}
        delayLongPress={600}
      >
        <View
          style={[
            styles.listItem,
            {
              backgroundColor: isEditing ? (isDark ? '#2a2a3a' : '#eef2ff') : subtleBg,
              borderColor: isEditing ? theme.tint : borderColor,
            },
          ]}
        >
          {isEditing ? (
            <View style={{ flex: 1 }}>
              <Text style={[styles.editHint, { color: theme.tint }]}>Editando</Text>
              <View style={styles.formRow}>
                <TextInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                  placeholder="Valor"
                  keyboardType="numeric"
                  placeholderTextColor={theme.text + '60'}
                />
                <View style={[styles.selectWrapper, { flex: 1.5, backgroundColor: inputBg, borderColor }]}>
                   <Text style={{ color: theme.text, fontSize: 13 }}>{categories.find(c => c.id === editCategoryTypeId)?.name || 'Cat.'}</Text>
                   <View style={styles.catPicker}>
                        {categories.map(c => (
                            <TouchableOpacity key={c.id} onPress={() => setEditCategoryTypeId(c.id)} style={{ padding: 4 }}>
                                <Text style={{ color: editCategoryTypeId === c.id ? theme.tint : theme.text + '80', fontSize: 11 }}>{c.name}</Text>
                            </TouchableOpacity>
                        ))}
                   </View>
                </View>
              </View>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                style={[styles.editInput, { color: theme.text, borderColor: borderColor, backgroundColor: inputBg, marginTop: 10 }]}
                placeholder="Descrição"
                placeholderTextColor={theme.text + '60'}
              />

              <View style={styles.editActions}>
                <TouchableOpacity style={[styles.editSaveBtn, { backgroundColor: theme.tint }]} onPress={handleUpdate} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.editSaveBtnText}>Salvar</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor }]} onPress={() => setEditingId(null)}>
                  <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.description || 'Despesa'}</Text>
                <Text style={[styles.itemCat, { color: theme.text + '60' }]}>{item.category}</Text>
                <Text style={[styles.itemDate, { color: theme.text + '40' }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.itemAmount, { color: '#FF5252' }]}>R$ {item.amount.toFixed(2)}</Text>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header card with toggle form */}
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Despesas</Text>
          </View>
          <TouchableOpacity
            onPress={toggleForm}
            style={[styles.addBtn, { backgroundColor: formExpanded ? '#FF5252' : (isDark ? '#333' : '#f0f0f0') }]}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={22} color={formExpanded ? '#fff' : theme.text} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {formExpanded && (
          <View style={styles.form}>
            {categories.length === 0 ? (
               <Text style={{ color: '#FF5252', fontSize: 12, marginBottom: 10 }}>Crie categorias de despesa primeiro!</Text>
            ) : (
                <>
                <View style={styles.formRow}>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="Valor"
                    keyboardType="numeric"
                    placeholderTextColor={theme.text + '60'}
                  />
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="Descrição"
                    placeholderTextColor={theme.text + '60'}
                  />
                </View>
                
                <View style={styles.catGrid}>
                  {categories.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: categoryTypeId === c.id ? '#FF5252' : inputBg,
                          borderColor: categoryTypeId === c.id ? '#FF5252' : borderColor
                        }
                      ]}
                      onPress={() => setCategoryTypeId(c.id)}
                    >
                      <Text style={{ color: categoryTypeId === c.id ? '#fff' : theme.text + '80', fontSize: 12, fontWeight: '600' }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: '#FF5252' }]}
                  onPress={handleCreate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createBtnText}>Adicionar Despesa</Text>
                  )}
                </TouchableOpacity>
                </>
            )}
          </View>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.text + '40'} />
              <Text style={[styles.emptyText, { color: theme.text + '60' }]}>Nenhuma despesa registrada.</Text>
              <Text style={[styles.emptySubText, { color: theme.text + '40' }]}>Toque no + para adicionar uma despesa.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    marginTop: 14,
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  createBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemCat: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 11,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 13,
  },
  editHint: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  editInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  selectWrapper: {
    height: 44,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  catPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editSaveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
  },
});
