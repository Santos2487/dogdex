import { useRouter } from 'expo-router';
import { PawPrint } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { identifyDog } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useCaptureStore } from '@/store/capture-store';
import { colors } from '@/theme';

export default function AnalyzingScreen() {
  const router = useRouter();
  const { t } = useT();
  const photoBase64 = useCaptureStore((s) => s.photoBase64);
  const setResult = useCaptureStore((s) => s.setResult);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.2, { duration: 750 }), withTiming(1, { duration: 750 })), -1);
  }, [pulse]);
  const pawStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    if (!photoBase64) {
      router.replace('/capture');
      return;
    }
    if (started.current) return;
    started.current = true;
    identifyDog(photoBase64)
      .then((result) => {
        setResult(result);
        router.replace('/review');
      })
      .catch((e) => {
        console.warn('AI analysis failed:', e);
        setError(t.analyzing.failedDescription);
        if (process.env.EXPO_OS !== 'web') {
          Alert.alert(t.analyzing.failedTitle, t.analyzing.failedDescription, [{ text: 'OK', onPress: () => router.back() }]);
        }
      });
  }, [photoBase64, router, setResult, t]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8, backgroundColor: colors.background }}>
      <Animated.View style={pawStyle}>
        <PawPrint size={96} color={colors.primary} />
      </Animated.View>
      <Text variant="title" style={{ marginTop: 24 }}>{error ? t.analyzing.failedTitle : t.analyzing.title}</Text>
      <Text variant="muted" selectable style={{ textAlign: 'center' }}>{error ?? t.analyzing.subtitle}</Text>
      {error ? (
        <Button title={t.common.continue} onPress={() => router.back()} style={{ marginTop: 24 }} />
      ) : (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      )}
    </View>
  );
}
