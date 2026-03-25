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
  TouchableWithoutFeedback,
  View,
} from 'react-native';

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
    
    // Form state
    amount, setAmount,
    liters, setLiters,
    pricePerLiter, setPricePerLiter,
    odometer, setOdometer,
    description, setDescription,
    gasStation, setGasStation,
    dateCompetition, setDateCompetition,
    type, setType,

    // Edit state
    editingId, setEditingId,
    editAmount, setEditAmount,
    editLiters, setEditLiters,
    editPricePerLiter, setEditPricePerLiter,
    editOdometer, setEditOdometer,
    editDescription, setEditDescription,
    editGasStation, setEditGasStation,
    editDateCompetition, setEditDateCompetition,
    editType, setEditType,

    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  } = useFuelsScreen();

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const inputBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const subtleBg = isDark ? '#252525' : '#fafafa';
  const brandColor = '#FF9800'; 

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderItem = ({ item }: { item: FuelLog }) => {
    const isEditing = editingId === item.id;
    
    return (
      <TouchableWithoutFeedback onPress={() => startEdit(item)}>
        <View style={[styles.listItem, { backgroundColor: isEditing ? (isDark ? '#3a2e1e' : '#fff4e5') : subtleBg, borderColor: isEditing ? brandColor : borderColor }]}>
          {isEditing ? (
            <View style={{ flex: 1 }}>
              <Text style={[styles.editHint, { color: brandColor }]}>Editando Abastecimento</Text>
              
              <View style={styles.formRow}>
                  <TextInput
                    value={editPricePerLiter}
                    onChangeText={setEditPricePerLiter}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="R$/L"
                    keyboardType="numeric"
                  />
                  <TextInput
                    value={editLiters}
                    onChangeText={setEditLiters}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="Ltrs"
                    keyboardType="numeric"
                  />
                  <TextInput
                    value={editAmount}
                    onChangeText={setEditAmount}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, fontWeight: '700' }]}
                    placeholder="Total R$"
                    keyboardType="numeric"
                  />
              </View>

              <View style={styles.formRow}>
                  <TextInput
                    value={editOdometer}
                    onChangeText={setEditOdometer}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                    placeholder="Odômetro"
                    keyboardType="numeric"
                  />
                  <TextInput
                    value={editGasStation}
                    onChangeText={setEditGasStation}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                    placeholder="Posto"
                  />
              </View>

              <View style={styles.formRow}>
                  <TextInput
                    value={editDateCompetition}
                    onChangeText={setEditDateCompetition}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                    placeholder="Data"
                  />
                  <View style={[styles.typeToggle, { flex: 1, marginTop: 8 }]}>
                    <TouchableOpacity 
                        onPress={() => setEditType('gasoline')} 
                        style={[styles.typeOption, { backgroundColor: editType === 'gasoline' ? brandColor : inputBg }]}
                    >
                        <Text style={{ color: editType === 'gasoline' ? '#fff' : theme.text + '80', fontSize: 10 }}>GAS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setEditType('Ethanol')} 
                        style={[styles.typeOption, { backgroundColor: editType === 'Ethanol' ? brandColor : inputBg }]}
                    >
                        <Text style={{ color: editType === 'Ethanol' ? '#fff' : theme.text + '80', fontSize: 10 }}>ETA</Text>
                    </TouchableOpacity>
                  </View>
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity style={[styles.editSaveBtn, { backgroundColor: brandColor }]} onPress={handleUpdate} disabled={saving}>
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.gas_station || 'Abastecimento'}</Text>
                    <View style={[styles.typeTag, { backgroundColor: item.type === 'gasoline' ? '#4CAF50' : '#8BC34A' }]}>
                        <Text style={styles.typeTagText}>{item.type === 'gasoline' ? 'Gas' : 'Eta'}</Text>
                    </View>
                </View>
                <Text style={[styles.itemDetail, { color: theme.text + '60' }]}>
                  {item.liters}L • R$ {item.price_per_liter.toFixed(2)}/L • {item.odometer} km
                </Text>
                {!!item.description && (
                  <Text style={[styles.itemDesc, { color: theme.text + '50' }]} numberOfLines={1}>{item.description}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                 <Text style={[styles.itemAmount, { color: brandColor }]}>R$ {item.amount.toFixed(2)}</Text>
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
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Abastecimento</Text>
          </View>
          <TouchableOpacity
            onPress={toggleForm}
            style={[styles.addBtn, { backgroundColor: formExpanded ? brandColor : (isDark ? '#333' : '#f0f0f0') }]}
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
                    value={pricePerLiter}
                    onChangeText={setPricePerLiter}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="R$/Litro"
                    keyboardType="numeric"
                    placeholderTextColor={theme.text + '60'}
                  />
                  <TextInput
                    value={liters}
                    onChangeText={setLiters}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor }]}
                    placeholder="Ltrs"
                    keyboardType="numeric"
                    placeholderTextColor={theme.text + '60'}
                  />
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, fontWeight: '700' }]}
                    placeholder="Total R$"
                    keyboardType="numeric"
                    placeholderTextColor={theme.text + '60'}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                      value={odometer}
                      onChangeText={setOdometer}
                      style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                      placeholder="Odômetro"
                      keyboardType="numeric"
                      placeholderTextColor={theme.text + '60'}
                  />
                  <TextInput
                      value={gasStation}
                      onChangeText={setGasStation}
                      style={[styles.formInput, { flex: 1.5, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                      placeholder="Posto (Ex: Ipiranga)"
                      placeholderTextColor={theme.text + '60'}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                      value={dateCompetition}
                      onChangeText={setDateCompetition}
                      style={[styles.formInput, { flex: 1, color: theme.text, backgroundColor: inputBg, borderColor, marginTop: 8 }]}
                      placeholder="Data"
                      placeholderTextColor={theme.text + '60'}
                  />
                  <View style={[styles.typeToggle, { flex: 1, marginTop: 8 }]}>
                    <TouchableOpacity 
                        onPress={() => setType('gasoline')} 
                        style={[styles.typeOption, { backgroundColor: type === 'gasoline' ? brandColor : inputBg }]}
                    >
                        <Text style={{ color: type === 'gasoline' ? '#fff' : theme.text + '80', fontWeight: 'bold' }}>Gasolina</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setType('Ethanol')} 
                        style={[styles.typeOption, { backgroundColor: type === 'Ethanol' ? brandColor : inputBg }]}
                    >
                        <Text style={{ color: type === 'Ethanol' ? '#fff' : theme.text + '80', fontWeight: 'bold' }}>Etanol</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: brandColor }]}
                  onPress={handleCreate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createBtnText}>Registrar Abastecimento</Text>
                  )}
                </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor }]}>
        <Ionicons name="funnel-outline" size={18} color={theme.text + '60'} style={{ marginRight: 8 }} />
        <View style={styles.filterOptions}>
            <TouchableOpacity onPress={() => setTypeFilter('')} style={[styles.filterChip, !typeFilter && { backgroundColor: brandColor }]}>
                <Text style={[styles.filterChipText, !typeFilter && { color: '#fff' }]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTypeFilter('gasoline')} style={[styles.filterChip, typeFilter === 'gasoline' && { backgroundColor: brandColor }]}>
                <Text style={[styles.filterChipText, typeFilter === 'gasoline' && { color: '#fff' }]}>Gas</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTypeFilter('Ethanol')} style={[styles.filterChip, typeFilter === 'Ethanol' && { backgroundColor: brandColor }]}>
                <Text style={[styles.filterChipText, typeFilter === 'Ethanol' && { color: '#fff' }]}>Eta</Text>
            </TouchableOpacity>
        </View>
        <TextInput
            value={dateFilter}
            onChangeText={setDateFilter}
            style={[styles.filterInputDate, { color: theme.text, borderColor }]}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={theme.text + '50'}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <FlatList
          data={fuelLogs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="speedometer-outline" size={48} color={theme.text + '40'} />
              <Text style={[styles.emptyText, { color: theme.text + '60' }]}>Nenhum abastecimento.</Text>
              <Text style={[styles.emptySubText, { color: theme.text + '40' }]}>Toque no + para registrar seu primeiro abastecimento.</Text>
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
  typeToggle: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeTag: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemDate: {
    fontSize: 11,
    marginTop: 4,
  },
  itemAmount: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  filterOptions: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterChipText: {
    fontSize: 11,
    color: '#666',
  },
  filterInputDate: {
    width: 90,
    fontSize: 11,
    height: '100%',
    textAlign: 'right',
    borderLeftWidth: 1,
    paddingLeft: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  editHint: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
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
