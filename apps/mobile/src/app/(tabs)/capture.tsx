import { useRouter } from 'expo-router';
import { Camera, FileImage } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useT } from '@/lib/i18n';
import { PermissionDeniedError, pickPhoto, preparePhoto } from '@/lib/photo';
import { useCaptureStore } from '@/store/capture-store';
import { colors, radius } from '@/theme';

export default function CaptureScreen() {
  const router = useRouter();
  const { t } = useT();
  const setPhoto = useCaptureStore((s) => s.setPhoto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(source: 'camera' | 'library') {
    setError(null);
    try {
      const asset = await pickPhoto(source);
      if (!asset) return;
      setBusy(true);
      setPhoto(await preparePhoto(asset));
      router.push('/analyzing');
    } catch (e) {
      const message = e instanceof PermissionDeniedError ? t.capture.cameraDenied : t.capture.readError;
      console.warn('capture failed', e);
      setError(message);
      if (process.env.EXPO_OS !== 'web') Alert.alert(t.common.error, message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ alignItems: 'center' }}>
      <Camera size={48} color={colors.primary} />
      <Text variant="title" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {t.capture.title}
      </Text>
      <Text variant="muted" style={{ textAlign: 'center', fontSize: 17, lineHeight: 26, maxWidth: 420 }}>
        {t.capture.subtitle}
      </Text>
      <View
        style={{
          marginTop: 16,
          width: '100%',
          minHeight: 320,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: 'rgba(163,163,163,0.5)',
          backgroundColor: 'rgba(77,58,0,0.5)',
          padding: 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
        {busy ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="muted">{t.capture.preparing}</Text>
          </>
        ) : (
          <>
            <Button testID="take-photo" size="lg" icon={Camera} title={t.capture.takePhoto} onPress={() => start('camera')} style={{ alignSelf: 'stretch' }} />
            <Button testID="upload-photo" size="lg" variant="secondary" icon={FileImage} title={t.capture.uploadFile} onPress={() => start('library')} style={{ alignSelf: 'stretch' }} />
            <Text variant="muted" style={{ textAlign: 'center', marginTop: 8 }}>{t.capture.qualityHint}</Text>
            {error ? <Text selectable style={{ color: colors.danger }}>{error}</Text> : null}
          </>
        )}
      </View>
    </Screen>
  );
}
