import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouteStore } from '../store/routeStore';
import { Ionicons } from '@expo/vector-icons';
import { Route } from '../types/route.types';

interface UpdateDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  route: Route | null;
}

export const UpdateDeliveryModal: React.FC<UpdateDeliveryModalProps> = ({ visible, onClose, route }) => {
  const { updateDeliveryAddress } = useRouteStore();
  const [delivery, setDelivery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (route) {
      setDelivery(route.delivery_location || '');
    }
  }, [route, visible]);

  const handleConfirm = async () => {
    if (!route || !delivery.trim()) return;

    setIsSubmitting(true);
    try {
      await updateDeliveryAddress(route.id, delivery.trim());
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/70 justify-end"
      >
        <View className="bg-[#121214] rounded-t-3xl p-6 border-t border-zinc-800 shadow-2xl">
          <View className="flex-row justify-between items-center mb-6 pt-2">
            <Text className="text-white text-2xl font-extrabold tracking-tight">
              Endereço de Entrega
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full" disabled={isSubmitting}>
              <Ionicons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <Text className="text-zinc-400 mb-2 font-bold uppercase tracking-wider text-xs">Destino Final</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl font-medium text-base shadow-sm"
              placeholder="Endereço de destino final"
              placeholderTextColor="#52525b"
              value={delivery}
              onChangeText={setDelivery}
              editable={!isSubmitting}
              autoFocus
            />
          </View>

          <TouchableOpacity 
            onPress={handleConfirm}
            disabled={isSubmitting || !delivery.trim()}
            className={`rounded-2xl p-5 items-center mb-10 shadow-lg elevation-4 border ${
              isSubmitting || !delivery.trim() ? 'bg-zinc-800 border-zinc-700' : 'bg-blue-600 border-blue-500'
            }`}
          >
            <Text className={`font-extrabold text-lg uppercase tracking-wider ${
              isSubmitting || !delivery.trim() ? 'text-zinc-500' : 'text-white'
            }`}>
              {isSubmitting ? 'Salvando...' : 'Salvar Endereço'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
