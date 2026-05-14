'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Gem } from 'lucide-react';

import type { DogEntry } from '@/types';

import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import useLanguageStore from '@/store/language-store';

import { translateBreed } from '@/lib/breed-translations';

type Props = {
  entry: DogEntry;
};

export default function DogCard({ entry }: Props) {
  const { language } = useLanguageStore();

  const rarityLabel =
    language === 'es'
      ? entry.rarity === 'Common'
        ? 'Común'
        : entry.rarity === 'Uncommon'
        ? 'Poco común'
        : 'Raro'
      : entry.rarity;

  const translatedBreed = translateBreed(
    entry.breedName,
    language
  );

  return (
    <Link href={`/entry/${entry.id}`}>
      <Card className="group overflow-hidden transition-all hover:scale-[1.02] hover:border-primary/60">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={entry.photoUrl}
            alt={entry.breedName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          <div className="absolute left-2 top-2 flex items-center gap-2">
            <Badge
              className={cn(
                'gap-1',
                entry.rarity === 'Common' &&
                  'bg-yellow-500 text-black hover:bg-yellow-500',

                entry.rarity === 'Uncommon' &&
                  'bg-amber-800 text-white hover:bg-amber-800',

                entry.rarity === 'Rare' &&
                  'bg-purple-600 text-white hover:bg-purple-600'
              )}
            >
              <Gem className="h-3 w-3" />
              {rarityLabel}
            </Badge>
          </div>

          {entry.favorite && (
            <div className="absolute right-2 top-2">
              <div className="rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
                <Star className="h-4 w-4 fill-white text-white" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-lg font-bold">
            {translatedBreed}
            {entry.isMixed && ' (Mix)'}
          </h3>

          {entry.name && (
            <p className="mt-1 text-sm text-muted-foreground">
              {entry.name}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}