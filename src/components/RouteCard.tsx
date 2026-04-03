import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Route } from '../types/route.types';
import { useRouteStore } from '../store/routeStore';

interface RouteCardProps {
  route: Route;
  onEdit: (route: Route) => void;
}

const statusTheme: Record<Route['status'], { bg: string, border: string, text: string, label: string }> = {
  pending: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-950', label: 'Pendente' },
  pickup: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', label: 'Em Coleta' },
  delivering: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', label: 'Em Entrega' },
  completed: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Finalizado' }
};

export const RouteCard: React.FC<RouteCardProps> = ({ route, onEdit }) => {
  const { removeRoute, updateRouteStatus } = useRouteStore();
  const theme = statusTheme[route.status];

  const handleLongPress = () => {
    Alert.alert(
      'Ações da Rota',
      'O que deseja fazer?',
      [
        { text: 'Editar / Alterar Status', onPress: () => onEdit(route) },
        { 
          text: 'Marcar como Concluída', 
          onPress: () => updateRouteStatus(route.id, 'completed') 
        },
        { 
          text: 'Excluir Rota', 
          onPress: () => confirmDelete(), 
          style: 'destructive' 
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Excluir Rota',
      'Tem certeza que deseja excluir esta rota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => removeRoute(route.id), style: 'destructive' }
      ]
    );
  };

  return (
    <TouchableOpacity 
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
      className={`p-4 mb-4 rounded-xl border-l-4 bg-zinc-900 border-zinc-800 shadow-md flex-row justify-between dark:bg-zinc-800 ${theme.border}`}
    >
      <View className="flex-1 flex-col">
        <View className="flex-row items-center mb-3 justify-between">
          <View className={`px-2 py-1 rounded-md ${theme.bg}`}>
            <Text className={`text-xs font-bold uppercase ${theme.text}`}>{theme.label}</Text>
          </View>
          {!route.synced && (
            <Text className="text-xs text-orange-400 font-semibold bg-orange-400/10 px-2 py-1 rounded-md">
              Aguardando Sync
            </Text>
          )}
        </View>

        <View className="mb-2">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Coleta</Text>
          <Text className="text-white font-medium text-base" numberOfLines={2}>
            {route.pickup_location}
          </Text>
        </View>
        
        <View className="mb-3">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Entrega</Text>
          <Text className="text-white font-medium text-base" numberOfLines={2}>
            {route.delivery_location}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-zinc-800">
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-1">Valor Final</Text>
            <Text className="text-green-400 font-bold text-lg">
              R$ {route.value.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          
          {route.distance_km != null && (
            <View className="items-end">
              <Text className="text-zinc-400 text-xs font-semibold mb-1">Distância</Text>
              <Text className="text-zinc-300 font-medium">
                {route.distance_km.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
