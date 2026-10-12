import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../src/constants/theme';
import { Loader } from '../src/components/common/Loader';

import { Image } from 'react-native';

export default function IndexScreen() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Image
          source={require('../assets/kea-logo-banner.png')}
          style={styles.fullLogoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Kokani Engineers Association</Text>
        <Text style={styles.subtitle}>Empowering Engineering Excellence</Text>
      </View>

      <View style={styles.loaderContainer}>
        <Loader message="Initializing App Session..." />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  fullLogoImage: {
    width: 280,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loaderContainer: {
    marginBottom: 20,
  },
});
