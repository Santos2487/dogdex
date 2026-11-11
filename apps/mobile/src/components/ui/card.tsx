import { View, type ViewProps } from 'react-native';

import { colors, radius } from '@/theme';

export function Card({ style, highlight, ...props }: ViewProps & { highlight?: boolean }) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.card,
          borderColor: highlight ? 'rgba(255,199,44,0.4)' : colors.border,
          borderWidth: 1,
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          padding: 16,
          gap: 12,
        },
        style,
      ]}
    />
  );
}
