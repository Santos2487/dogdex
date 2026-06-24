'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Heart,
  PawPrint,
  Trophy,
  Gem,
  Sparkles,
  Target,
  User,
  CalendarDays,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelFromXp } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import Balancer from 'react-wrap-balancer';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { DogEntry } from '@/types';
import useLanguageStore from '@/store/language-store';

function StatCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          <Balancer>{title}</Balancer>
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RarityRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count} · {percent}%
        </span>
      </div>
      <Progress value={percent} />
    </div>
  );
}

export default function StatsPage() {
  const { user, userData, loading } = useAuth();
  const { language } = useLanguageStore();

  const [entries, setEntries] = useState<DogEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const t = {
    title: language === 'es' ? 'Mis estadísticas' : 'My Stats',
    trainer: language === 'es' ? 'Coleccionista CanisQuest' : 'CanisQuest Collector',
    memberSince: language === 'es' ? 'Miembro desde' : 'Member since',
    level: language === 'es' ? 'Nivel' : 'Level',
    explorer: language === 'es' ? 'Explorador' : 'Explorer',
    xpLeft: language === 'es' ? 'XP para llegar al nivel' : 'XP left to reach Level',
    totalXp: language === 'es' ? 'XP total' : 'total XP',
    totalCaptures: language === 'es' ? 'Capturas totales' : 'Total Captures',
    entriesSaved: language === 'es' ? 'entradas guardadas actualmente' : 'entries currently saved',
    uniqueBreeds: language === 'es' ? 'Razas únicas' : 'Unique Breeds',
    differentBreeds: language === 'es' ? 'Razas diferentes descubiertas' : 'Different breeds discovered',
    favorites: language === 'es' ? 'Favoritos' : 'Favorites',
    captures: language === 'es' ? 'capturas' : 'captures',
    mixedCaptures: language === 'es' ? 'Capturas mixtas' : 'Mixed Captures',
    topBreeds: language === 'es' ? 'Top 3 razas' : 'Top 3 Breeds',
    noDataYet: language === 'es' ? 'Aún no hay datos' : 'No data yet',
    rarityBreakdown: language === 'es' ? 'Desglose de rareza' : 'Rarity Breakdown',
    common: language === 'es' ? 'Común' : 'Common',
    uncommon: language === 'es' ? 'Poco común' : 'Uncommon',
    rare: language === 'es' ? 'Raro' : 'Rare',
    achievements: language === 'es' ? 'Logros' : 'Achievements',
    viewAchievements:
      language === 'es'
        ? 'Ver todos los logros'
        : 'View all achievements',
  };

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'entries'),
      orderBy('capturedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DogEntry[]
      );
      setEntriesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const total = entries.length;
    const favorites = entries.filter((e) => e.favorite).length;
    const mixed = entries.filter((e) => e.isMixed).length;

    const breedCounts: Record<string, number> = {};

    entries.forEach((e) => {
      breedCounts[e.breedName] = (breedCounts[e.breedName] || 0) + 1;
    });

    const topBreeds = Object.entries(breedCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const rare = entries.filter((e) => e.rarity === 'Rare').length;
    const uncommon = entries.filter((e) => e.rarity === 'Uncommon').length;
    const common = entries.filter((e) => e.rarity === 'Common').length;

    return {
      total,
      favorites,
      favoritePercent: total ? Math.round((favorites / total) * 100) : 0,
      mixed,
      mixedPercent: total ? Math.round((mixed / total) * 100) : 0,
      topBreeds,
      rare,
      uncommon,
      common,
    };
  }, [entries]);

  if (loading || entriesLoading || !userData) {
    return (
      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const { level, progress, requiredXpForNextLevel } = getLevelFromXp(userData.xp);

  const progressPercent =
    requiredXpForNextLevel > 0
      ? Math.round((progress / requiredXpForNextLevel) * 100)
      : 0;

  const xpLeft = Math.max(requiredXpForNextLevel - progress, 0);

  const createdAtDate =
    typeof userData.createdAt?.toDate === 'function'
      ? userData.createdAt.toDate()
      : null;

  const memberSince = createdAtDate
    ? createdAtDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t.title}</h1>
      </div>

      <Card className="border-primary/40">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <User className="h-8 w-8 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t.trainer}</p>
                <h2 className="text-3xl font-bold">
                  {userData.trainerName || user.displayName || user.email || 'Trainer'}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:text-right">
              <div>
                <p className="text-muted-foreground">{t.level}</p>
                <p className="text-xl font-bold">{level}</p>
              </div>

              <div>
                <p className="text-muted-foreground">{t.totalXp}</p>
                <p className="text-xl font-bold">{userData.xp}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>
              {t.memberSince}: {memberSince}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Trophy className="h-5 w-5 text-primary" />
            {t.level} {level} {t.explorer}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-4xl font-bold">{progressPercent}%</p>
              <p className="text-sm text-muted-foreground">
                {xpLeft} {t.xpLeft} {level + 1}
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {progress} / {requiredXpForNextLevel} XP
            </p>
          </div>

          <Progress value={progressPercent} />

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t.level} {level}
            </span>
            <span>
              {userData.xp} {t.totalXp}
            </span>
            <span>
              {t.level} {level + 1}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title={t.totalCaptures}
          value={stats.total}
          subtitle={`${stats.total} ${t.entriesSaved}`}
          icon={PawPrint}
        />

        <StatCard
          title={t.uniqueBreeds}
          value={userData.uniqueBreedsCount}
          subtitle={t.differentBreeds}
          icon={Sparkles}
        />

        <StatCard
          title={t.favorites}
          value={`${stats.favoritePercent}%`}
          subtitle={`${stats.favorites} of ${stats.total} ${t.captures}`}
          icon={Heart}
        />

        <StatCard
          title={t.mixedCaptures}
          value={`${stats.mixedPercent}%`}
          subtitle={`${stats.mixed} of ${stats.total} ${t.captures}`}
          icon={Sparkles}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t.topBreeds}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.topBreeds.length === 0 ? (
            <p className="text-muted-foreground">{t.noDataYet}</p>
          ) : (
            stats.topBreeds.map(([breed, count], i) => {
              const percent =
                stats.total > 0
                  ? Math.round((count / stats.total) * 100)
                  : 0;

              return (
                <div key={breed} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      #{i + 1} {breed}
                    </span>
                    <span className="text-muted-foreground">
                      {count} · {percent}%
                    </span>
                  </div>
                  <Progress value={percent} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            {t.rarityBreakdown}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <RarityRow label={t.common} count={stats.common} total={stats.total} />
          <RarityRow label={t.uncommon} count={stats.uncommon} total={stats.total} />
          <RarityRow label={t.rare} count={stats.rare} total={stats.total} />
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardContent className="p-6">
          <Link
            href="/badges"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">{t.achievements}</p>
                <p className="text-sm text-muted-foreground">
                  {t.viewAchievements}
                </p>
              </div>
            </div>

            <span className="text-primary font-bold">→</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}