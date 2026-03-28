import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FuelLog } from '@/src/services/fuelLogs.service';
import useFuelsScreen from '@/src/hooks/useFuelsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/layouts/screen';
import { Button } from '@/components/ui/button';
import { FinancialListItem } from '@/src/components/Financial/FinancialListItem';
import { FuelForm } from '@/components/blocks/financial/fuel-form';

export default function FuelsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const {
    fuelLogs,
    loading,
    saving,
    formExpanded,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    editingId,
    setEditingId,
    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  } = useFuelsScreen();

  const brandColor = '#FF9800'; 
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#333' : '#e0e0e0';

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderItem = ({ item }: { item: FuelLog }) => {
    const isEditing = editingId === item.id;
    
    return (
      <FinancialListItem
        title={item.gas_station || 'Abastecimento'}
        titleExtra={
          <View style={[styles.typeBadge, { backgroundColor: item.type === 'gasoline' ? '#4CAF50' : '#8BC34A' }]}>
            <Text style={styles.typeBadgeText}>{item.type === 'gasoline' ? 'Gas' : 'Eta'}</Text>
          </View>
        }
        subtitle={`${item.liters}L • R$ ${item.price_per_liter.toFixed(2)}/L • ${item.odometer} km`}
        description={item.description}
        amount={item.amount}
        date={item.date_competition}
        amountColor={brandColor}
        isEditing={isEditing}
        onLongPress={() => startEdit(item)}
        renderEditForm={
          <FuelForm
            initialData={item}
            onSubmit={(data) => handleUpdate(data)}
            onCancel={() => setEditingId(null)}
            loading={saving}
            theme={theme}
            brandColor={brandColor}
          />
        }
        theme={theme}
        isDark={isDark}
      />
    );
  };

  return (
    <Screen style={styles.container}>
      {/* Header Card with Registration Form */}
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Abastecimentos</Text>
          </View>
          <TouchableOpacity
            onPress={toggleForm}
            style={[styles.addBtn, { backgroundColor: formExpanded ? brandColor : (isDark ? '#333' : '#f3f4f6') }]}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={24} color={formExpanded ? '#fff' : theme.text} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {formExpanded && (
          <View style={styles.formContainer}>
            <FuelForm
              onSubmit={(data) => handleCreate(data)}
              loading={saving}
              theme={theme}
              brandColor={brandColor}
            />
          </View>
        )}
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.filterTypes}>
          <TouchableOpacity 
            onPress={() => setTypeFilter('')} 
            style={[styles.filterChip, !typeFilter && { backgroundColor: brandColor }]}
          >
            <Text style={[styles.filterChipText, !typeFilter && { color: '#fff' }]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTypeFilter('gasoline')} 
            style={[styles.filterChip, typeFilter === 'gasoline' && { backgroundColor: brandColor }]}
          >
            <Text style={[styles.filterChipText, typeFilter === 'gasoline' && { color: '#fff' }]}>Gasolina</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTypeFilter('Ethanol')} 
            style={[styles.filterChip, typeFilter === 'Ethanol' && { backgroundColor: brandColor }]}
          >
            <Text style={[styles.filterChipText, typeFilter === 'Ethanol' && { color: '#fff' }]}>Etanol</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateFilterContainer}>
          <Ionicons name="calendar-outline" size={16} color={theme.text + '60'} />
          <TextInput
            value={dateFilter}
            onChangeText={setDateFilter}
            style={[styles.filterInputDate, { color: theme.text }]}
            placeholder="Data"
            placeholderTextColor={theme.text + '40'}
          />
        </View>
      </View>

      {/* List Section */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <FlatList
          data={fuelLogs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="speedometer-outline" size={64} color={theme.text + '20'} />
              <Text style={[styles.emptyText, { color: theme.text + '60' }]}>Nenhum registro encontrado</Text>
              <Text style={[styles.emptySubText, { color: theme.text + '40' }]}>Toque no + para registrar um abastecimento</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  filterTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  filterInputDate: {
    fontSize: 12,
    height: 32,
    width: 80,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  }
});
