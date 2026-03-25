import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Expense } from '@/src/services/expenses.service';
import useExpensesScreen from '@/src/hooks/useExpensesScreen';
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

export default function ExpensesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
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
  } = useExpensesScreen();

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const inputBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#333' : '#e0e0e0';

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderItem = ({ item }: { item: Expense }) => {
    const isEditing = editingId === item.id;
    
    const renderEditForm = (
      <View style={{ flex: 1 }}>
        <Text style={[styles.editHint, { color: theme.tint }]}>Editando Despesa</Text>
        <View style={styles.formRow}>
          <TextInput
            value={editAmount}
            onChangeText={setEditAmount}
            style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
            placeholder="Valor"
            keyboardType="numeric"
            placeholderTextColor={theme.text + '60'}
          />
          <View style={{ flex: 1.5 }}>
             <Text style={{ color: theme.text, fontSize: 13, marginBottom: 4 }}>
                {categories.find(c => c.id === editCategoryTypeId)?.name || 'Cat.'}
             </Text>
             <View style={styles.formGrid}>
                  {categories.map(c => (
                      <TouchableOpacity 
                        key={c.id} 
                        onPress={() => setEditCategoryTypeId(c.id)} 
                        style={[styles.catPill, { 
                          backgroundColor: editCategoryTypeId === c.id ? theme.tint : inputBg, 
                          borderColor: editCategoryTypeId === c.id ? theme.tint : borderColor, 
                          paddingVertical: 4 
                        }]}
                      >
                          <Text style={{ color: editCategoryTypeId === c.id ? '#fff' : theme.text + '80', fontSize: 10 }}>{c.name}</Text>
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
    );

    return (
      <FinancialListItem
        title={item.description || 'Despesa'}
        subtitle={item.category}
        date={item.created_at}
        amount={item.amount}
        amountColor="#FF5252"
        isEditing={isEditing}
        onLongPress={() => startEdit(item)}
        renderEditForm={renderEditForm}
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
