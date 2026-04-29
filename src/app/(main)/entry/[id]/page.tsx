'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { deleteCapture, toggleFavorite } from '@/app/actions';

import type { DogEntry } from '@/types';

import Image from 'next/image';
import {
  Calendar,
  ChevronLeft,
  Heart,
  Loader2,
  Percent,
  Tag,
  FileText,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Balancer from 'react-wrap-balancer';

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="text-base font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default function EntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { user } = useAuth();

  const [entry, setEntry] = useState<DogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

  useEffect(() => {
    if (user && id) {
      const getEntry = async () => {
        const entryRef = doc(db, 'users', user.uid, 'entries', id as string);
        const docSnap = await getDoc(entryRef);

        if (docSnap.exists()) {
          setEntry({
            id: docSnap.id,
            ...docSnap.data(),
          } as DogEntry);
        } else {
          router.replace('/collection');
        }

        setLoading(false);
      };

      getEntry();
    }
  }, [user, id, router]);

  async function handleDelete() {
    if (!user || !entry?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this capture?'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    const result = await deleteCapture(user.uid, entry.id);

    if (result.success) {
      router.push('/collection');
    } else {
      alert(result.error || 'Failed to delete capture.');
      setIsDeleting(false);
    }
  }

  async function handleToggleFavorite() {
    if (!user || !entry?.id || isUpdatingFavorite) return;

    const nextFavorite = !entry.favorite;

    setEntry({
      ...entry,
      favorite: nextFavorite,
    });

    setIsUpdatingFavorite(true);

    const result = await toggleFavorite(user.uid, entry.id, nextFavorite);

    if (!result.success) {
      setEntry({
        ...entry,
        favorite: !nextFavorite,
      });

      alert(result.error || 'Failed to update favorite.');
    }

    setIsUpdatingFavorite(false);
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Collection
      </Button>

      <Card className="overflow-hidden">
        <div className="relative aspect-video w-full">
          <Image
            src={entry.photoUrl}
            alt={entry.name || entry.breedName}
            fill
            className="object-cover"
            priority
          />
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">
                <Balancer>{entry.name || entry.breedName}</Balancer>
              </CardTitle>

              {entry.name && (
                <p className="text-lg text-muted-foreground -mt-1">
                  {entry.breedName}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={entry.favorite ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isUpdatingFavorite}
              >
                {isUpdatingFavorite ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Heart
                      className={`mr-2 h-4 w-4 ${
                        entry.favorite ? 'fill-current' : ''
                      }`}
                    />
                    {entry.favorite ? 'Favorited' : 'Favorite'}
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailItem
              icon={Calendar}
              label="Captured On"
              value={format(entry.capturedAt.toDate(), 'PPP')}
            />

            <DetailItem
              icon={Percent}
              label="AI Confidence"
              value={`${(entry.confidence * 100).toFixed(0)}%`}
            />

            <DetailItem
              icon={Tag}
              label="Rarity"
              value={
                <Badge
                  variant={
                    entry.rarity === 'Rare'
                      ? 'destructive'
                      : entry.rarity === 'Uncommon'
                        ? 'secondary'
                        : 'default'
                  }
                >
                  {entry.rarity}
                </Badge>
              }
            />

            <DetailItem
              icon={Heart}
              label="Favorite"
              value={entry.favorite ? 'Yes' : 'No'}
            />
          </div>

          {entry.notes && (
            <DetailItem
              icon={FileText}
              label="Notes"
              value={<p className="whitespace-pre-wrap">{entry.notes}</p>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}