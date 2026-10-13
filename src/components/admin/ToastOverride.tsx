import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

// Global emitter for programmatic and alert-intercepted toasts
type ToastListener = (toast: ToastData) => void;
const toastListeners = new Set<ToastListener>();

export const triggerAdminToast = (message: any, customType?: ToastType) => {
  if (message === undefined || message === null) return;
  const msgStr = String(message);

  let type: ToastType = customType || 'info';
  let cleanMessage = msgStr;

  if (!customType) {
    const lower = msgStr.toLowerCase();
    if (
      msgStr.startsWith('✅') ||
      lower.includes('success') ||
      lower.includes('approved') ||
      lower.includes('updated') ||
      lower.includes('sent')
    ) {
      type = 'success';
      cleanMessage = msgStr.replace(/^[✅\s\t\n]+/, '').trim();
    } else if (
      msgStr.startsWith('❌') ||
      lower.includes('fail') ||
      lower.includes('error') ||
      lower.includes('denied') ||
      lower.includes('forbidden')
    ) {
      type = 'error';
      cleanMessage = msgStr.replace(/^[❌\s\t\n]+/, '').trim();
    } else if (
      msgStr.startsWith('⚠️') ||
      lower.includes('warning') ||
      lower.includes('caution') ||
      lower.includes('required')
    ) {
      type = 'warning';
      cleanMessage = msgStr.replace(/^[⚠️\s\t\n]+/, '').trim();
    } else {
      type = 'info';
      cleanMessage = msgStr.trim();
    }
  }

  const payload: ToastData = {
    id: Date.now() + Math.random(),
    message: cleanMessage,
    type,
  };

  toastListeners.forEach((listener) => listener(payload));
};

export const adminToast = {
  success: (msg: string) => triggerAdminToast(msg, 'success'),
  error: (msg: string) => triggerAdminToast(msg, 'error'),
  warning: (msg: string) => triggerAdminToast(msg, 'warning'),
  info: (msg: string) => triggerAdminToast(msg, 'info'),
};

const originalAlert = Alert.alert;

export default function ToastOverride() {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  // 1. Intercept window.alert on web & Alert.alert on Native
  useEffect(() => {
    // Web window.alert override
    if (typeof window !== 'undefined') {
      window.alert = (message: any) => {
        triggerAdminToast(message);
      };
    }

    // Native Alert.alert override
    Alert.alert = ((title: string, message?: string, buttons?: any[], options?: any) => {
      // If there are multiple interactive buttons (e.g. Cancel + Confirm dialog), preserve native alert
      if (buttons && buttons.length > 1) {
        return originalAlert(title, message, buttons, options);
      }

      // Otherwise, convert simple informative popup to sleek Toast
      const fullMsg = message ? `${title ? `${title}: ` : ''}${message}` : title;
      triggerAdminToast(fullMsg);
    }) as any;

    return () => {
      Alert.alert = originalAlert;
    };
  }, []);

  // 2. Listen to toast events
  useEffect(() => {
    const handleToast = (toast: ToastData) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setCurrentToast(toast);

      // Reset animation position
      translateY.setValue(-100);
      opacity.setValue(0);

      // Slide in animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          speed: 16,
          bounciness: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3.5 seconds
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 3500);
    };

    toastListeners.add(handleToast);
    return () => {
      toastListeners.delete(handleToast);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [translateY, opacity]);

  const dismissToast = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
    });
  };

  if (!currentToast) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={20} color="#F59E0B" />;
      default:
        return <Info size={20} color="#3B82F6" />;
    }
  };

  const getIndicatorColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        { top: Math.max(insets.top, 14) + 6 },
      ]}
    >
      <Animated.View
        style={[
          styles.toastCard,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        {/* Accent Bar */}
        <View
          style={[
            styles.accentBar,
            { backgroundColor: getIndicatorColor(currentToast.type) },
          ]}
        />

        <View style={styles.contentRow}>
          <View style={styles.iconWrapper}>{getIcon(currentToast.type)}</View>

          <Text style={styles.messageText} numberOfLines={3}>
            {currentToast.message}
          </Text>

          <TouchableOpacity
            onPress={dismissToast}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0D2847',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 16,
  },
  iconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 6,
  },
});
