import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/theme';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3500,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismissRef.current();
    });
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
    }
  }, [visible, duration, translateY]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'error': return '#FEF2F2';
      case 'info': return '#F0F9FF';
      default: return '#ECFDF5';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error': return '#EF4444';
      case 'info': return Colors.primary;
      default: return '#10B981';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertCircle size={20} color="#EF4444" />;
      case 'info': return <Info size={20} color={Colors.primary} />;
      default: return <CheckCircle size={20} color="#10B981" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(), borderColor: getBorderColor(), transform: [{ translateY }] },
      ]}
    >
      <View style={styles.contentRow}>
        {getIcon()}
        <Text style={styles.messageText}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
          <X size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 10,
    marginRight: 8,
  },
  closeBtn: {
    padding: 4,
  },
});
