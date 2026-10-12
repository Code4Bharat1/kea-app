import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { Home, Calendar, Briefcase, MoreHorizontal } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen name="index" />

      {/* 2. Events */}
      <Tabs.Screen name="events" />

      {/* 3. Jobs */}
      <Tabs.Screen name="jobs" />

      {/* 4. More */}
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}
