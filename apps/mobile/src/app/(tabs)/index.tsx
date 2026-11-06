import { Link } from 'expo-router';
import { PawPrint } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { DogCard } from '@/components/collection/dog-card';
import { Button } from '@/components/ui/button';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { useEntries } from '@/lib/use-entries';
import { colors, radius } from '@/theme';

export default function CollectionScreen() {
  const { t } = useT();
  const { loading: authLoading, error: authError } = useAuth();
  const { entries, loading, error } = useEntries();

  return (
    <Screen>
      <ScreenTitle icon={PawPrint} title={t.collection.title} />
      {authError || error ? <Text selectable style={{ color: colors.danger }}>{authError || error}</Text> : null}
      {authLoading || loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : entries.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 16, gap: 12, borderRadius: radius.lg, backgroundColor: 'rgba(77,58,0,0.5)' }}>
          <PawPrint size={64} color={colors.mutedForeground} />
          <Text variant="heading" style={{ textAlign: 'center' }}>{t.collection.emptyTitle}</Text>
          <Text variant="muted" style={{ textAlign: 'center', maxWidth: 360 }}>{t.collection.emptyDescription}</Text>
          <Link href="/capture" asChild>
            <Button size="lg" title={t.collection.startCapturing} style={{ marginTop: 12 }} />
          </Link>
        </View>
      ) : (
        <View testID="collection-grid" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {entries.map((entry) => (
            <View key={entry.id} style={{ width: '47%', flexGrow: 1, maxWidth: '50%' }}>
              <DogCard entry={entry} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
