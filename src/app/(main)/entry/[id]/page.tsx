'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import {
  ArrowLeft,
  Calendar,
  Heart,
  Percent,
  Tag,
  Trash2,
} from 'lucide-react';

import {
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

import type { DogEntry } from '@/types';

import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import useLanguageStore from '@/store/language-store';

const breedTranslations: Record<string, string> = {
  'English Bulldog': 'Bulldog inglés',
  'German Shepherd': 'Pastor alemán',
  'Golden Retriever': 'Golden Retriever',
  'Labrador Retriever': 'Labrador Retriever',
  'French Bulldog': 'Bulldog francés',
  'Poodle': 'Caniche',
  'Beagle': 'Beagle',
  'Rottweiler': 'Rottweiler',
  'Chihuahua': 'Chihuahua',
  'Boxer': 'Bóxer',
  'Mixed Breed': 'Mestizo',
};

export default function EntryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguageStore();

  const [entry, setEntry] = useState<DogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    back:
      language === 'es'
        ? 'Volver a la colección'
        : 'Back to Collection',

    capturedOn:
      language === 'es'
        ? 'Capturado el'
        : 'Captured On',

    aiConfidence:
      language === 'es'
        ? 'Confianza IA'
        : 'AI Confidence',

    rarity:
      language === 'es'
        ? 'Rareza'
        : 'Rarity',

    favorite:
      language === 'es'
        ? 'Favorito'
        : 'Favorite',

    yes:
      language === 'es'
        ? 'Sí'
        : 'Yes',

    no:
      language === 'es'
        ? 'No'
        : 'No',

    delete:
      language === 'es'
        ? 'Eliminar'
        : 'Delete',

    common:
      language === 'es'
        ? 'Común'
        : 'Common',

    uncommon:
      language === 'es'
        ? 'Poco común'
        : 'Uncommon',

    rare:
      language === 'es'
        ? 'Raro'
        : 'Rare',
  };

  useEffect(() => {
    if (!user || !params.id) return;

    const ref = doc(
      db,
      'users',
      user.uid,
      'entries',
      params.id as string
    );

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) {
        router.push('/collection');
        return;
      }

      setEntry({
        id: snapshot.id,
        ...snapshot.data(),
      } as DogEntry);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, params.id, router]);

  const handleDelete = async () => {
    if (!user || !entry) return;

    const confirmed = confirm(
      language === 'es'
        ? '¿Eliminar esta captura?'
        : 'Delete this capture?'
    );

    if (!confirmed) return;

    await deleteDoc(
      doc(db, 'users', user.uid, 'entries', entry.id)
    );

    router.push('/collection');
  };

  const toggleFavorite = async () => {
    if (!user || !entry) return;

    await updateDoc(
      doc(db, 'users', user.uid, 'entries', entry.id),
      {
        favorite: !entry.favorite,
      }
    );
  };

  if (loading || !entry) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
    );
  }

  const rarityLabel =
    entry.rarity === 'Common'
      ? t.common
      : entry.rarity === 'Uncommon'
      ? t.uncommon
      : t.rare;

  const translatedBreed =
    language === 'es'
      ? breedTranslations[entry.breedName] || entry.breedName
      : entry.breedName;

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Button
        variant="ghost"
        onClick={() => router.push('/collection')}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </Button>

      <Card className="overflow-hidden">
        <div className="relative aspect-square">
          <Image
            src={entry.photoUrl}
            alt={entry.breedName}
            fill
            className="object-cover"
          />
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">
                {translatedBreed}
                {entry.isMixed && ' (Mix)'}
              </h1>

              {entry.name && (
                <p className="mt-2 text-lg text-muted-foreground">
                  {entry.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleFavorite}
              >
                <Heart
                  className={cn(
                    'mr-2 h-4 w-4',
                    entry.favorite && 'fill-current'
                  )}
                />
                {t.favorite}
              </Button>

              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.delete}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Calendar className="mt-1 h-5 w-5 text-primary" />

              <div>
                <p className="text-sm text-muted-foreground">
                  {t.capturedOn}
                </p>

                <p className="font-semibold">
                  {new Date(entry.capturedAt).toLocaleDateString(
                    language === 'es' ? 'es-ES' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Percent className="mt-1 h-5 w-5 text-primary" />

              <div>
                <p className="text-sm text-muted-foreground">
                  {t.aiConfidence}
                </p>

                <p className="font-semibold">
                  {entry.confidence}%
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Tag className="mt-1 h-5 w-5 text-primary" />

              <div>
                <p className="text-sm text-muted-foreground">
                  {t.rarity}
                </p>

                <Badge
                  className={cn(
                    'mt-1',
                    entry.rarity === 'Common' &&
                      'bg-yellow-500 text-black hover:bg-yellow-500',

                    entry.rarity === 'Uncommon' &&
                      'bg-amber-800 text-white hover:bg-amber-800',

                    entry.rarity === 'Rare' &&
                      'bg-purple-600 text-white hover:bg-purple-600'
                  )}
                >
                  {rarityLabel}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Heart className="mt-1 h-5 w-5 text-primary" />

              <div>
                <p className="text-sm text-muted-foreground">
                  {t.favorite}
                </p>

                <p className="font-semibold">
                  {entry.favorite ? t.yes : t.no}
                </p>
              </div>
            </div>
          </div>

          {entry.notes && (
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Notes
              </h3>

              <p className="text-muted-foreground">
                {entry.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}