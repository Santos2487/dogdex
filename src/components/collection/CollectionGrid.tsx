'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { PawPrint } from 'lucide-react';
import DogCard from './DogCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { DogEntry } from '@/types';
import Balancer from 'react-wrap-balancer';
import { Button } from '../ui/button';
import Link from 'next/link';

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

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'entries'), orderBy('capturedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DogEntry));
        setEntries(docs);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching collection:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [user]);

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
            <Balancer>Tap the 'Capture' button below to start identifying and collecting dog breeds!</Balancer>
          </p>
          <Button asChild size="lg">
              <Link href="/capture">Start Capturing</Link>
          </Button>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {entries.map(entry => (
            <DogCard key={entry.id} entry={entry} />
        ))}
    </div>
  );
}
