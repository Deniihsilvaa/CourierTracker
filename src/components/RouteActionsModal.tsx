import React from 'react';
import { View, Text, TouchableOpacity, Linking, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Route } from '../types/route.types';
import { useRouteStore } from '../store/routeStore';
import { navigationService } from '../services/navigationService';

interface RouteActionsModalProps {
  visible: boolean;
  onClose: () => void;
  route: Route | null;
}

export const RouteActionsModal: React.FC<RouteActionsModalProps> = ({ visible, onClose, route }) => {
  const { updateRouteStatus, markPaymentReceived, removeRoute } = useRouteStore();

  if (!route) return null;

  const handleStatusUpdate = (status: Route['route_status']) => {
    updateRouteStatus(route.id, status);
    onClose();
  };

  const handleDelete = () => {
    removeRoute(route.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ações da Rota</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Navegação */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navegação Rápida</Text>
            <TouchableOpacity 
              onPress={() => navigationService.chooseNavigationApp(route.pickup_location, route.pickup_lat, route.pickup_lng)} 
              style={styles.navButton}
            >
              <Ionicons name="navigate" size={20} color="#3b82f6" />
              <Text style={styles.navText}>Navegar até a Coleta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigationService.chooseNavigationApp(route.delivery_location, route.delivery_lat, route.delivery_lng)} 
              style={styles.navButton}
            >
              <Ionicons name="navigate" size={20} color="#f97316" />
              <Text style={styles.navText}>Navegar até a Entrega</Text>
            </TouchableOpacity>
          </View>

          {/* Status Rápido */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atualizar Status</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => handleStatusUpdate('pickup')} style={[styles.statusBtn, { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={{color: '#3b82f6', fontWeight: 'bold'}}>Iniciar Coleta</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleStatusUpdate('delivering')} style={[styles.statusBtn, { borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                <Text style={{color: '#f97316', fontWeight: 'bold'}}>Rota de Entrega</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleStatusUpdate('completed')} style={[styles.statusBtn, { borderColor: '#22c55e', backgroundColor: '#22c55e', marginTop: 10 }]}>
              <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>Finalizar Rota</Text>
            </TouchableOpacity>
          </View>

          {/* Pagamentos */}
          {route.payment_required && route.payment_status !== 'paid' && (
            <View style={styles.section}>
              <TouchableOpacity onPress={() => { markPaymentReceived(route.id); onClose(); }} style={[styles.actionBtn, { backgroundColor: '#10b981' }]}>
                <Ionicons name="cash-outline" size={22} color="white" />
                <Text style={styles.actionBtnText}>Confirmar Recebimento do Pagamento</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Options */}
          <View style={[styles.section, { borderBottomWidth: 0 }]}>
            <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' }]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Deletar Rota</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  navText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBtn: {
    flex: 0.48,
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  }
});
