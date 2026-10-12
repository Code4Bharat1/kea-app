import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/theme';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ message, fullScreen = false }) => {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : null]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
