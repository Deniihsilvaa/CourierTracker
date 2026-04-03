import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouteStore } from '../../src/store/routeStore';
import { RouteCard } from '../../src/components/RouteCard';
import { CreateRouteModal } from '../../src/components/CreateRouteModal';
import { Route } from '../../src/types/route.types';

export default function RoutesScreen() {
  const { routes, loadRoutes, isLoading } = useRouteStore();
  const [modalVisible, setModalVisible] = useState(false);
  const handleCreate = () => {
    setModalVisible(true);
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-5 py-4 border-b border-zinc-900 bg-zinc-950 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-extrabold text-white tracking-tight">Rotas</Text>
          <Text className="text-green-400 font-medium text-sm mt-1">Gerenciamento Manual</Text>
        </View>
        <View className="bg-zinc-900 p-3 rounded-full">
          <Ionicons name="map" size={24} color="#22c55e" />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RouteCard route={item} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
              <View className="bg-zinc-800 p-6 rounded-full mb-6">
                <Ionicons name="compass-outline" size={64} color="#52525b" />
              </View>
              <Text className="text-white font-bold text-xl mb-2 text-center">
                Sem rotas ativas
              </Text>
              <Text className="text-zinc-500 font-medium text-base text-center leading-relaxed">
                Adicione suas entregas manuais registradas fora da plataforma tocando no botão abaixo.
              </Text>
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleCreate}
        className="absolute bottom-[24px] right-6 bg-green-500 w-[68px] h-[68px] rounded-full flex-row items-center justify-center shadow-2xl elevation-10 border border-green-400/50"
        activeOpacity={0.8}
        style={{
          shadowColor: '#22c55e',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        }}
      >
        <Ionicons name="add" size={36} color="white" />
      </TouchableOpacity>

      <CreateRouteModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}
