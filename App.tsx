// src/App.tsx
// Enhanced UI for KEA Mobile App using theme, gradient background, and glass‑morphism
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOW, GRADIENT } from './src/theme';

export default function App() {
  // Simple fade‑in animation for the content
  const fadeAnim = new Animated.Value(0);
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1200,
    useNativeDriver: true,
  }).start();

  return (
    <LinearGradient
      colors={GRADIENT}
      style={styles.gradient}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to KEA Mobile App</Text>
          <Text style={styles.subtitle}>Your engineering community hub</Text>
        </View>
        <Text style={styles.footer}>Built with ❤️ for engineers</Text>
        <StatusBar style="light" />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    ...SHADOW,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: 32,
    fontSize: 12,
    color: COLORS.muted,
  },
});
