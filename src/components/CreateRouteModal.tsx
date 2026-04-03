import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Route } from '../types/route.types';
import { useRouteStore } from '../store/routeStore';
import { Ionicons } from '@expo/vector-icons';

interface CreateRouteModalProps {
  visible: boolean;
  onClose: () => void;
  routeToEdit?: Route | null;
}

export const CreateRouteModal: React.FC<CreateRouteModalProps> = ({ visible, onClose, routeToEdit }) => {
  const { addRoute, updateRouteStatus } = useRouteStore();
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Route['status']>('pending');

  useEffect(() => {
    if (routeToEdit) {
      setPickup(routeToEdit.pickup_location);
      setDelivery(routeToEdit.delivery_location);
      setValue(routeToEdit.value.toString());
      setStatus(routeToEdit.status);
    } else {
      setPickup('');
      setDelivery('');
      setValue('');
      setStatus('pending');
    }
  }, [routeToEdit, visible]);

  const handleConfirm = () => {
    if (!routeToEdit) {
      if (!pickup.trim() || !delivery.trim() || !value.trim()) return;
    }

    const numericValue = parseFloat(value.replace(',', '.'));

    if (routeToEdit) {
      updateRouteStatus(routeToEdit.id, status);
    } else {
      addRoute({
        pickup_location: pickup,
        delivery_location: delivery,
        value: isNaN(numericValue) ? 0 : numericValue,
        distance_km: null,
        status
      });
    }

    setPickup('');
    setDelivery('');
    setValue('');
    setStatus('pending');
    onClose();
  };

  const statusOptions: { label: string, value: Route['status'], icon: keyof typeof Ionicons.glyphMap, color: string }[] = [
    { label: 'Pendente', value: 'pending', icon: 'time-outline', color: 'text-yellow-500' },
    { label: 'Coleta', value: 'pickup', icon: 'cube-outline', color: 'text-blue-500' },
    { label: 'Entrega', value: 'delivering', icon: 'car-outline', color: 'text-orange-500' },
    { label: 'Finalizado', value: 'completed', icon: 'checkmark-circle-outline', color: 'text-green-500' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/70 justify-end"
      >
        <View className="bg-[#121214] rounded-t-3xl p-6 h-[85%] border-t border-zinc-800 shadow-2xl">
          <View className="flex-row justify-between items-center mb-6 pt-2">
            <Text className="text-white text-2xl font-extrabold tracking-tight">
              {routeToEdit ? 'Atualizar Rota' : 'Nova Rota'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full">
              <Ionicons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16 }}>
              {!routeToEdit && (
                <>
                  <View>
                    <Text className="text-zinc-400 mb-2 font-bold uppercase tracking-wider text-xs">Coleta</Text>
                    <TextInput
                      className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl font-medium text-base shadow-sm"
                      placeholder="Endereço ou nome do cliente"
                      placeholderTextColor="#52525b"
                      value={pickup}
                      onChangeText={setPickup}
                    />
                  </View>

                  <View>
                    <Text className="text-zinc-400 mb-2 font-bold uppercase tracking-wider text-xs">Entrega</Text>
                    <TextInput
                      className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl font-medium text-base shadow-sm"
                      placeholder="Endereço de entrega"
                      placeholderTextColor="#52525b"
                      value={delivery}
                      onChangeText={setDelivery}
                    />
                  </View>

                  <View>
                    <Text className="text-zinc-400 mb-2 font-bold uppercase tracking-wider text-xs">Valor da Entrega (R$)</Text>
                    <TextInput
                      className="bg-zinc-900 border border-zinc-800 text-green-400 p-4 rounded-2xl font-bold text-lg shadow-sm"
                      placeholder="0,00"
                      placeholderTextColor="#3f3f46"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={setValue}
                    />
                  </View>
                </>
              )}

              <View className="mt-4">
                <Text className="text-zinc-400 mb-3 font-bold uppercase tracking-wider text-xs">Status da Rota</Text>
                <View className="flex-row flex-wrap justify-between" style={{ gap: 12 }}>
                  {statusOptions.map((opt) => {
                    const isSelected = status === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setStatus(opt.value)}
                        className={`py-4 px-3 rounded-2xl flex-row items-center justify-center border-2 w-[47%] ${
                          isSelected ? 'bg-zinc-900 border-green-500' : 'bg-black border-zinc-800'
                        }`}
                      >
                        <Ionicons 
                          name={opt.icon} 
                          size={18} 
                          color={isSelected ? '#22c55e' : '#a1a1aa'} 
                        />
                        <Text 
                          className={`ml-2 text-center font-bold ${
                            isSelected ? 'text-white' : 'text-zinc-400'
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleConfirm}
                className="bg-green-600 rounded-2xl p-5 items-center mt-8 mb-10 shadow-lg elevation-4 border border-green-500"
              >
                <Text className="text-white font-extrabold text-lg uppercase tracking-wider">
                  {routeToEdit ? 'Confirmar Status' : 'Adicionar Rota'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
