import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FinancialListItem } from '@/src/components/Financial/FinancialListItem';
import { FuelLog } from '@/src/services/fuelLogs.service';
import useFuelsScreen from '@/src/hooks/useFuelsScreen';
import { crudStyles as styles } from '@/src/styles';
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
import { FuelForm } from '@/components/blocks/financial/fuel-form';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const inputBg = isDark ? '#2a2a2a' : '#f5f5f5';
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
          <View style={[styles.typeBadge, { 
            backgroundColor: isDark ? '#333' : '#f0f0f0', 
            borderColor: item.type === 'gasoline' ? '#4CAF50' : '#8BC34A',
            paddingVertical: 2,
            paddingHorizontal: 8,
          }]}>
            <Text style={[styles.typeBadgeText, { color: item.type === 'gasoline' ? '#4CAF50' : '#8BC34A', fontSize: 10 }]}>
              {item.type === 'gasoline' ? 'GASOLINA' : 'ETANOL'}
            </Text>
          </View>
        }
        subtitle={`${item.liters}L • R$ ${item.price_per_liter.toFixed(2)}/L`}
        description={item.odometer ? `Km: ${item.odometer}${item.description ? ' • ' + item.description : ''}` : item.description}
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header section */}
      <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor, marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Abastecimentos</Text>
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
            <FuelForm
              onSubmit={(data) => handleCreate(data)}
              loading={saving}
              theme={theme}
              brandColor={brandColor}
            />
          </View>
        )}
      </View>

      {/* Filters Bar - Now integrated as a sub-header */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor, borderTopLeftRadius: 0, borderTopRightRadius: 0, elevation: 2, height: 54 }]}>
        <View style={{ flexDirection: 'row', flex: 1, gap: 6 }}>
          <TouchableOpacity 
            onPress={() => setTypeFilter('')} 
            style={[
              styles.catPill, 
              { 
                backgroundColor: !typeFilter ? brandColor : inputBg, 
                borderColor: !typeFilter ? brandColor : borderColor,
                paddingVertical: 6,
                paddingHorizontal: 10
              }
            ]}
          >
            <Text style={{ color: !typeFilter ? '#fff' : theme.text + '80', fontSize: 10, fontWeight: '700' }}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTypeFilter('gasoline')} 
            style={[
              styles.catPill, 
              { 
                backgroundColor: typeFilter === 'gasoline' ? brandColor : inputBg, 
                borderColor: typeFilter === 'gasoline' ? brandColor : borderColor,
                paddingVertical: 6,
                paddingHorizontal: 10
              }
            ]}
          >
            <Text style={{ color: typeFilter === 'gasoline' ? '#fff' : theme.text + '80', fontSize: 10, fontWeight: '700' }}>Gas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTypeFilter('Ethanol')} 
            style={[
              styles.catPill, 
              { 
                backgroundColor: typeFilter === 'Ethanol' ? brandColor : inputBg, 
                borderColor: typeFilter === 'Ethanol' ? brandColor : borderColor,
                paddingVertical: 6,
                paddingHorizontal: 10
              }
            ]}
          >
            <Text style={{ color: typeFilter === 'Ethanol' ? '#fff' : theme.text + '80', fontSize: 10, fontWeight: '700' }}>Eta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, borderColor, paddingLeft: 10 }}>
          <Ionicons name="calendar-outline" size={14} color={theme.text + '60'} style={{ marginRight: 4 }} />
          <TextInput
            value={dateFilter}
            onChangeText={setDateFilter}
            style={{ color: theme.text, fontSize: 11, width: 85 }}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={theme.text + '40'}
          />
        </View>
      </View>

      {/* List */}
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
              <Text style={[styles.emptyText, { color: theme.text + '60' }]}>Nenhum registro encontrado.</Text>
              <Text style={[styles.emptySubText, { color: theme.text + '40' }]}>Toque no + para registrar um abastecimento.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
