'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  Star,
  PawPrint,
  Sparkles,
  Medal,
} from 'lucide-react';

import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import useLanguageStore from '@/store/language-store';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

type PublicProfile = {
  uid: string;
  trainerName: string;
  level: number;
  xp: number;
  totalCaptures: number;
  uniqueBreedsCount: number;
};

function RankingList({
  users,
  valueKey,
}: {
  users: PublicProfile[];
  valueKey: keyof PublicProfile;
}) {
  const sorted = [...users].sort(
    (a, b) =>
      Number(b[valueKey]) - Number(a[valueKey])
  );

  return (
    <div className="space-y-3">
      {sorted.map((user, index) => (
        <Card key={user.uid}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold">
                {index === 0 ? (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                ) : (
                  `#${index + 1}`
                )}
              </div>

              <div>
                <p className="font-semibold">
                  {user.trainerName}
                </p>

                <p className="text-sm text-muted-foreground">
                  Nivel {user.level}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold">
                {user[valueKey]}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RankingPage() {
  const { language } = useLanguageStore();

  const [users, setUsers] = useState<PublicProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'publicProfiles'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as PublicProfile[];

      setUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const t = {
    title:
      language === 'es'
        ? 'Ranking CanisQuest'
        : 'CanisQuest Ranking',

    xp: language === 'es' ? 'XP' : 'XP',

    captures:
      language === 'es'
        ? 'Capturas'
        : 'Captures',

    breeds:
      language === 'es'
        ? 'Razas'
        : 'Breeds',
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />

        <h1 className="text-3xl font-bold">
          {t.title}
        </h1>
      </div>

      <Tabs defaultValue="xp">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xp">
            <Star className="mr-2 h-4 w-4" />
            {t.xp}
          </TabsTrigger>

          <TabsTrigger value="captures">
            <PawPrint className="mr-2 h-4 w-4" />
            {t.captures}
          </TabsTrigger>

          <TabsTrigger value="breeds">
            <Sparkles className="mr-2 h-4 w-4" />
            {t.breeds}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="xp" className="mt-4">
          <RankingList
            users={users}
            valueKey="xp"
          />
        </TabsContent>

        <TabsContent value="captures" className="mt-4">
          <RankingList
            users={users}
            valueKey="totalCaptures"
          />
        </TabsContent>

        <TabsContent value="breeds" className="mt-4">
          <RankingList
            users={users}
            valueKey="uniqueBreedsCount"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}