import { collection, onSnapshot } from 'firebase/firestore';
import { PawPrint, Sparkles, Star, Trophy } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme';
import type { PublicProfile } from '@/types';

type SortKey = 'xp' | 'totalCaptures' | 'uniqueBreedsCount';

export default function RankingScreen() {
  const { t } = useT();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('xp');

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      collection(db, 'publicProfiles'),
      (snap) => setProfiles(snap.docs.map((d) => ({ ...(d.data() as PublicProfile), uid: d.id }))),
      (e) => console.warn('ranking', e)
    );
  }, [user]);

  const sorted = useMemo(() => [...profiles].sort((a, b) => Number(b[sortKey] ?? 0) - Number(a[sortKey] ?? 0)), [profiles, sortKey]);

  return (
    <Screen>
      <ScreenTitle icon={Trophy} title={t.ranking.title} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip icon={Star} label={t.ranking.xp} selected={sortKey === 'xp'} onPress={() => setSortKey('xp')} />
        <Chip testID="rank-captures" icon={PawPrint} label={t.ranking.captures} selected={sortKey === 'totalCaptures'} onPress={() => setSortKey('totalCaptures')} />
        <Chip icon={Sparkles} label={t.ranking.breeds} selected={sortKey === 'uniqueBreedsCount'} onPress={() => setSortKey('uniqueBreedsCount')} />
      </View>
      {sorted.length === 0 ? <Text variant="muted">{t.ranking.empty}</Text> : null}
      {sorted.map((p, i) => (
        <Card key={p.uid} testID={`rank-row-${p.trainerName}`} highlight={p.uid === user?.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,199,44,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              {i === 0 ? <Trophy size={20} color="#EAB308" /> : <Text variant="label">#{i + 1}</Text>}
            </View>
            <View>
              <Text variant="label">{p.trainerName}</Text>
              <Text variant="muted">{t.ranking.level} {p.level}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.foreground, fontVariant: ['tabular-nums'] }}>{p[sortKey] ?? 0}</Text>
        </Card>
      ))}
    </Screen>
  );
}
