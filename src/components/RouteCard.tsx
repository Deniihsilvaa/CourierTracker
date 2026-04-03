import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Route } from '../types/route.types';
import { RouteActionsModal } from './RouteActionsModal';
import { Ionicons } from '@expo/vector-icons';

interface RouteCardProps {
  route: Route;
}

const statusTheme: Record<Route['route_status'], { bg: string, border: string, text: string, label: string }> = {
  pending: { bg: 'bg-zinc-700', border: 'border-zinc-600', text: 'text-zinc-100', label: 'Pendente' },
  going_to_pickup: { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-white', label: 'Indo Coletar' },
  pickup_arrived: { bg: 'bg-indigo-600', border: 'border-indigo-500', text: 'text-white', label: 'Na Coleta' },
  delivering: { bg: 'bg-orange-600', border: 'border-orange-500', text: 'text-white', label: 'Em Entrega' },
  completed: { bg: 'bg-green-600', border: 'border-green-500', text: 'text-white', label: 'Finalizado' },
  cancelled: { bg: 'bg-red-600', border: 'border-red-500', text: 'text-white', label: 'Cancelado' }
};

export const RouteCard: React.FC<RouteCardProps> = ({ route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const theme = statusTheme[route.route_status] || statusTheme.pending;

  const totalKm = (route.driver_to_pickup_km || 0) + (route.pickup_to_delivery_km || 0);

  return (
    <>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        className={`p-4 mb-4 rounded-2xl border-l-4 bg-zinc-900 border-zinc-800 shadow-lg flex-col justify-between ${theme.border}`}
      >
        <View className="flex-col">
          {/* Header Row */}
          <View className="flex-row items-center mb-4 justify-between">
            <View className={`px-3 py-1 rounded-full ${theme.bg}`}>
              <Text className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>{theme.label}</Text>
            </View>
            <View className="flex-row items-center">
              {route.payment_required && (
                <View className={`px-2 py-1 rounded-md ml-2 flex-row items-center ${route.payment_status === 'paid' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <Ionicons name={route.payment_status === 'paid' ? 'checkmark-circle' : 'alert-circle'} size={14} color={route.payment_status === 'paid' ? '#22c55e' : '#ef4444'} />
                  <Text className={`text-[10px] font-bold uppercase ml-1 ${route.payment_status === 'paid' ? 'text-green-400' : 'text-red-400'}`}>
                    {route.payment_status === 'paid' ? 'Pago' : 'Receber R$'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Route Content */}
          <View className="flex-row items-start">
            <View className="items-center mr-3 mt-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <View className="w-0.5 h-10 bg-zinc-800 my-1" />
              <View className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            </View>

            <View className="flex-1">
              <View className="mb-3">
                <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Origem / Coleta</Text>
                <Text className="text-zinc-100 font-bold text-base leading-tight" numberOfLines={2}>
                  {route.pickup_location}
                </Text>
              </View>
              
              <View>
                <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Destino / Entrega</Text>
                <Text className={route.delivery_location ? "text-zinc-100 font-bold text-base leading-tight" : "text-zinc-600 italic font-medium text-base leading-tight"} numberOfLines={2}>
                  {route.delivery_location || 'Endereço não definido'}
                </Text>
              </View>
            </View>
          </View>

          {/* Metrics & Info */}
          <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-zinc-800/50">
            <View className="flex-row items-center">
              {route.value != null && (
                <View className="mr-6">
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Valor</Text>
                  <Text className="text-green-400 font-black text-xl">
                    R$ {route.value.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              )}
              
              {totalKm > 0 && (
                <View>
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Distância Real</Text>
                  <Text className="text-zinc-300 font-black text-xl">
                    {totalKm.toFixed(1)} <Text className="text-xs font-bold text-zinc-500">km</Text>
                  </Text>
                </View>
              )}
            </View>
            
            <View className="bg-zinc-800 p-2 rounded-xl">
              <Ionicons name="ellipsis-vertical" size={20} color="#71717a" />
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
