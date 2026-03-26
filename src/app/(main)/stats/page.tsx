'use client';

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { getLevelFromXp } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import Balancer from "react-wrap-balancer";

function StatCard({ title, value }: { title: string, value: string | number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base text-muted-foreground font-medium">
                    <Balancer>{title}</Balancer>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}

export default function StatsPage() {
  const { userData, loading } = useAuth();

  if (loading || !userData) {
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
            </div>
        </div>
    );
  }

  const { level, progress, requiredXpForNextLevel } = getLevelFromXp(userData.xp);
  const progressPercent = (progress / requiredXpForNextLevel) * 100;

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex items-center gap-2 mb-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">My Stats</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
                <p className="text-lg font-bold">Level {level}</p>
                <p className="text-sm text-muted-foreground">{progress} / {requiredXpForNextLevel} XP</p>
            </div>
            <Progress value={progressPercent} />
            <p className="text-xs text-muted-foreground mt-2">
                {requiredXpForNextLevel - progress} XP to next level!
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Captures" value={userData.totalCaptures} />
            <StatCard title="Unique Breeds" value={userData.uniqueBreedsCount} />
        </div>
      </div>
    </div>
  );
}
