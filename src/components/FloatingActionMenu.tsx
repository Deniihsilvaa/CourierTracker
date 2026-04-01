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
    { label: 'Abastecimento', icon: 'speedometer-outline', color: '#FF9800', route: '/fuels' },
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
        <Text style={styles.itemLabel} numberOfLines={1}>
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
          <Ionicons name={item.icon as any} size={22} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View
      style={[
        styles.container,
        expanded ? styles.fullScreen : styles.compact
      ]}
      pointerEvents="box-none"
    >
      {expanded && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.menuWrapper} pointerEvents="box-none">
        {menuItems.map((item, index) => renderItem(item, index))}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleMenu}
          style={[
            styles.mainButton,
            {
              backgroundColor: theme.tint,
              shadowColor: theme.tint,
            }
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={32} color="#FFF" />
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
    zIndex: 9999,
  },
  fullScreen: {
    top: 0,
    left: 0,
  },
  compact: {
    width: 100,
    height: 100, 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuWrapper: {
    position: 'absolute',
    bottom: 24, // Desce o botão de volta, agora no nível da tela inteira (Dashboard)
    right: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  itemContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: width - 60,
    right: 4,
    bottom: 4,
  },
  itemButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    color: '#FFF',
    backgroundColor: 'rgba(31, 41, 55, 0.95)', // Slate-800 com opacidade
    maxWidth: width * 0.6,
  },
});
