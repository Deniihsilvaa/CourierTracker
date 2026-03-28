import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/card';
import { Ionicons } from '@expo/vector-icons';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string | React.ReactNode;
  color?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  style?: any;
  variant?: 'elevated' | 'flat' | 'outline';
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  color = '#2563eb',
  trend,
  style,
  variant = 'elevated',
}: MetricCardProps) => {
  return (
    <Card variant={variant} style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            {typeof icon === 'string' ? (
              <Ionicons name={icon as any} size={20} color={color} />
            ) : (
              icon
            )}
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: '#111827' }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {trend && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendValue,
              { color: trend.isPositive ? '#16a34a' : '#dc2626' }
            ]}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    flex: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
