import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { BarChart2, Camera, Home, Settings, Trophy, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

/** Web: replica of the Next app's BottomNav (fixed bar, raised centre capture button). */
// TabTriggerSlotProps types `ref` as a component type (expo-router typing quirk); refs aren't needed here.
type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { icon: LucideIcon; label: string; center?: boolean };

function TabButton({ icon: Icon, label, center, isFocused, ...props }: TabButtonProps) {
  if (center) {
    return (
      <Pressable {...props} aria-label={label} style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
          <Icon size={24} color={colors.primaryForeground} />
        </View>
      </Pressable>
    );
  }
  const color = isFocused ? colors.primary : colors.mutedForeground;
  return (
    <Pressable {...props} style={{ minWidth: 56, height: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 4 }}>
      <Icon size={20} color={color} />
      <Text style={{ color, fontFamily: fonts.regular, fontSize: 12, lineHeight: 14 }}>{label}</Text>
    </Pressable>
  );
}

export default function AppTabs() {
  const { t } = useT();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          backgroundColor: 'rgba(12,10,9,0.92)',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' as unknown as number,
          backdropFilter: 'blur(8px)',
        } as object}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', maxWidth: 512, alignSelf: 'center' }}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={Home} label={t.tabs.collection} />
          </TabTrigger>
          <TabTrigger name="stats" href="/stats" asChild>
            <TabButton icon={BarChart2} label={t.tabs.stats} />
          </TabTrigger>
          <TabTrigger name="capture" href="/capture" asChild>
            <TabButton icon={Camera} label={t.tabs.capture} center />
          </TabTrigger>
          <TabTrigger name="ranking" href="/ranking" asChild>
            <TabButton icon={Trophy} label={t.tabs.ranking} />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon={Settings} label={t.tabs.settings} />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}
