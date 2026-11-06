import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { Calendar, Heart, Percent, Tag, Trash2, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RarityBadge } from '@/components/ui/rarity-badge';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { translateBreed } from '@/lib/breed-translations';
import { deleteCapture, setFavorite } from '@/lib/captures';
import { db } from '@/lib/firebase';
import { useT } from '@/lib/i18n';
import { toDate } from '@/lib/use-entries';
import { colors, radius } from '@/theme';
import type { DogEntry } from '@/types';

function InfoTile({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, flexGrow: 1, flexBasis: 240 }}>
      <Icon size={20} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ gap: 4, flexShrink: 1 }}>
        <Text variant="muted">{label}</Text>
        {children}
      </View>
    </View>
  );
}

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language, locale } = useT();
  const [entry, setEntry] = useState<DogEntry | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    return onSnapshot(doc(db, 'users', user.uid, 'entries', id), (snap) => {
      if (!snap.exists()) {
        if (!busy) router.back();
        return;
      }
      setEntry({ ...(snap.data() as Omit<DogEntry, 'id'>), id: snap.id });
    });
  }, [user, id, router, busy]);

  if (!entry || !user) {
    return <ActivityIndicator color={colors.primary} style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const breed = translateBreed(entry.breedName, language) + (entry.isMixed ? t.mix : '');
  const captured = toDate(entry.capturedAt);

  async function onDelete() {
    // Two-step in-app confirmation instead of window.confirm/Alert, so it behaves the same on all platforms.
    if (!confirming) return setConfirming(true);
    setBusy(true);
    try {
      await deleteCapture(user!.uid, entry!.id, entry!.photoUrl);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen inTabs={false}>
      <Stack.Screen options={{ title: breed }} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Image source={{ uri: entry.photoUrl }} contentFit="cover" style={{ width: '100%', aspectRatio: 16 / 9 }} accessibilityLabel={entry.breedName} />
        <View style={{ padding: 20, gap: 20 }}>
          <View style={{ gap: 4 }}>
            <Text variant="title" selectable>{breed}</Text>
            {entry.name ? <Text variant="muted" style={{ fontSize: 18 }} selectable>{entry.name}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button
              testID="toggle-favorite"
              variant="outline"
              icon={Heart}
              title={t.entry.favorite}
              onPress={() => setFavorite(user.uid, entry.id, !entry.favorite)}
            />
            <Button
              testID="delete-entry"
              variant="destructive"
              icon={Trash2}
              loading={busy}
              title={confirming ? t.entry.confirmDelete : t.entry.delete}
              onPress={onDelete}
            />
            {confirming && !busy ? <Button variant="ghost" title={t.common.cancel} onPress={() => setConfirming(false)} /> : null}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <InfoTile icon={Calendar} label={t.entry.capturedOn}>
              <Text variant="label">{captured ? captured.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</Text>
            </InfoTile>
            <InfoTile icon={Percent} label={t.entry.aiConfidence}>
              <Text variant="label" style={{ fontVariant: ['tabular-nums'] }}>{Math.round((entry.confidence || 0) * 100)}%</Text>
            </InfoTile>
            <InfoTile icon={Tag} label={t.entry.rarity}>
              <RarityBadge rarity={entry.rarity} />
            </InfoTile>
            <InfoTile icon={Heart} label={t.entry.favorite}>
              <Text testID="favorite-value" variant="label">{entry.favorite ? t.common.yes : t.common.no}</Text>
            </InfoTile>
          </View>
          {entry.notes ? (
            <View style={{ gap: 8 }}>
              <Text variant="subheading">{t.entry.notes}</Text>
              <Text variant="muted" selectable>{entry.notes}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
