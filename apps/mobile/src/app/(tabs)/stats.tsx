import { Link } from 'expo-router';
import { Award, BarChart3, CalendarDays, Gem, Heart, PawPrint, Sparkles, Target, Trophy, User, type LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { translateBreed } from '@/lib/breed-translations';
import { getLevelFromXp } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { computeStats } from '@/lib/stats';
import { toDate, useEntries } from '@/lib/use-entries';
import { colors, fonts } from '@/theme';

function StatCard({ title, value, subtitle, icon: Icon, testID }: { title: string; value: string | number; subtitle?: string; icon: LucideIcon; testID?: string }) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: 150, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="muted" style={{ flexShrink: 1 }}>{title}</Text>
        <Icon size={20} color={colors.primary} />
      </View>
      <Text testID={testID} style={{ fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, fontVariant: ['tabular-nums'] }}>{value}</Text>
      {subtitle ? <Text variant="small">{subtitle}</Text> : null}
    </Card>
  );
}

function BarRow({ label, count, percent }: { label: string; count: number; percent: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label">{label}</Text>
        <Text variant="muted" style={{ fontVariant: ['tabular-nums'] }}>{count} · {percent}%</Text>
      </View>
      <Progress value={percent} />
    </View>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon size={20} color={colors.primary} />
      <Text variant="subheading">{title}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { t, language, locale } = useT();
  const { user, userData, loading } = useAuth();
  const { entries, loading: entriesLoading } = useEntries();
  const stats = useMemo(() => computeStats(entries), [entries]);

  if (loading || entriesLoading || !userData || !user) {
    return (
      <Screen>
        <ScreenTitle icon={BarChart3} title={t.stats.title} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </Screen>
    );
  }

  const xp = userData.xp ?? 0;
  const { level, progress, requiredXpForNextLevel } = getLevelFromXp(xp);
  const progressPercent = requiredXpForNextLevel > 0 ? Math.round((progress / requiredXpForNextLevel) * 100) : 0;
  const created = toDate(userData.createdAt);
  const memberSince = created ? created.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : '-';

  return (
    <Screen>
      <ScreenTitle icon={BarChart3} title={t.stats.title} />
      <Card highlight style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,199,44,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} color={colors.primary} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text variant="muted">{t.stats.trainer}</Text>
            <Text variant="heading" selectable numberOfLines={1}>{userData.trainerName || user.displayName || user.email || 'Trainer'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View>
            <Text variant="muted">{t.stats.level}</Text>
            <Text testID="stats-level" variant="heading" style={{ fontVariant: ['tabular-nums'] }}>{level}</Text>
          </View>
          <View>
            <Text variant="muted">{t.stats.totalXp}</Text>
            <Text testID="stats-xp" variant="heading" style={{ fontVariant: ['tabular-nums'] }}>{xp}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={16} color={colors.primary} />
          <Text variant="muted">{t.stats.memberSince}: {memberSince}</Text>
        </View>
      </Card>

      <Card highlight style={{ padding: 20 }}>
        <SectionTitle icon={Trophy} title={`${t.stats.level} ${level} ${t.stats.explorer}`} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 34, lineHeight: 42 }}>{progressPercent}%</Text>
            <Text variant="muted">{Math.max(requiredXpForNextLevel - progress, 0)} {t.stats.xpLeft} {level + 1}</Text>
          </View>
          <Text variant="muted" style={{ fontVariant: ['tabular-nums'] }}>{progress} / {requiredXpForNextLevel} XP</Text>
        </View>
        <Progress value={progressPercent} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="small">{t.stats.level} {level}</Text>
          <Text variant="small">{xp} {t.stats.totalXp}</Text>
          <Text variant="small">{t.stats.level} {level + 1}</Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <StatCard testID="stats-total" title={t.stats.totalCaptures} value={stats.total} subtitle={`${stats.total} ${t.stats.entriesSaved}`} icon={PawPrint} />
        <StatCard title={t.stats.uniqueBreeds} value={userData.uniqueBreedsCount ?? 0} subtitle={t.stats.differentBreeds} icon={Sparkles} />
        <StatCard title={t.stats.favorites} value={`${stats.favoritePercent}%`} subtitle={`${stats.favorites} ${t.stats.of} ${stats.total} ${t.stats.captures}`} icon={Heart} />
        <StatCard title={t.stats.mixedCaptures} value={`${stats.mixedPercent}%`} subtitle={`${stats.mixed} ${t.stats.of} ${stats.total} ${t.stats.captures}`} icon={Sparkles} />
      </View>

      <Card>
        <SectionTitle icon={Target} title={t.stats.topBreeds} />
        {stats.topBreeds.length === 0 ? (
          <Text variant="muted">{t.stats.noDataYet}</Text>
        ) : (
          stats.topBreeds.map(([breed, count], i) => (
            <BarRow key={breed} label={`#${i + 1} ${translateBreed(breed, language)}`} count={count} percent={stats.pct(count)} />
          ))
        )}
      </Card>

      <Card>
        <SectionTitle icon={Gem} title={t.stats.rarityBreakdown} />
        <BarRow label={t.rarity.Common} count={stats.common} percent={stats.pct(stats.common)} />
        <BarRow label={t.rarity.Uncommon} count={stats.uncommon} percent={stats.pct(stats.uncommon)} />
        <BarRow label={t.rarity.Rare} count={stats.rare} percent={stats.pct(stats.rare)} />
      </Card>

      <Link href="/badges" asChild>
        <Pressable testID="view-achievements">
          <Card highlight style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Award size={24} color={colors.primary} />
              <View>
                <Text variant="label">{t.stats.achievements}</Text>
                <Text variant="muted">{t.stats.viewAchievements}</Text>
              </View>
            </View>
            <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>→</Text>
          </Card>
        </Pressable>
      </Link>
    </Screen>
  );
}
