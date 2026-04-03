import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Route } from '../types/route.types';
import { useRouteStore } from '../store/routeStore';
import { navigationService } from '../services/navigationService';
import { UpdateDeliveryModal } from './UpdateDeliveryModal';
import { FormatTime } from '../utils/format';

interface RouteActionsModalProps {
  visible: boolean;
  onClose: () => void;
  route: Route | null;
}

export const RouteActionsModal: React.FC<RouteActionsModalProps> = ({ visible, onClose, route }) => {
  const { 
    startPickup, 
    arriveAtPickup, 
    startDelivery, 
    arriveAtDelivery, 
    markPaymentReceived, 
    removeRoute 
  } = useRouteStore();

  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!route) return null;

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await removeRoute(route.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (action: (id: string) => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action(route.id);
      onClose();
    } catch (error) {
      console.error('[RouteActions] Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canNavigateToPickup = !!route.pickup_location;
  // Agora usamos a variável declarada para controle de estado se necessário, 
  // mas mantemos a lógica de renderização condicional.
  const hasDeliveryAddress = !!route.delivery_location;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Ações da Rota</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isProcessing}>
                <Ionicons name="close" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Histórico de Horários */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Histórico da Rota</Text>
                <View className="flex-row items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 mb-2">
                  <View className="items-center flex-1">
                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Criação</Text>
                    <Text className="text-zinc-100 font-black text-sm">{FormatTime(route.created_at)}</Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={12} color="#27272a" />
                  
                  <View className="items-center flex-1">
                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Aceite</Text>
                    <Text className={route.driver_start_at ? "text-blue-400 font-black text-sm" : "text-zinc-700 font-bold text-sm"}>
                      {FormatTime(route.driver_start_at)}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={12} color="#27272a" />

                  <View className="items-center flex-1">
                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Fim</Text>
                    <Text className={route.delivery_arrived_at ? "text-green-400 font-black text-sm" : "text-zinc-700 font-bold text-sm"}>
                      {FormatTime(route.delivery_arrived_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Navegação */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Navegação</Text>
                <TouchableOpacity 
                  onPress={() => navigationService.chooseNavigationApp(route.pickup_location, route.pickup_lat, route.pickup_lng)} 
                  style={styles.navButton}
                  disabled={!canNavigateToPickup || isProcessing}
                >
                  <Ionicons name="navigate" size={20} color={canNavigateToPickup ? "#3b82f6" : "#52525b"} />
                  <Text style={[styles.navText, !canNavigateToPickup && styles.disabledText]}>Navegar até a Coleta</Text>
                </TouchableOpacity>
                
                {hasDeliveryAddress ? (
                  <TouchableOpacity 
                    onPress={() => navigationService.chooseNavigationApp(route.delivery_location!, route.delivery_lat, route.delivery_lng)} 
                    style={styles.navButton}
                    disabled={isProcessing}
                  >
                    <Ionicons name="navigate" size={20} color="#f97316" />
                    <Text style={styles.navText}>Navegar até a Entrega</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={() => setDeliveryModalVisible(true)} 
                    style={[styles.navButton, { borderStyle: 'dashed', borderWidth: 1, borderColor: '#3f3f46', backgroundColor: 'transparent' }]}
                    disabled={isProcessing}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#a1a1aa" />
                    <Text style={[styles.navText, { color: '#a1a1aa' }]}>Adicionar Endereço de Entrega</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Rápido - Event Driven */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fluxo da Rota</Text>
                
                {route.route_status === 'pending' && (
                  <TouchableOpacity 
                    onPress={() => handleAction(startPickup)} 
                    style={[styles.eventBtn, { backgroundColor: '#3b82f6' }]}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="white" /> : (
                      <>
                        <Ionicons name="play" size={22} color="white" />
                        <Text style={styles.eventBtnText}>Iniciar Coleta (Sair agora)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {route.route_status === 'going_to_pickup' && (
                  <TouchableOpacity 
                    onPress={() => handleAction(arriveAtPickup)} 
                    style={[styles.eventBtn, { backgroundColor: '#3b82f6' }]}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="white" /> : (
                      <>
                        <Ionicons name="location" size={22} color="white" />
                        <Text style={styles.eventBtnText}>Cheguei na Coleta</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {route.route_status === 'pickup_arrived' && (
                  <TouchableOpacity 
                    onPress={() => handleAction(startDelivery)} 
                    style={[styles.eventBtn, { backgroundColor: '#f97316' }]}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="white" /> : (
                      <>
                        <Ionicons name="bicycle" size={22} color="white" />
                        <Text style={styles.eventBtnText}>Iniciar Entrega (Sair da Coleta)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {route.route_status === 'delivering' && (
                  <TouchableOpacity 
                    onPress={() => handleAction(arriveAtDelivery)} 
                    style={[styles.eventBtn, { backgroundColor: '#22c55e' }]}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="white" /> : (
                      <>
                        <Ionicons name="checkmark-circle" size={22} color="white" />
                        <Text style={styles.eventBtnText}>Finalizar Entrega (Entregue)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {route.route_status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-done-circle" size={24} color="#22c55e" />
                    <Text style={styles.completedText}>Rota Finalizada</Text>
                  </View>
                )}
              </View>

              {/* Pagamentos */}
              {route.payment_required && route.payment_status !== 'paid' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Financeiro</Text>
                  <TouchableOpacity 
                    onPress={() => handleAction(markPaymentReceived)} 
                    style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="white" /> : (
                      <>
                        <Ionicons name="cash-outline" size={22} color="white" />
                        <Text style={styles.actionBtnText}>Marcar como Pago</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Editar Endereço */}
              {route.route_status !== 'completed' && route.delivery_location && (
                <View style={styles.section}>
                  <TouchableOpacity 
                    onPress={() => setDeliveryModalVisible(true)} 
                    style={[styles.actionBtn, { backgroundColor: '#27272a' }]}
                    disabled={isProcessing}
                  >
                    <Ionicons name="create-outline" size={20} color="white" />
                    <Text style={styles.actionBtnText}>Editar Endereço de Entrega</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Opções de perigo */}
              <View style={[styles.section, { borderBottomWidth: 0 }]}>
                <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' }]} disabled={isProcessing}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Deletar Rota</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <UpdateDeliveryModal 
        visible={deliveryModalVisible} 
        onClose={() => setDeliveryModalVisible(false)} 
        route={route} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#27272a',
    borderRadius: 20,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 24,
  },
  sectionTitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  navText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 12,
    fontSize: 16,
  },
  disabledText: {
    color: '#52525b',
  },
  eventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 64,
  },
  eventBtnText: {
    color: 'white',
    fontWeight: '900',
    marginLeft: 12,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22c55e',
    padding: 16,
    borderRadius: 16,
  },
  completedText: {
    color: '#22c55e',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 18,
  }
});
