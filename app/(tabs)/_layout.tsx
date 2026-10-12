import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F8FAFC', flex: 1 },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="more" />
    </Stack>
  );
}


