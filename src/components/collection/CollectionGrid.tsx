'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { PawPrint, Star } from 'lucide-react';
import DogCard from './DogCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { DogEntry } from '@/types';
import Balancer from 'react-wrap-balancer';
import { Button } from '../ui/button';
import Link from 'next/link';

type FilterMode = 'all' | 'favorites';

function CollectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function CollectionGrid() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    if (user) {
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
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching collection:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const favoriteEntries = useMemo(
    () => entries.filter((entry) => entry.favorite),
    [entries]
  );

  const visibleEntries = filter === 'favorites' ? favoriteEntries : entries;

  if (loading) {
    return <CollectionSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 rounded-lg bg-secondary/50">
        <PawPrint className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          <Balancer>Your Collection is Empty</Balancer>
        </h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          <Balancer>
            Tap the 'Capture' button below to start identifying and collecting dog breeds!
          </Balancer>
        </p>
        <Button asChild size="lg">
          <Link href="/capture">Start Capturing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
          <span className="ml-2 rounded-full bg-background/20 px-2 text-xs">
            {entries.length}
          </span>
        </Button>

        <Button
          type="button"
          variant={filter === 'favorites' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('favorites')}
        >
          <Star className="mr-2 h-4 w-4" />
          Favorites
          <span className="ml-2 rounded-full bg-background/20 px-2 text-xs">
            {favoriteEntries.length}
          </span>
        </Button>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 rounded-lg bg-secondary/50">
          <Star className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Mark dogs as favorites from the collection grid or from their detail page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleEntries.map((entry) => (
            <DogCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}