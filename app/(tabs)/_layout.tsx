import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { appColors, radius } from '@/src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: appColors.textPrimary,
        tabBarInactiveTintColor: appColors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(9, 16, 28, 0.92)',
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: appColors.border,
            }}
          />
        ),
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 18,
            height: 74,
            paddingTop: 8,
            borderTopWidth: 0,
            backgroundColor: 'transparent',
          },
          default: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 18,
            height: 74,
            paddingTop: 8,
            borderTopWidth: 0,
            backgroundColor: 'transparent',
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Sessões',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="calendar-clear-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rotas',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="wallet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='rastreamento'
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
