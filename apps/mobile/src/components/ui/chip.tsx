import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/theme';

/** Toggle chip, replacing the shadcn Button variant="default|outline" filter buttons. */
export function Chip({ label, selected, onPress, icon: Icon, count, testID }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  count?: number;
  testID?: string;
}) {
  const fg = selected ? colors.primaryForeground : colors.foreground;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}>
      {Icon ? <Icon size={15} color={fg} /> : null}
      <Text style={{ color: fg, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 }}>{label}</Text>
      {count !== undefined ? (
        <View style={{ borderRadius: 999, paddingHorizontal: 8, backgroundColor: 'rgba(12,10,9,0.2)' }}>
          <Text style={{ color: fg, fontSize: 12, lineHeight: 18, fontVariant: ['tabular-nums'] }}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
