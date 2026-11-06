import type { Rarity } from '@/lib/data';
import type { DogEntry } from '@/types';

export type FilterMode = 'all' | 'favorites';
export type RarityFilter = 'All' | Rarity;

/** Same rules as the Next app's CollectionGrid. */
export function filterEntries<T extends Pick<DogEntry, 'favorite' | 'rarity' | 'breedName' | 'name'>>(
  entries: T[],
  { mode, rarity, search }: { mode: FilterMode; rarity: RarityFilter; search: string }
) {
  const q = search.trim().toLowerCase();
  return entries.filter((e) => {
    if (mode === 'favorites' && !e.favorite) return false;
    if (rarity !== 'All' && e.rarity !== rarity) return false;
    if (q && !(e.breedName ?? '').toLowerCase().includes(q) && !(e.name ?? '').toLowerCase().includes(q)) return false;
    return true;
  });
}
