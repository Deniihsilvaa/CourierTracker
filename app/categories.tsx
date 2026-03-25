import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryType, CategoryTypeType } from '@/src/services/categoryTypes.service';
import useCategoriesScreen from '@/src/hooks/useCategoriesScreen';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { crudStyles as styles } from '@/src/styles';
import { FinancialListItem } from '@/src/components/Financial/FinancialListItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TYPE_OPTIONS: { label: string; value: CategoryTypeType }[] = [
  { label: 'Despesa', value: 'expenses' },
  { label: 'Receita', value: 'incomes' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    categories,
    loading,
    saving,
    formExpanded,
    
    // Creation State
    name, setName,
    description, setDescription,
    type, setType,

    // Edit State
    editingId,
    editName, setEditName,
    editDescription, setEditDescription,
    editType, setEditType,

    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit,
    cancelEdit
  } = useCategoriesScreen();

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const inputBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#333' : '#e0e0e0';

  const typeColor = (t: CategoryTypeType) => (t === 'expenses' ? '#FF5252' : '#4CAF50');
  const typeLabel = (t: CategoryTypeType) => (t === 'expenses' ? 'Despesa' : 'Receita');

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderItem = ({ item }: { item: CategoryType }) => {
    const isEditing = editingId === item.id;
    
    const renderEditForm = (
      <View style={{ flex: 1 }}>
        <Text style={[styles.editHint, { color: theme.tint }]}>Editando Categoria</Text>
        <TextInput
          value={editName}
          onChangeText={setEditName}
          style={[styles.editInput, { color: theme.text, borderColor: theme.tint, backgroundColor: inputBg }]}
          placeholder="Nome"
          placeholderTextColor={theme.text + '60'}
        />
        <TextInput
          value={editDescription}
          onChangeText={setEditDescription}
          style={[styles.editInput, { color: theme.text, borderColor: borderColor, backgroundColor: inputBg }]}
          placeholder="Descrição"
          placeholderTextColor={theme.text + '60'}
        />

        <View style={[styles.formRow, { marginBottom: 10 }]}>
          {TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.typeOption,
                {
                  backgroundColor: editType === opt.value ? typeColor(opt.value) + '22' : 'transparent',
                  borderColor: editType === opt.value ? typeColor(opt.value) : borderColor,
                  borderWidth: 1,
                  borderRadius: 8,
                  height: 36
                },
              ]}
              onPress={() => setEditType(opt.value)}
            >
              <Text style={{ color: editType === opt.value ? typeColor(opt.value) : theme.text + '80', fontWeight: '600', fontSize: 13 }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.editActions}>
          <TouchableOpacity style={[styles.editSaveBtn, { backgroundColor: theme.tint }]} onPress={handleUpdate} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.editSaveBtnText}>Salvar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor }]} onPress={cancelEdit}>
            <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <FinancialListItem
        title={item.name}
        subtitle={typeLabel(item.type)}
        description={item.description}
        isEditing={isEditing}
        onLongPress={() => startEdit(item)}
        renderEditForm={renderEditForm}
        rightElement={
          <View style={[styles.typeBadge, { backgroundColor: typeColor(item.type) + '22', borderColor: typeColor(item.type) }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor(item.type) }]}>{typeLabel(item.type)}</Text>
          </View>
        }
        theme={theme}
        isDark={isDark}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Categorias</Text>
          </View>
          <TouchableOpacity
            onPress={toggleForm}
            style={[styles.addBtn, { backgroundColor: formExpanded ? theme.tint : (isDark ? '#333' : '#f0f0f0') }]}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={22} color={formExpanded ? '#fff' : theme.text} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {formExpanded && (
          <View style={styles.form}>
            <View style={styles.formRow}>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor }]}
                placeholder="name"
                placeholderTextColor={theme.text + '60'}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor }]}
                placeholder="description"
                placeholderTextColor={theme.text + '60'}
              />
              <TouchableOpacity
                style={[styles.typeBadge, { height: 44, justifyContent: 'center', backgroundColor: typeColor(type) + '22', borderColor: typeColor(type) }]}
                onPress={() => setType(prev => (prev === 'expenses' ? 'incomes' : 'expenses'))}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor(type) }}>
                  {type === 'expenses' ? 'Desp.' : 'Rec.'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: theme.tint }]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Criar Categoria</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={theme.text + '40'} />
              <Text style={[styles.emptyText, { color: theme.text + '60' }]}>Nenhuma categoria criada ainda.</Text>
              <Text style={[styles.emptySubText, { color: theme.text + '40' }]}>Toque no + para adicionar.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
