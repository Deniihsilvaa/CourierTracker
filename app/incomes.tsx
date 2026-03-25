import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryType } from '@/src/services/categoryTypes.service';
import { Income } from '@/src/services/incomes.service';
import useIncomesScreen from '@/src/hooks/useIncomesScreen';
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
  TouchableWithoutFeedback,
  UIManager,
  View,
} from 'react-native';
import { crudStyles as styles } from '@/src/styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function IncomesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    incomes,
    categories,
    loading,
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
  } = useIncomesScreen();

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const inputBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const subtleBg = isDark ? '#252525' : '#fafafa';

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderItem = ({ item }: { item: Income }) => {
    const isEditing = editingId === item.id;
    const catName = categories.find(c => c.id === item.category_id)?.name || 'Receita';

    return (
      <TouchableWithoutFeedback onPress={() => startEdit(item)}>
        <View style={[styles.listItem, { backgroundColor: isEditing ? (isDark ? '#2a2a3a' : '#eef2ff') : subtleBg, borderColor: isEditing ? theme.tint : borderColor }]}>
          {isEditing ? (
            <View style={{ flex: 1 }}>
              <Text style={[styles.editHint, { color: theme.tint }]}>Editando Receita</Text>
              <View style={styles.formRow}>
                <TextInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                  placeholder="Valor"
                  keyboardType="numeric"
                />
                <TextInput
                  value={editSource}
                  onChangeText={setEditSource}
                  style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor }]}
                  placeholder="Fonte"
                />
              </View>

              <View style={styles.formRow}>
                <TextInput
                  value={editDateCompetition}
                  onChangeText={setEditDateCompetition}
                  style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                  placeholder="Data"
                />
                <TextInput
                  value={editDescription}
                  onChangeText={setEditDescription}
                  style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                  placeholder="Descrição"
                />
              </View>

              <View style={styles.catGrid}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: editCategoryId === c.id ? '#4CAF50' : inputBg,
                        borderColor: editCategoryId === c.id ? '#4CAF50' : borderColor
                      }
                    ]}
                    onPress={() => setEditCategoryId(c.id)}
                  >
                    <Text style={{ color: editCategoryId === c.id ? '#fff' : theme.text + '80', fontSize: 11 }}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.source}</Text>
                <Text style={[styles.itemCat, { color: theme.tint, fontWeight: '700' }]}>{catName}</Text>
                {!!item.description && (
                  <Text style={[styles.itemDesc, { color: theme.text + '60' }]} numberOfLines={1}>{item.description}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.itemAmount, { color: '#4CAF50' }]}>R$ {item.amount.toFixed(2)}</Text>
                <Text style={[styles.itemDate, { color: theme.text + '40' }]}>{new Date(item.date_competition).toLocaleDateString()}</Text>
              </View>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header section */}
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Receitas</Text>
          </View>
          <TouchableOpacity
            onPress={toggleForm}
            style={[styles.addBtn, { backgroundColor: formExpanded ? '#4CAF50' : (isDark ? '#333' : '#f0f0f0') }]}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={22} color={formExpanded ? '#fff' : theme.text} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {formExpanded && (
          <View style={styles.form}>
            {categories.length === 0 ? (
              <Text style={{ color: '#FF5252', fontSize: 12, marginBottom: 10 }}>Crie categorias de receita primeiro!</Text>
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
                    value={source}
                    onChangeText={setSource}
                    style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="Fonte (Ex: iFood, Uber)"
                    placeholderTextColor={theme.text + '60'}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                    value={dateCompetition}
                    onChangeText={setDateCompetition}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                    placeholder="Data (AAAA-MM-DD)"
                    placeholderTextColor={theme.text + '60'}
                  />
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.formInput, { flex: 2, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                    placeholder="Descrição opcional"
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
                          backgroundColor: categoryId === c.id ? '#4CAF50' : inputBg,
                          borderColor: categoryId === c.id ? '#4CAF50' : borderColor
                        }
                      ]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={{ color: categoryId === c.id ? '#fff' : theme.text + '80', fontSize: 12, fontWeight: '600' }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: '#4CAF50' }]}
                  onPress={handleCreate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createBtnText}>Adicionar Receita</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Filters Bar */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor }]}>
        <Ionicons name="search-outline" size={20} color={theme.text + '60'} style={{ marginRight: 8 }} />
        <TextInput
          value={nameFilter}
          onChangeText={setNameFilter}
          style={[styles.filterInput, { color: theme.text, fontSize: 13 }]}
          placeholder="Filtrar por nome ou fonte..."
          placeholderTextColor={theme.text + '50'}
        />
        <TextInput
          value={dateFilter}
          onChangeText={setDateFilter}
          style={[styles.filterInputDate, { color: theme.text, borderColor }]}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={theme.text + '50'}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={incomes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={48} color={theme.text + '40'} />
              <Text style={[styles.emptyText, { color: theme.text + '60' }]}>Nenhuma receita registrada.</Text>
              <Text style={[styles.emptySubText, { color: theme.text + '40' }]}>Informe seus ganhos tocando no botão +.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
