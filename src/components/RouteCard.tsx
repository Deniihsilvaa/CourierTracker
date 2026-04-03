import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Route } from '../types/route.types';
import { RouteActionsModal } from './RouteActionsModal';
import { Ionicons } from '@expo/vector-icons';

interface RouteCardProps {
  route: Route;
}

const statusTheme: Record<Route['route_status'], { bg: string, border: string, text: string, label: string }> = {
  pending: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-950', label: 'Pendente' },
  pickup: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', label: 'Em Coleta' },
  delivering: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', label: 'Em Entrega' },
  completed: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', label: 'Finalizado' },
  cancelled: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white', label: 'Cancelado' }
};

export const RouteCard: React.FC<RouteCardProps> = ({ route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const theme = statusTheme[route.route_status] || statusTheme.pending;

  return (
    <>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        className={`p-4 mb-4 rounded-xl border-l-4 bg-zinc-900 border-zinc-800 shadow-md flex-col justify-between dark:bg-zinc-800 ${theme.border}`}
      >
        <View className="flex-col">
          {/* Header Row */}
          <View className="flex-row items-center mb-4 justify-between">
            <View className={`px-2 py-1 rounded-md ${theme.bg}`}>
              <Text className={`text-xs font-bold uppercase ${theme.text}`}>{theme.label}</Text>
            </View>
            <View className="flex-row items-center">
              {route.payment_required && (
                <View className={`px-2 py-1 rounded-md ml-2 flex-row items-center ${route.payment_status === 'paid' ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                  <Ionicons name={route.payment_status === 'paid' ? 'checkmark' : 'close'} size={12} color={route.payment_status === 'paid' ? '#22c55e' : '#ef4444'} />
                  <Text className={`text-[10px] font-bold uppercase ml-1 ${route.payment_status === 'paid' ? 'text-green-400' : 'text-red-400'}`}>
                    {route.payment_status === 'paid' ? 'Pago' : 'Pagar na Entrega'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Route Content */}
          <View className="flex-row items-center">
            <View className="items-center mr-3 mt-1">
              <View className="w-3 h-3 rounded-full bg-blue-500" />
              <View className="w-1 h-6 bg-zinc-700" />
              <View className="w-3 h-3 rounded-full bg-orange-500" />
            </View>

            <View className="flex-1">
              <View className="mb-2">
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Coletar em</Text>
                <Text className="text-white font-medium text-sm leading-tight" numberOfLines={2}>
                  {route.pickup_location}
                </Text>
              </View>
              
              <View>
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Entregar para</Text>
                <Text className="text-white font-medium text-sm leading-tight" numberOfLines={2}>
                  {route.delivery_location}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer Info */}
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <View className="flex-row items-center">
              <View className="mr-6">
                <Text className="text-zinc-500 text-xs font-semibold mb-0.5">Valor da Corrida</Text>
                <Text className="text-green-400 font-extrabold text-lg">
                  R$ {route.value.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              
              {route.distance_km != null && (
                <View>
                  <Text className="text-zinc-500 text-xs font-semibold mb-0.5">Distância</Text>
                  <Text className="text-zinc-300 font-extrabold text-lg">
                    {route.distance_km} km
                  </Text>
                </View>
              )}
            </View>
            
            <View className="items-end bg-zinc-800/50 py-1.5 px-3 rounded-lg flex-row">
              <Text className="text-zinc-300 font-bold text-sm">Opções</Text>
              <Ionicons name="chevron-forward" size={16} color="#a1a1aa" style={{marginLeft: 4, marginTop: 1}} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <RouteActionsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        route={route} 
      />
    </>
  );
};
