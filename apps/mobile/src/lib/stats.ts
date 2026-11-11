import type { DogEntry } from '@/types';

/** Same aggregates as the Next app's stats page. */
export function computeStats(entries: Pick<DogEntry, 'favorite' | 'isMixed' | 'breedName' | 'rarity'>[]) {
  const total = entries.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const favorites = entries.filter((e) => e.favorite).length;
  const mixed = entries.filter((e) => e.isMixed).length;
  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.breedName] = (counts[e.breedName] || 0) + 1;
  const topBreeds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    total,
    favorites,
    favoritePercent: pct(favorites),
    mixed,
    mixedPercent: pct(mixed),
    topBreeds,
    common: entries.filter((e) => e.rarity === 'Common').length,
    uncommon: entries.filter((e) => e.rarity === 'Uncommon').length,
    rare: entries.filter((e) => e.rarity === 'Rare').length,
    pct,
  };
}
