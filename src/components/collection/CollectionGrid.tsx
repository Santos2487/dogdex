'use client';

import { useMemo, useState } from 'react';
import type { DogEntry } from '@/types';
import CollectionCard from './CollectionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  entries: DogEntry[];
};

export default function CollectionGrid({ entries }: Props) {
  const [showFavorites, setShowFavorites] = useState(false);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<
    'All' | 'Common' | 'Uncommon' | 'Rare'
  >('All');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // ⭐ Favoritos
      if (showFavorites && !entry.favorite) return false;

      // 🔍 Búsqueda
      const searchLower = search.toLowerCase();
      const matchesSearch =
        entry.breedName.toLowerCase().includes(searchLower) ||
        (entry.name || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // ⭐ Rareza
      if (rarityFilter !== 'All' && entry.rarity !== rarityFilter) {
        return false;
      }

      return true;
    });
  }, [entries, showFavorites, search, rarityFilter]);

  return (
    <div className="space-y-6">
      {/* 🔍 BÚSQUEDA */}
      <Input
        placeholder="Search breed or nickname..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 🎛 FILTROS */}
      <div className="flex flex-wrap gap-2">
        {/* Favoritos */}
        <Button
          variant={showFavorites ? 'default' : 'outline'}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          ⭐ Favorites
        </Button>

        {/* Rareza */}
        {['All', 'Common', 'Uncommon', 'Rare'].map((r) => (
          <Button
            key={r}
            variant={rarityFilter === r ? 'default' : 'outline'}
            onClick={() =>
              setRarityFilter(r as 'All' | 'Common' | 'Uncommon' | 'Rare')
            }
          >
            {r}
          </Button>
        ))}
      </div>

      {/* 🐶 GRID */}
      {filteredEntries.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          No dogs found 🐾
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <CollectionCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}