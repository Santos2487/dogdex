'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Heart,
  PawPrint,
  Trophy,
  Gem,
  Sparkles,
  Target,
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
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function RarityRow({ label, count, total }: { label: string; count: number; total: number }) {
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
  const [entries, setEntries] = useState<DogEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

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

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">My Stats</h1>
      </div>

      {/* LEVEL */}
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Trophy className="h-5 w-5 text-primary" />
            Level {level} Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-4xl font-bold">{progressPercent}%</p>
              <p className="text-sm text-muted-foreground">
                {xpLeft} XP left to reach Level {level + 1}
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {progress} / {requiredXpForNextLevel} XP
            </p>
          </div>

          <Progress value={progressPercent} />

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Level {level}</span>
            <span>{userData.xp} total XP</span>
            <span>Level {level + 1}</span>
          </div>
        </CardContent>
      </Card>

      {/* MAIN STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Captures"
          value={stats.total}
          subtitle={`${stats.total} entries currently saved`}
          icon={PawPrint}
        />

        <StatCard
          title="Unique Breeds"
          value={userData.uniqueBreedsCount}
          subtitle="Different breeds discovered"
          icon={Sparkles}
        />

        <StatCard
          title="Favorites"
          value={`${stats.favoritePercent}%`}
          subtitle={`${stats.favorites} of ${stats.total} captures`}
          icon={Heart}
        />

        <StatCard
          title="Mixed Captures"
          value={`${stats.mixedPercent}%`}
          subtitle={`${stats.mixed} of ${stats.total} captures`}
          icon={Sparkles}
        />
      </div>

      {/* TOP BREEDS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top 3 Breeds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.topBreeds.length === 0 ? (
            <p className="text-muted-foreground">No data yet</p>
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

      {/* RARITY */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            Rarity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <RarityRow label="Common" count={stats.common} total={stats.total} />
          <RarityRow label="Uncommon" count={stats.uncommon} total={stats.total} />
          <RarityRow label="Rare" count={stats.rare} total={stats.total} />
        </CardContent>
      </Card>
    </div>
  );
}