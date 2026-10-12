// src/theme.ts
// Centralized color palette and theming for the KEA Mobile App
// Using HSL values for easy dark/light adjustments

export const COLORS = {
  primary: 'hsl(210, 80%, 55%)', // vibrant blue
  secondary: 'hsl(340, 70%, 55%)', // accent pink
  background: 'hsl(210, 30%, 10%)', // dark navy
  surface: 'hsla(210, 30%, 20%, 0.85)', // glass‑morphism surface
  textPrimary: '#ffffff',
  textSecondary: '#dddddd',
  muted: 'hsl(210, 20%, 30%)',
};

export const SHADOW = {
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
};

// Export a gradient config for reuse
export const GRADIENT = [
  'rgba(30, 58, 138, 0.9)', // dark blue
  'rgba(67, 56, 202, 0.9)', // indigo
];
