import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: Colors.successBg, text: Colors.success };
      case 'warning':
        return { bg: Colors.warningBg, text: Colors.warning };
      case 'danger':
        return { bg: Colors.dangerBg, text: Colors.danger };
      case 'info':
        return { bg: Colors.infoBg, text: Colors.info };
      case 'primary':
      default:
        return { bg: '#E0E7FF', text: Colors.primary };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
