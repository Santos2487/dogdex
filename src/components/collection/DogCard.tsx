'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, Gem } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DogEntry } from '@/types';
import Balancer from 'react-wrap-balancer';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toggleFavorite } from '@/app/actions';

type DogCardProps = {
  entry: DogEntry;
};

function getRarityBadgeVariant(rarity: string) {
  if (rarity === 'Rare') return 'destructive';
  if (rarity === 'Uncommon') return 'secondary';
  return 'default';
}

export default function DogCard({ entry }: DogCardProps) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(entry.favorite);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user || isUpdating) return;

    const nextFavorite = !favorite;

    setFavorite(nextFavorite);
    setIsUpdating(true);

    const result = await toggleFavorite(user.uid, entry.id, nextFavorite);

    if (!result.success) {
      setFavorite(!nextFavorite);
      alert(result.error || 'Failed to update favorite.');
    }

    setIsUpdating(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
    >
      <Link href={`/entry/${entry.id}`} passHref>
        <Card className="overflow-hidden transition-shadow hover:shadow-lg">
          <CardContent className="p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={entry.photoUrl}
                alt={entry.name || entry.breedName}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />

              <div className="absolute left-2 top-2">
                <Badge
                  variant={getRarityBadgeVariant(entry.rarity)}
                  className="flex items-center gap-1 shadow-md backdrop-blur-sm"
                >
                  <Gem className="h-3 w-3" />
                  {entry.rarity}
                </Badge>
              </div>

              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isUpdating}
                aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition ${
                  favorite
                    ? 'bg-primary/90 text-primary-foreground'
                    : 'bg-background/70 text-foreground hover:bg-primary/80 hover:text-primary-foreground'
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
                )}
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-bold truncate text-lg">
                <Balancer>{entry.name || entry.breedName}</Balancer>
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {entry.name ? entry.breedName : ' '}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}