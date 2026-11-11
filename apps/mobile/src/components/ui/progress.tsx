import { View } from 'react-native';

import { colors, radius } from '@/theme';

export function Progress({ value, height = 10 }: { value: number; height?: number }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height, borderRadius: radius.full, backgroundColor: colors.secondary, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.primary, borderRadius: radius.full }} />
    </View>
  );
}
