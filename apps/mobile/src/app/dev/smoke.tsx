import { Asset } from 'expo-asset';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { Text } from '@/components/ui/text';
import { identifyDog } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { saveCapture } from '@/lib/captures';
import { preparePhoto } from '@/lib/photo';
import { colors } from '@/theme';

/**
 * Development-only smoke test of the tracer pipeline on a real device/simulator, without
 * needing to tap through the photo picker: bundled image -> resize -> /api/identify ->
 * Storage + Firestore -> collection. Open with: <dev-server-url>/--/dev/smoke
 * Redirects home in production builds.
 */
export default function Smoke() {
  if (!__DEV__) return <Redirect href="/" />;
  return <SmokeRunner />;
}

function SmokeRunner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (loading || !user) return;
    const add = (line: string) => setLog((l) => [...l, line]);
    (async () => {
      try {
        add(`platform=${process.env.EXPO_OS} uid=${user.uid.slice(0, 8)} anonymous=${user.isAnonymous}`);
        const [asset] = await Asset.loadAsync(require('@/assets/images/icon.png'));
        const photo = await preparePhoto({ uri: asset.localUri ?? asset.uri, width: asset.width ?? undefined });
        add(`prepared jpeg base64=${photo.base64.length} chars`);
        const result = await identifyDog(photo.base64);
        add(`identify -> ${result.breedName} ${Math.round(result.confidence * 100)}% ${result.rarity}`);
        const saved = await saveCapture(user.uid, {
          photo,
          breedName: result.breedName,
          name: `Smoke ${process.env.EXPO_OS}`,
          favorite: false,
          rarity: result.rarity,
          isMixed: result.isMixed,
          confidence: result.confidence,
        });
        add(`saved entry ${saved.entryId} +${saved.xpGained} XP newBreed=${saved.isNewBreed}`);
        add('SMOKE PASS');
        console.log('[smoke] PASS', saved.entryId);
        setTimeout(() => router.replace('/'), 4000);
      } catch (e) {
        add(`SMOKE FAIL: ${(e as Error).message}`);
        console.error('[smoke] FAIL', e);
      }
    })();
  }, [loading, user, router]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, gap: 8 }} contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: 'Smoke test' }} />
      {log.map((line, i) => (
        <Text key={i} selectable style={{ fontFamily: undefined }}>{line}</Text>
      ))}
    </ScrollView>
  );
}
