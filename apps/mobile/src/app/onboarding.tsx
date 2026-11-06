import { useRouter } from 'expo-router';
import { Award, Camera, PawPrint, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useT } from '@/lib/i18n';
import { useOnboarding } from '@/lib/onboarding';
import { colors } from '@/theme';

const ICONS: LucideIcon[] = [PawPrint, Camera, Award];

/** Three-step pager replacing the Embla carousel of the web app. */
export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 480);
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollViewInstance>(null);
  const complete = useOnboarding((s) => s.complete);
  const steps = t.onboarding.steps;
  const last = page === steps.length - 1;

  async function finish() {
    await complete();
    router.replace('/');
  }

  function next() {
    if (last) return finish();
    scroller.current?.scrollTo({ x: (page + 1) * pageWidth, animated: true });
    setPage(page + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, alignItems: 'center', gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <PawPrint size={32} color={colors.primary} />
        <Text variant="title">CanisQuest</Text>
      </View>
      <View style={{ width: pageWidth, flex: 1, maxHeight: 520 }}>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}>
          {steps.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <View key={step.title} style={{ width: pageWidth, padding: 16 }}>
                <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, borderColor: 'rgba(255,199,44,0.2)', borderWidth: 2 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,199,44,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={32} color={colors.primary} />
                  </View>
                  <Text variant="heading" style={{ textAlign: 'center' }}>{step.title}</Text>
                  <Text variant="muted" style={{ textAlign: 'center', fontSize: 16, lineHeight: 24 }}>{step.description}</Text>
                </Card>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {steps.map((s, i) => (
          <View key={s.title} style={{ width: i === page ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? colors.primary : colors.secondary }} />
        ))}
      </View>
      <View style={{ width: pageWidth, paddingHorizontal: 16, gap: 8 }}>
        <Button testID="onboarding-next" size="lg" title={last ? t.onboarding.start : t.onboarding.next} onPress={next} />
        {!last ? <Button testID="onboarding-skip" variant="ghost" title={t.onboarding.start} onPress={finish} /> : null}
      </View>
    </View>
  );
}
