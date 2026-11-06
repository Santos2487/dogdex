import { Link } from 'expo-router';
import { PawPrint, Search, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { DogCard } from '@/components/collection/dog-card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { filterEntries, type FilterMode, type RarityFilter } from '@/lib/collection-filter';
import { useT } from '@/lib/i18n';
import { useEntries } from '@/lib/use-entries';
import { colors, fonts, radius } from '@/theme';

const RARITY_FILTERS: RarityFilter[] = ['All', 'Common', 'Uncommon', 'Rare'];

function EmptyState({ icon: Icon, title, description, children }: { icon: typeof PawPrint; title: string; description: string; children?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: 16, gap: 12, borderRadius: radius.lg, backgroundColor: 'rgba(77,58,0,0.5)' }}>
      <Icon size={56} color={colors.mutedForeground} />
      <Text variant="heading" style={{ textAlign: 'center' }}>{title}</Text>
      <Text variant="muted" style={{ textAlign: 'center', maxWidth: 360 }}>{description}</Text>
      {children}
    </View>
  );
}

export default function CollectionScreen() {
  const { t } = useT();
  const { loading: authLoading, error: authError } = useAuth();
  const { entries, loading, error } = useEntries();
  const [mode, setMode] = useState<FilterMode>('all');
  const [rarity, setRarity] = useState<RarityFilter>('All');
  const [search, setSearch] = useState('');

  const favorites = useMemo(() => entries.filter((e) => e.favorite).length, [entries]);
  const visible = useMemo(() => filterEntries(entries, { mode, rarity, search }), [entries, mode, rarity, search]);

  return (
    <Screen>
      <ScreenTitle icon={PawPrint} title={t.collection.title} />
      {authError || error ? <Text selectable style={{ color: colors.danger }}>{authError || error}</Text> : null}
      {authLoading || loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : entries.length === 0 ? (
        <EmptyState icon={PawPrint} title={t.collection.emptyTitle} description={t.collection.emptyDescription}>
          <Link href="/capture" asChild>
            <Button size="lg" title={t.collection.startCapturing} style={{ marginTop: 12 }} />
          </Link>
        </EmptyState>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 }}>
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              testID="collection-search"
              value={search}
              onChangeText={setSearch}
              placeholder={t.collection.searchPlaceholder}
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
              style={{ flex: 1, height: 42, color: colors.foreground, fontFamily: fonts.regular, fontSize: 15 }}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label={t.collection.all} count={entries.length} selected={mode === 'all'} onPress={() => setMode('all')} />
            <Chip testID="filter-favorites" icon={Star} label={t.collection.favorites} count={favorites} selected={mode === 'favorites'} onPress={() => setMode('favorites')} />
            {RARITY_FILTERS.map((r) => (
              <Chip key={r} testID={`filter-${r}`} label={t.rarity[r]} selected={rarity === r} onPress={() => setRarity(r)} />
            ))}
          </View>
          {visible.length === 0 ? (
            <EmptyState icon={Search} title={t.collection.noDogsFound} description={t.collection.tryChanging} />
          ) : (
            <View testID="collection-grid" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {visible.map((entry) => (
                <View key={entry.id} style={{ width: '47%', flexGrow: 1, maxWidth: '50%' }}>
                  <DogCard entry={entry} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
