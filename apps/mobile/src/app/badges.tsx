import { collection, onSnapshot } from 'firebase/firestore';
import { Award } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { achievementIcons } from '@/lib/achievement-icons';
import { useAuth } from '@/lib/auth';
import { initialAchievements, type LocalizedText } from '@/lib/data';
import { db } from '@/lib/firebase';
import { useT } from '@/lib/i18n';
import { colors } from '@/theme';
import type { AchievementDoc } from '@/types';

type Row = AchievementDoc & { title?: LocalizedText | string; description?: LocalizedText | string };

export default function BadgesScreen() {
  const { user } = useAuth();
  const { language } = useT();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'users', user.uid, 'achievements'), (snap) =>
      setRows(snap.docs.map((d) => ({ ...(d.data() as Row), id: d.id })))
    );
  }, [user]);

  const sorted = useMemo(
    () => (rows ?? []).slice().sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1)),
    [rows]
  );

  if (!rows) return <ActivityIndicator color={colors.primary} style={{ flex: 1, backgroundColor: colors.background }} />;

  const text = (v: LocalizedText | string | undefined) => (typeof v === 'string' ? v : v?.[language] ?? '');

  return (
    <Screen inTabs={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {sorted.map((a) => {
          const def = initialAchievements.find((d) => d.id === a.id);
          const Icon = def ? achievementIcons[def.icon] : Award;
          return (
            <Card
              key={a.id}
              testID={`badge-${a.id}`}
              highlight={a.unlocked}
              style={{ flexGrow: 1, flexBasis: 220, alignItems: 'center', padding: 24, opacity: a.unlocked ? 1 : 0.6, backgroundColor: a.unlocked ? 'rgba(77,58,0,0.8)' : 'rgba(77,58,0,0.3)' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: a.unlocked ? 'rgba(255,199,44,0.8)' : colors.muted }}>
                <Icon size={32} color={a.unlocked ? colors.primaryForeground : colors.mutedForeground} />
              </View>
              <Text variant="label" style={{ textAlign: 'center' }}>{text(def?.title ?? a.title)}</Text>
              <Text variant="muted" style={{ textAlign: 'center' }}>{text(def?.description ?? a.description)}</Text>
              {!a.unlocked ? (
                <View style={{ alignSelf: 'stretch', gap: 4 }}>
                  <Progress value={(a.progress / a.target) * 100} height={8} />
                  <Text variant="small" style={{ fontVariant: ['tabular-nums'] }}>{a.progress} / {a.target}</Text>
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
