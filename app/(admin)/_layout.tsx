import React from 'react';
import { Stack } from 'expo-router';
import ToastOverride from '../../src/components/admin/ToastOverride';

export default function AdminLayout() {
  return (
    <>
      <ToastOverride />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0B132B', flex: 1 },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="admins" />
        <Stack.Screen name="blogs" />
        <Stack.Screen name="blog-details" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}
