import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LocationDisclosureModal = ({ visible, onConfirm, onCancel }: Props) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={48} color={theme.tint} />
            </View>
            
            <Text style={[styles.title, { color: theme.text }]}>Uso da sua Localização</Text>
            
            <Text style={[styles.description, { color: theme.text }]}>
              O Courier Tracker coleta dados de localização para habilitar o rastreamento das suas entregas, 
              mesmo quando o aplicativo está fechado ou não está em uso.
            </Text>

            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Cálculo preciso de distância percorrida.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Registro de rotas para comprovação de entrega.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.bulletText, { color: theme.text }]}>
                Métricas de eficiência e tempo ativo.
              </Text>
            </View>

            <Text style={[styles.footerText, { color: theme.icon }]}>
              Esses dados são essenciais para o funcionamento do app e para o cálculo correto dos seus ganhos.
            </Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton, { backgroundColor: theme.tint }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Entendi e Aceito</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={[styles.cancelButtonText, { color: theme.icon }]}>Agora não</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scrollContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButton: {},
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
