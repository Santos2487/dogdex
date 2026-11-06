/**
 * Design tokens ported from the Next app's `globals.css` (`.dark` palette,
 * which the web app forces on <html>) and `docs/blueprint.md`.
 */
export const colors = {
  background: '#0C0A09',
  foreground: '#FAFAFA',
  card: '#151210',
  border: '#4D3A00',
  primary: '#FFC72C',
  primaryForeground: '#664D00',
  secondary: '#4D3A00',
  secondaryForeground: '#FAFAFA',
  muted: '#2A2100',
  mutedForeground: '#A3A3A3',
  accent: '#FF934F',
  accentForeground: '#FFFFFF',
  destructive: '#7F1D1D',
  destructiveForeground: '#FAFAFA',
  danger: '#EF4444',
  // Light palette from the blueprint (unused: the web app ships dark only).
  lightBackground: '#FAF8E7',
} as const;

export const rarityColors = {
  Common: { bg: '#EAB308', fg: '#000000' },
  Uncommon: { bg: '#92400E', fg: '#FFFFFF' },
  Rare: { bg: '#9333EA', fg: '#FFFFFF' },
} as const;

export const fonts = {
  regular: 'Poppins_400Regular',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const radius = { sm: 4, md: 6, lg: 8, xl: 12, full: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
