'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { initialAchievements } from '@/lib/data';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import {
  Award,
  PawPrint,
  Lock,
  CheckCircle2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import useLanguageStore from '@/store/language-store';

type UserAchievement = {
  id: string;
  currentCount: number;
  unlocked: boolean;
};

function AchievementSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

export default function BadgesPage() {
  const { user } = useAuth();
  const { language } = useLanguageStore();

  const [loading, setLoading] = useState(true);

  const [userAchievements, setUserAchievements] = useState<
    UserAchievement[]
  >([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'achievements'),
      orderBy('id')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const achievements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserAchievement[];

      setUserAchievements(achievements);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const achievements = useMemo(() => {
    return initialAchievements.map((baseAchievement) => {
      const userAchievement = userAchievements.find(
        (a) => a.id === baseAchievement.id
      );

      return {
        ...baseAchievement,
        currentCount: userAchievement?.currentCount || 0,
        unlocked: userAchievement?.unlocked || false,
      };
    });
  }, [userAchievements]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        <Skeleton className="h-12 w-40" />
        <AchievementSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <Award className="h-8 w-8 text-primary" />

        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Logros' : 'Badges'}
        </h1>
      </div>

      {/* ACHIEVEMENTS */}
      <div className="grid gap-4">
        {achievements.map((achievement) => {
          const progressPercent = Math.min(
            (achievement.currentCount / achievement.requiredCount) * 100,
            100
          );

          const Icon =
            PawPrint;

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                achievement.unlocked
                  ? 'border-primary/40 shadow-primary/10'
                  : 'opacity-80'
              }`}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {typeof achievement.name === 'string'
                      ? achievement.name
                      : achievement.name[language]}
                  </CardTitle>

                  <p className="text-sm text-muted-foreground">
                    {typeof achievement.description === 'string'
                      ? achievement.description
                      : achievement.description[language]}
                  </p>
                </div>

                <div>
                  {achievement.unlocked ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {achievement.currentCount}/
                    {achievement.requiredCount}
                  </span>

                  <span className="text-muted-foreground">
                    {Math.round(progressPercent)}%
                  </span>
                </div>

                <Progress value={progressPercent} />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-4 w-4" />

                  {achievement.unlocked
                    ? language === 'es'
                      ? 'Desbloqueado'
                      : 'Unlocked'
                    : language === 'es'
                    ? 'Bloqueado'
                    : 'Locked'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}