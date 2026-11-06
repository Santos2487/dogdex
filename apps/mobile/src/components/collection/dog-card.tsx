import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RarityBadge } from '@/components/ui/rarity-badge';
import { Text } from '@/components/ui/text';
import { translateBreed } from '@/lib/breed-translations';
import { useT } from '@/lib/i18n';
import { colors, radius } from '@/theme';
import type { DogEntry } from '@/types';

export function DogCard({ entry }: { entry: DogEntry }) {
  const { t, language } = useT();
  return (
    <Link href={{ pathname: '/entry/[id]', params: { id: entry.id } }} asChild>
      <Pressable
        testID={`dog-card-${entry.id}`}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: pressed ? 'rgba(255,199,44,0.6)' : colors.border,
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}>
        <View style={{ aspectRatio: 1 }}>
          <Image source={{ uri: entry.photoUrl }} contentFit="cover" transition={200} style={{ flex: 1 }} accessibilityLabel={entry.breedName} />
          <View style={{ position: 'absolute', left: 8, top: 8 }}>
            <RarityBadge rarity={entry.rarity} size="sm" />
          </View>
          {entry.favorite ? (
            <View style={{ position: 'absolute', right: 8, top: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6 }}>
              <Star size={16} color="#fff" fill="#fff" />
            </View>
          ) : null}
        </View>
        <View style={{ padding: 12, gap: 2 }}>
          <Text variant="subheading" numberOfLines={2}>
            {translateBreed(entry.breedName, language)}
            {entry.isMixed ? t.mix : ''}
          </Text>
          {entry.name ? <Text variant="muted" numberOfLines={1}>{entry.name}</Text> : null}
        </View>
      </Pressable>
    </Link>
  );
}
