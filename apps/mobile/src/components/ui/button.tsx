import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View, type PressableProps, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/theme';

type Variant = 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  default: { bg: colors.primary, fg: colors.primaryForeground },
  secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
  outline: { bg: 'transparent', fg: colors.foreground, border: colors.border },
  destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
  ghost: { bg: 'transparent', fg: colors.foreground },
};

const sizes: Record<Size, { height: number; px: number; font: number }> = {
  sm: { height: 36, px: 12, font: 13 },
  md: { height: 44, px: 16, font: 15 },
  lg: { height: 52, px: 24, font: 16 },
};

export function Button({
  title,
  icon: Icon,
  variant = 'default',
  size = 'md',
  loading,
  disabled,
  style,
  children,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  icon?: LucideIcon;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const p = palette[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        {
          minHeight: s.height,
          paddingHorizontal: s.px,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={p.fg} />
      ) : Icon ? (
        <Icon size={s.font + 3} color={p.fg} />
      ) : null}
      {title ? (
        <Text style={{ color: p.fg, fontFamily: fonts.semibold, fontSize: s.font, lineHeight: s.font + 6 }}>
          {title}
        </Text>
      ) : null}
      {children ? <View style={{ flexDirection: 'row', alignItems: 'center' }}>{children}</View> : null}
    </Pressable>
  );
}
