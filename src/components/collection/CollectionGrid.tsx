'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { PawPrint, Star, Search } from 'lucide-react';
import DogCard from './DogCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { DogEntry } from '@/types';
import Balancer from 'react-wrap-balancer';
import { Button } from '../ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type FilterMode = 'all' | 'favorites';
type RarityFilter = 'All' | 'Common' | 'Uncommon' | 'Rare';

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
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('All');

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

  const visibleEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filter === 'favorites' && !entry.favorite) return false;

      if (rarityFilter !== 'All' && entry.rarity !== rarityFilter) return false;

      const searchValue = search.trim().toLowerCase();

      if (searchValue) {
        const breed = entry.breedName?.toLowerCase() || '';
        const name = entry.name?.toLowerCase() || '';

        if (!breed.includes(searchValue) && !name.includes(searchValue)) {
          return false;
        }
      }

      return true;
    });
  }, [entries, filter, rarityFilter, search]);

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by breed or nickname..."
          className="pl-9"
        />
      </div>

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

        {(['All', 'Common', 'Uncommon', 'Rare'] as RarityFilter[]).map((rarity) => (
          <Button
            key={rarity}
            type="button"
            variant={rarityFilter === rarity ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRarityFilter(rarity)}
          >
            {rarity}
          </Button>
        ))}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 rounded-lg bg-secondary/50">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No dogs found</h2>
          <p className="text-muted-foreground max-w-sm">
            Try changing the search text or filters.
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