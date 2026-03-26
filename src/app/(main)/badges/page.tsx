'use client';

import { Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { initialAchievements, InitialAchievement } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Achievement as AchievementData } from "@/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Balancer from "react-wrap-balancer";
import { Skeleton } from "@/components/ui/skeleton";

type AchievementWithIcon = AchievementData & { icon: React.ElementType };

function BadgeSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-secondary/30 h-48">
                    <Skeleton className="h-16 w-16 rounded-full mb-4" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </div>
            ))}
        </div>
    );
}

export default function BadgesPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithIcon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'achievements'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAchievements = snapshot.docs.map(doc => {
            const data = doc.data() as AchievementData;
            const icon = initialAchievements.find(ach => ach.id === doc.id)?.icon || Award;
            return { ...data, id: doc.id, icon };
        });
        setAchievements(fetchedAchievements);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [user]);

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex items-center gap-2 mb-8">
        <Award className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
      </div>
      
      {loading ? <BadgeSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.sort((a,b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1)).map(ach => (
            <Card key={ach.id} className={cn(
                "flex flex-col items-center justify-start p-6 text-center transition-all duration-300",
                ach.unlocked ? 'bg-secondary/80 border-primary/50' : 'bg-secondary/30 opacity-60'
            )}>
                <div className={cn(
                    "mb-4 flex h-16 w-16 items-center justify-center rounded-full text-foreground",
                    ach.unlocked ? 'bg-primary/80 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                    <ach.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold">
                    <Balancer>{ach.title}</Balancer>
                </h3>
                <p className="text-sm text-muted-foreground flex-grow mb-4">
                    <Balancer>{ach.description}</Balancer>
                </p>
                {!ach.unlocked && (
                    <div className="w-full">
                        <Progress value={(ach.progress / ach.target) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{ach.progress} / {ach.target}</p>
                    </div>
                )}
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
