import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';
import { Button } from './Button';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react-native';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  isNetworkError?: boolean;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'An error occurred while loading content from the server. Please try again.',
  isNetworkError = false,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBox}>
        {isNetworkError ? (
          <WifiOff size={40} color={Colors.danger} />
        ) : (
          <AlertTriangle size={40} color={Colors.warning} />
        )}
      </View>

      <Text style={styles.title}>{isNetworkError ? 'Connection Error' : title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          icon={<RefreshCw size={16} color="#FFFFFF" />}
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
