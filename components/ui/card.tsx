import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface CardProps {
  variant?: 'elevated' | 'flat' | 'outline';
  style?: any;
  children?: React.ReactNode;
}

export const Card = ({
  variant = 'elevated',
  style,
  children,
  ...props
}: CardProps) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated': return styles.elevated;
      case 'flat': return styles.flat;
      case 'outline': return styles.outline;
      default: return styles.elevated;
    }
  };

  return (
    <View
      style={[
        styles.base,
        getVariantStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  flat: {
    backgroundColor: '#f9fafb',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
