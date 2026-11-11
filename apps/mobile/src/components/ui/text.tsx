import { Text as RNText, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'muted' | 'small' | 'label';

const variants: Record<Variant, object> = {
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.foreground },
  heading: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 30, color: colors.foreground },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.foreground },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.foreground },
  muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
  small: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.mutedForeground },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.foreground },
};

export function Text({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText {...props} style={[variants[variant], style]} />;
}
