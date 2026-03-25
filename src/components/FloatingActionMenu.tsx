import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface FloatingActionMenuProps {
  onPressItem?: (item: string) => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ onPressItem }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const toggleMenu = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const menuItems: { label: string; icon: string; color: string; route?: string }[] = [
    { label: 'Abastecimento', icon: 'speedometer-outline', color: '#FF9800' },
    { label: 'Receita', icon: 'wallet-outline', color: '#4CAF50', route: '/incomes' },
    { label: 'Despesas', icon: 'receipt-outline', color: '#FF5252', route: '/expenses' },
    { label: 'Categorias', icon: 'list-outline', color: '#6C63FF', route: '/categories' },
  ];

  const renderItem = (item: typeof menuItems[0], index: number) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60 * (index + 1)],
    });

    const scale = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0, 1],
    });

    return (
      <Animated.View
        key={item.label}
        style={[
          styles.itemContainer,
          {
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <Text style={styles.itemLabel}>
          {item.label}
        </Text>
        <TouchableOpacity
          style={[styles.itemButton, { backgroundColor: item.color }]}
          onPress={() => {
            toggleMenu();
            if (item.route) {
              router.push(item.route as any);
            } else {
              onPressItem?.(item.label);
            }
          }}
        >
          <Ionicons name={item.icon as any} size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {expanded && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.menuWrapper}>
        {menuItems.map((item, index) => renderItem(item, index))}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleMenu}
          style={[
            styles.mainButton,
            {
              backgroundColor: '#FFF',
              borderColor: theme.tint,
              borderWidth: 2
            }
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={32} color={theme.tint} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width,
    height,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuWrapper: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  itemContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 24,
    bottom: 24,
  },
  itemButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    color: '#FFF',
    backgroundColor: '#333333',
  },
});
