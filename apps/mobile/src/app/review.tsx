import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Gem, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Switch, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RarityBadge } from '@/components/ui/rarity-badge';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { saveCapture, type SaveResult } from '@/lib/captures';
import { getRarityFromBreed } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { useCaptureStore } from '@/store/capture-store';
import { colors, fonts, radius } from '@/theme';

function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        {...props}
        style={[
          {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.foreground,
            fontFamily: fonts.regular,
            fontSize: 16,
            backgroundColor: colors.background,
          },
          props.multiline ? { minHeight: 88, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

export default function ReviewScreen() {
  const router = useRouter();
  const { t } = useT();
  const { user } = useAuth();
  const capture = useCaptureStore();

  const [breedName, setBreedName] = useState(capture.breedName ?? '');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<(SaveResult & { breed: string }) | null>(null);

  useEffect(() => {
    if (!capture.photoUri && !saved) router.replace('/capture');
  }, [capture.photoUri, saved, router]);

  if (!capture.photoUri && !saved) return null;

  const rarity = capture.rarity ?? getRarityFromBreed(breedName);

  async function onSave() {
    const breed = breedName.trim();
    if (!breed) return setError(t.review.breedRequired);
    if (!user || !capture.photoUri || capture.confidence === null) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveCapture(user.uid, {
        photoUri: capture.photoUri,
        breedName: breed,
        name: name.trim(),
        notes: notes.trim(),
        favorite,
        rarity,
        isMixed: capture.isMixed ?? false,
        confidence: capture.confidence,
        candidateBreeds: capture.candidateBreeds,
      });
      setSaved({ ...result, breed });
      capture.clear();
    } catch (e) {
      console.error('save failed', e);
      setError((e as Error)?.message || t.review.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <Screen inTabs={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Animated.View entering={ZoomIn.duration(500)}>
          <Card style={{ alignItems: 'center', padding: 32, gap: 20 }}>
            <Text variant="title" style={{ fontSize: 34, lineHeight: 44 }}>
              {saved.isNewBreed ? t.review.newBreed : t.review.captured}
            </Text>
            <Text variant="heading" selectable style={{ textAlign: 'center' }}>{saved.breed}</Text>
            <RarityBadge rarity={rarity} />
            <Text variant="muted" style={{ fontSize: 18 }}>+{saved.xpGained} XP</Text>
            <Button testID="continue" size="lg" title={t.common.continue} onPress={() => router.dismissTo('/')} style={{ alignSelf: 'stretch' }} />
          </Card>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen inTabs={false}>
      <Card>
        <Image
          source={{ uri: capture.photoUri! }}
          contentFit="cover"
          style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg }}
          accessibilityLabel="Dog"
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.muted, borderRadius: radius.lg }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Sparkles size={16} color={colors.foreground} />
            <Text>{t.review.aiConfidence}</Text>
          </View>
          <Text testID="confidence" style={{ fontFamily: fonts.bold, fontVariant: ['tabular-nums'] }}>
            {Math.round((capture.confidence ?? 0) * 100)}%
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Gem size={16} color={colors.foreground} />
            <Text>{t.review.rarity}</Text>
          </View>
          <RarityBadge rarity={rarity} />
        </View>
        <Field testID="breed-input" label={t.review.breed} value={breedName} onChangeText={setBreedName} autoCapitalize="words" />
        {capture.candidateBreeds.length > 0 ? (
          <View style={{ gap: 6 }}>
            <Text variant="small">{t.review.alternatives}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {capture.candidateBreeds.map((b) => (
                <Button key={b} size="sm" variant="outline" title={b} onPress={() => setBreedName(b)} />
              ))}
            </View>
          </View>
        ) : null}
        <Field label={t.review.nickname} placeholder={t.review.nicknamePlaceholder} value={name} onChangeText={setName} maxLength={50} />
        <Field label={t.review.notes} placeholder={t.review.notesPlaceholder} value={notes} onChangeText={setNotes} maxLength={500} multiline />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg }}>
          <Text variant="label">{t.review.favorite}</Text>
          <Switch value={favorite} onValueChange={setFavorite} trackColor={{ true: colors.primary, false: colors.secondary }} thumbColor={colors.foreground} />
        </View>
        {error ? <Text selectable style={{ color: colors.danger }}>{error}</Text> : null}
        <Button testID="save-capture" size="lg" title={t.review.save} loading={saving} onPress={onSave} />
      </Card>
    </Screen>
  );
}
