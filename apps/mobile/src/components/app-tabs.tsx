import { NativeTabs } from 'expo-router/native-tabs';

import { useT } from '@/lib/i18n';
import { colors } from '@/theme';

/** iOS/Android: native tab bar (liquid glass on iOS 26). Web uses app-tabs.web.tsx. */
export default function AppTabs() {
  const { t } = useT();
  return (
    <NativeTabs
      tintColor={colors.primary}
      backgroundColor={colors.background}
      indicatorColor={colors.secondary}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.tabs.collection}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="pawprint.fill" md="pets" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>{t.tabs.stats}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="capture">
        <NativeTabs.Trigger.Label>{t.tabs.capture}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="camera.fill" md="photo_camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ranking">
        <NativeTabs.Trigger.Label>{t.tabs.ranking}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="emoji_events" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
