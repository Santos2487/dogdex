import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import type { DogEntry } from '@/types';

/** Live list of the signed-in user's entries, newest first. */
export function useEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(!user);
      return;
    }
    setLoading(true);
    return onSnapshot(
      query(collection(db, 'users', user.uid, 'entries'), orderBy('capturedAt', 'desc')),
      (snap) => {
        setEntries(snap.docs.map((d) => ({ ...(d.data() as Omit<DogEntry, 'id'>), id: d.id })));
        setLoading(false);
      },
      (e) => {
        console.error('Error fetching collection:', e);
        setError(e.message);
        setLoading(false);
      }
    );
  }, [user]);

  return { entries, loading, error };
}

export function toDate(value: DogEntry['capturedAt'] | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
  return new Date(value as unknown as string);
}
