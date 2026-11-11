import type { LucideIcon } from 'lucide-react-native';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { colors } from '@/theme';

/** Bottom space so content clears the tab bar (native tabs inset themselves on iOS). */
export const TAB_BAR_SPACE = 24;

export function ScreenTitle({ icon: Icon, title }: { icon?: LucideIcon; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {Icon ? <Icon size={30} color={colors.primary} /> : null}
      <Text variant="title" accessibilityRole="header" style={{ flexShrink: 1 }}>
        {title}
      </Text>
    </View>
  );
}

/** Scrollable tab screen with safe-area handling and a max content width for tablets. */
export function Screen({
  children,
  inTabs = true,
  contentContainerStyle,
  ...props
}: ScrollViewProps & { inTabs?: boolean }) {
  const insets = useSafeAreaInsets();
  const isIOS = process.env.EXPO_OS === 'ios';
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      {...props}
      contentContainerStyle={[
        {
          padding: 16,
          gap: 16,
          paddingTop: (isIOS || !inTabs ? 0 : insets.top) + 16,
          paddingBottom: (inTabs ? TAB_BAR_SPACE : 24) + (isIOS ? 0 : insets.bottom),
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        },
        contentContainerStyle,
      ]}>
      {children}
    </ScrollView>
  );
}
