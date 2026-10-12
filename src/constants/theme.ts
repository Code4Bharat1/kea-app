export const Colors = {
  primary: '#1E3A8A',       // Deep Royal Blue
  primaryDark: '#0F172A',   // Navy Dark
  primaryLight: '#3B82F6',  // Bright Blue
  accent: '#0284C7',        // Cyan Accent
  teal: '#0D9488',          // Emerald Teal
  
  background: '#F8FAFC',    // Light grayish blue background
  card: '#FFFFFF',          // Clean white surface
  cardBorder: '#E2E8F0',    // Subtle border
  
  textPrimary: '#0F172A',   // Deep slate
  textSecondary: '#475569', // Muted slate
  textMuted: '#94A3B8',     // Light slate
  
  success: '#10B981',       // Emerald Green
  successBg: '#D1FAE5',
  warning: '#F59E0B',       // Amber Gold
  warningBg: '#FEF3C7',
  danger: '#EF4444',        // Red Alert
  dangerBg: '#FEE2E2',
  info: '#3B82F6',          // Sky Blue
  infoBg: '#DBEAFE',

  border: '#E2E8F0',
  inputBg: '#F1F5F9',
  shadow: '#0F172A1A',
};

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, color: Colors.textPrimary },
  titleMedium: { fontSize: 20, fontWeight: '700' as const, color: Colors.textPrimary },
  titleSmall: { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, color: Colors.textSecondary },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  caption: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted },
};

export const Layout = {
  borderRadius: 12,
  padding: 16,
  cardRadius: 16,
};
