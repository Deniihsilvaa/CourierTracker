import { MetricCard } from '@/components/blocks/metric-card';
import { Screen } from '@/components/layouts/screen';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import useSessions, { WorkSession } from '@/src/hooks/useSessions';
import { FormatDuration } from '@/src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';

export default function TripsScreen() {
  const {
    sessions,
    loading,
    refreshing,
    onRefresh,
    totals,
    sections,
    theme,
    setTimeFilter,
    timeFilter,
    deleteSession
  } = useSessions();

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir Turno',
      'Deseja realmente excluir este turno? Todos os dados associados serão perdidos permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSession(id);
            if (success) {
              ToastAndroid.show('Turno excluído.', ToastAndroid.SHORT);
            } else {
              Alert.alert('Erro', 'Não foi possível excluir o turno.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: WorkSession }) => {
    const isClosed = item.status === 'closed';

    return (
      <View className="mb-4">
        <Card variant="elevated" style={{ padding: 16 }}>
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color={theme.text + '80'} />
              <ThemedText className="ml-2 font-medium text-gray-500">
                {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {item.end_time && ` - ${new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </ThemedText>
            </View>
            <View className="flex-row items-center">
              <View
                className={`px-3 py-1 rounded-full mr-2 ${isClosed ? 'bg-green-100' : 'bg-orange-100'}`}
                style={{ backgroundColor: isClosed ? '#10b981' : '#f59e0b' }}
              >
                <ThemedText className="text-[10px] font-bold text-gray-500">{isClosed ? 'CONCLUÍDO' : 'EM ANDAMENTO'}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={18} color={theme.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View className="flex-1">
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="navigate-circle-outline" size={10} color="#3b82f6" />
                  <ThemedText className="ml-2 text-[10px] font-bold text-gray-500 uppercase">Distância</ThemedText>
                </View>
                <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: '#000', marginTop: 5, height: 24 }}>
                  {(item.total_distance_km || 0).toFixed(1)} <ThemedText style={{ fontSize: 12, fontWeight: 'normal', color: theme.tint + '80' }}>km</ThemedText>
                </ThemedText>
              </View>

              <View style={{ flex: 1 }}>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="stopwatch-outline" size={18} color="#10b981" />
                  <ThemedText className="ml-2 text-[10px] font-bold text-gray-500 uppercase">Tempo Ativo</ThemedText>
                </View>
                <ThemedText className="text-lg font-bold text-gray-500">
                  {FormatDuration({ seconds: item.total_active_seconds || 0, format: 'short' })}
                </ThemedText>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="speedometer-outline" size={18} color={theme.tint} />
                  <ThemedText className="ml-2 text-[10px] font-bold text-gray-500 uppercase">Odômetro</ThemedText>
                </View>
                <ThemedText className="text-lg font-bold text-gray-500">
                  {item.start_odometer || '---'} &rarr; {item.end_odometer || '---'}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>

          <View className="flex-row justify-between items-center pt-3 border-t border-gray-100" style={{ borderColor: theme.text + '10' }}>
            <ThemedText className="text-[10px] text-gray-400 font-medium">ID: {item.id.slice(0, 8)}</ThemedText>
            <Ionicons name="chevron-forward" size={16} color={theme.text + '40'} />
          </View>
        </Card>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: theme.background + '0.5', marginHorizontal: -16 }}>
      <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{section.title}</ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginRight: 8 }} />
        <ThemedText style={{ fontSize: 12, fontWeight: '600', color: theme.text + '80' }}>
          {section.totalKm.toFixed(1)} km • {section.count} {section.count === 1 ? 'turno' : 'turnos'}
        </ThemedText>
      </View>
    </View>
  );

  const Header = () => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <ThemedText type="title" className="text-2xl font-extrabold tracking-tight">Histórico de Turnos</ThemedText>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={refreshing}
          style={{ padding: 8, borderRadius: 100, backgroundColor: '#3b82f6' }}
        >
          <Ionicons
            name="sync-outline"
            size={22}
            color={theme.tint}
            style={refreshing ? { opacity: 0.5 } : null}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row space-x-2 mb-8">
        {(['7d', '30d', 'all'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setTimeFilter(filter)}
            className={`px-5 py-2.5 rounded-2xl flex-1 items-center justify-center ${timeFilter === filter ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-gray-100'
              }`}
          >
            <ThemedText style={{ fontSize: 14, fontWeight: 'bold', color: timeFilter === filter ? '#fff' : '#6b7280' }}>
              {filter === '7d' ? '7 dias' : filter === '30d' ? '30 dias' : 'Tudo'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {sessions.length > 0 && (
        <View className="flex-row space-x-3">
          <MetricCard
            title="TOTAL KM"
            value={totals.distance.toFixed(1)}
            icon="navigate-outline"
            color={theme.tint}
            variant="flat"
            style={{ flex: 1 }}
          />
          <MetricCard
            title="TURNOS"
            value={totals.count}
            icon="calendar-outline"
            color={theme.tint}
            variant="flat"
            style={{ flex: 1 }}
          />
          <MetricCard
            title="TEMPO"
            value={Math.floor(totals.duration / 3600)}
            unit="h"
            icon="time-outline"
            color={theme.tint}
            variant="flat"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );

  return (
    <Screen scrollable={false} style={{ backgroundColor: theme.background }}>
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText className="mt-4 text-gray-500">Carregando histórico...</ThemedText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          ListHeaderComponent={Header}
          contentContainerStyle={{ paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
                <Ionicons name="calendar-clear-outline" size={40} color="#94a3b8" />
              </View>
              <ThemedText className="text-lg font-bold text-center text-gray-900 mb-2">
                Nenhum turno encontrado
              </ThemedText>
              <ThemedText className="text-sm text-center text-gray-500 leading-5">
                Seus turnos de trabalho aparecerão aqui após serem encerrados e sincronizados com o servidor.
              </ThemedText>
            </View>
          }
        />
      )}
    </Screen>
  );
}
