import React from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

export const Button = ({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  disabled,
  onPress,
  style,
}: ButtonProps) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.primary;
      case 'secondary': return styles.secondary;
      case 'outline': return styles.outline;
      case 'ghost': return styles.ghost;
      case 'danger': return styles.danger;
      default: return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.sm;
      case 'md': return styles.md;
      case 'lg': return styles.lg;
      default: return styles.md;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return styles.textPrimary;
      case 'secondary': return styles.textSecondary;
      case 'outline': return styles.textOutline;
      case 'ghost': return styles.textGhost;
      case 'danger': return styles.textDanger;
      default: return styles.textPrimary;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.textSm;
      case 'md': return styles.textMd;
      case 'lg': return styles.textLg;
      default: return styles.textMd;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#2563eb' : '#fff'} />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          {title ? (
            <Text style={[getTextStyle(), getTextSizeStyle()]}>
              {title}
            </Text>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2563eb',
  },
  secondary: {
    backgroundColor: '#e5e7eb',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#dc2626',
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  textPrimary: {
    color: '#fff',
    fontWeight: '600',
  },
  textSecondary: {
    color: '#111827',
    fontWeight: '600',
  },
  textOutline: {
    color: '#2563eb',
    fontWeight: '600',
  },
  textGhost: {
    color: '#2563eb',
    fontWeight: '600',
  },
  textDanger: {
    color: '#fff',
    fontWeight: '600',
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
