// src/components/common/StatCard.tsx
// Reusable stat card component with gradient background, icon badge, and subtle animation
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Layout } from '../../constants/theme';

type StatCardProps = {
  label: string;
  value: number | string;
  change: number | string;
  icon: React.ReactNode;
  iconBg: string; // background color for the icon badge
  width: DimensionValue;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, icon, iconBg, width }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { width, opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={Typography.bodySmall}>{label}</Text>
        <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
          {icon}
        </View>
      </View>
      <Text style={Typography.titleLarge}>{value}</Text>
      <View style={styles.growthRow}>
        <LinearGradient colors={[Colors.success, Colors.success]} style={styles.changeBadge}>
          <Text style={styles.changeText}>+{change}%</Text>
        </LinearGradient>
        <Text style={styles.growthSub}> from last month</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Layout.cardRadius,
    padding: Layout.padding,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeBadge: {
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  changeText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  growthSub: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 4,
  },
});
