import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.border;
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.accent;
      case 'outline': return 'transparent';
      case 'danger': return Colors.danger;
      default: return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    if (variant === 'outline') return Colors.primary;
    return '#FFFFFF';
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'large': return { paddingVertical: 16, paddingHorizontal: 24 };
      case 'medium':
      default: return { paddingVertical: 12, paddingHorizontal: 18 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 13;
      case 'large': return 17;
      case 'medium':
      default: return 15;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderWidth: 1.5, borderColor: disabled ? Colors.border : Colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : '#FFFFFF'} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
