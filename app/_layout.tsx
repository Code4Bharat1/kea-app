import React from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/context/AuthContext';
import { SidebarProvider } from '../src/context/SidebarContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '../src/store';

// Ignore non-critical Expo CLI WebSocket and dev-server warnings
LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  'Calling setState synchronously within an effect',
  'userApi.getMe',
  'Backend verification failed',
]);

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <SidebarProvider>
              <StatusBar style="dark" />
              <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { flex: 1, backgroundColor: '#F8FAFC' },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="profile/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="profile/edit" options={{ presentation: 'card' }} />
              <Stack.Screen name="profile/resumes" options={{ presentation: 'card' }} />
              <Stack.Screen name="community/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="community/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="community/create" options={{ presentation: 'modal' }} />
              <Stack.Screen name="community/groups/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="community/mentorship/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="community/mentorship/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="events/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="events/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="jobs/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="jobs/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="jobs/post" options={{ presentation: 'card' }} />
              <Stack.Screen name="jobs/apply" options={{ presentation: 'modal' }} />
              <Stack.Screen name="jobs/saved" options={{ presentation: 'card' }} />
              <Stack.Screen name="gallery/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="blogs/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="blogs/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="knowledge/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="knowledge/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="tools/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="members/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="members/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="profile/activity" options={{ presentation: 'card' }} />
              <Stack.Screen name="activity/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="settings" options={{ presentation: 'card' }} />
              <Stack.Screen name="help" options={{ presentation: 'card' }} />
              <Stack.Screen name="feedback" options={{ presentation: 'card' }} />
            </Stack>
            </SidebarProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
