import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../ui/button';

interface QuickActionsProps {
  handleRouteEvent: (type: 'pickup' | 'dropoff' | 'waiting') => void;
  isTracking: boolean;
}

export const QuickActions = ({ handleRouteEvent, isTracking }: QuickActionsProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ações Rápidas</Text>
      <View style={styles.grid}>
        <Button
          variant="secondary"
          onPress={() => handleRouteEvent('pickup')}
          disabled={!isTracking}
          style={styles.button}
          leftIcon={<Ionicons name="cube" size={20} color="#2563eb" />}
          title="Coleta"
        />
        <Button
          variant="secondary"
          onPress={() => handleRouteEvent('dropoff')}
          disabled={!isTracking}
          style={styles.button}
          leftIcon={<Ionicons name="checkmark-circle" size={20} color="#059669" />}
          title="Entrega"
        />
        <Button
          variant="secondary"
          onPress={() => handleRouteEvent('waiting')}
          disabled={!isTracking}
          style={styles.button}
          leftIcon={<Ionicons name="time" size={20} color="#d97706" />}
          title="Espera"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
});
