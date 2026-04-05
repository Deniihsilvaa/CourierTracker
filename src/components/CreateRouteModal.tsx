import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { useRouteStore } from '../store/routeStore';
import { Ionicons } from '@expo/vector-icons';
import { ClientPickerModal } from '@/src/modules/clients/components/ClientPickerModal';
import { Client } from '../types/route.types';

interface CreateRouteModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateRouteModal: React.FC<CreateRouteModalProps> = ({ visible, onClose }) => {
  const { addRoute } = useRouteStore();
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [value, setValue] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleConfirm = async () => {
    if (!pickup.trim()) return;

    setIsSubmitting(true);
    const numericValue = value.trim() ? parseFloat(value.replace(',', '.')) : null;

    try {
      await addRoute({
        pickup_location: pickup,
        delivery_location: delivery.trim() || null,
        value: numericValue,
        payment_required: paymentRequired,
        client_id: selectedClient?.id ?? undefined,
      });

      // Reset
      setPickup('');
      setDelivery('');
      setValue('');
      setPaymentRequired(true);
      setSelectedClient(null);
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
        <View className="bg-[#121214] rounded-t-3xl p-6 h-[85%] border-t border-zinc-800 shadow-2xl">
          <View className="flex-row justify-between items-center mb-6 pt-2">
            <Text className="text-white text-2xl font-extrabold tracking-tight">
              Nova Rota
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-800 rounded-full" disabled={isSubmitting}>
              <Ionicons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16 }}>
              <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">Cliente</Text>
                    <Text className="text-white font-bold text-base mt-1">
                      {selectedClient ? selectedClient.name : 'Nenhum cliente selecionado'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPickerVisible(true)}
                    className="bg-blue-600 rounded-xl px-4 py-3"
                    disabled={isSubmitting}
                  >
                    <Text className="text-white font-bold">
                      {selectedClient ? 'Trocar' : 'Selecionar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedClient ? (
                  <View style={{ gap: 4 }}>
                    <Text className="text-zinc-300 font-medium">{selectedClient.address}</Text>
                    <Text className="text-zinc-500 text-sm">{selectedClient.phone || 'Sem telefone'}</Text>
                    <TouchableOpacity onPress={() => setSelectedClient(null)} disabled={isSubmitting}>
                      <Text className="text-red-400 font-semibold mt-2">Remover cliente</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-zinc-500 font-medium">
                    Use um cliente salvo para preencher a coleta mais rápido.
                  </Text>
                )}
              </View>

              <View>
                <Text className="text-zinc-400 mb-2 font-bold uppercase tracking-wider text-xs">Coleta</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl font-medium text-base shadow-sm"
                  placeholder="Endereço de Coleta / Nome do Cliente"
                  placeholderTextColor="#52525b"
                  value={pickup}
                  onChangeText={setPickup}
                  editable={!isSubmitting}
                />
              </View>

              <View>
                <Text className="text-zinc-400 mb-2 font-bold uppercase tracking-wider text-xs">Entrega</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl font-medium text-base shadow-sm"
                  placeholder="Endereço de destino final"
                  placeholderTextColor="#52525b"
                  value={delivery}
                  onChangeText={setDelivery}
                  editable={!isSubmitting}
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
                  editable={!isSubmitting}
                />
              </View>
              
              <View className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <Text className="text-white font-bold text-base">Pagamento na Entrega?</Text>
                <Switch
                  value={paymentRequired}
                  onValueChange={setPaymentRequired}
                  trackColor={{ false: '#3f3f46', true: '#22c55e' }}
                  thumbColor="#fff"
                  disabled={isSubmitting}
                />
              </View>

              <TouchableOpacity 
                onPress={handleConfirm}
                disabled={isSubmitting}
                className={`rounded-2xl p-5 items-center mt-8 mb-10 shadow-lg elevation-4 border ${
                  isSubmitting ? 'bg-zinc-800 border-zinc-700' : 'bg-green-600 border-green-500'
                }`}
              >
                <Text className={`font-extrabold text-lg uppercase tracking-wider ${
                  isSubmitting ? 'text-zinc-500' : 'text-white'
                }`}>
                  {isSubmitting ? 'Criando Rota...' : 'Criar Rota'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ClientPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectClient={(client) => {
          setSelectedClient(client);
          setPickup(client.address);
          setPickerVisible(false);
        }}
      />
    </Modal>
  );
};
