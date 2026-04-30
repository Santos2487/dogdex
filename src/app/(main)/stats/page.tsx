'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Heart, PawPrint, Star, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelFromXp } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import Balancer from 'react-wrap-balancer';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { DogEntry } from '@/types';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">
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

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DogEntry[];

        setEntries(docs);
        setEntriesLoading(false);
      },
      (error) => {
        console.error('Error fetching stats entries:', error);
        setEntriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const derivedStats = useMemo(() => {
    const total = entries.length;
    const favorites = entries.filter((entry) => entry.favorite).length;
    const favoritePercent = total > 0 ? Math.round((favorites / total) * 100) : 0;

    const breedCounts = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.breedName] = (acc[entry.breedName] || 0) + 1;
      return acc;
    }, {});

    const mostCapturedBreedEntry = Object.entries(breedCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const mostCapturedBreed = mostCapturedBreedEntry
      ? `${mostCapturedBreedEntry[0]} (${mostCapturedBreedEntry[1]})`
      : 'None yet';

    return {
      total,
      favorites,
      favoritePercent,
      mostCapturedBreed,
    };
  }, [entries]);

  if (loading || !userData || entriesLoading) {
    return (
      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">My Stats</h1>
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const { level, progress, requiredXpForNextLevel } = getLevelFromXp(userData.xp);
  const progressPercent =
    requiredXpForNextLevel > 0 ? (progress / requiredXpForNextLevel) * 100 : 0;
  const xpLeft = Math.max(requiredXpForNextLevel - progress, 0);

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex items-center gap-2 mb-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">My Stats</h1>
      </div>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-3xl font-bold">Level {level}</p>
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
              <span>Current level</span>
              <span>{Math.round(progressPercent)}%</span>
              <span>Next level</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Total Captures"
            value={userData.totalCaptures}
            subtitle={`${derivedStats.total} entries currently saved`}
            icon={PawPrint}
          />

          <StatCard
            title="Unique Breeds"
            value={userData.uniqueBreedsCount}
            subtitle="Different breeds discovered"
            icon={Star}
          />

          <StatCard
            title="Favorites"
            value={`${derivedStats.favoritePercent}%`}
            subtitle={`${derivedStats.favorites} of ${derivedStats.total} captures`}
            icon={Heart}
          />

          <StatCard
            title="Most Captured Breed"
            value={derivedStats.mostCapturedBreed}
            subtitle="Based on your current collection"
            icon={BarChart3}
          />
        </div>
      </div>
    </div>
  );
}