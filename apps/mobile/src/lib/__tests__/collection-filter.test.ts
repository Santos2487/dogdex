import { filterEntries } from '@/lib/collection-filter';

const entries = [
  { breedName: 'Beagle', name: 'Rex', favorite: true, rarity: 'Common' as const },
  { breedName: 'Akita', name: '', favorite: false, rarity: 'Rare' as const },
  { breedName: 'Boxer', name: 'Bea', favorite: false, rarity: 'Uncommon' as const },
];

it('filters by favourites, rarity and search on breed or nickname', () => {
  expect(filterEntries(entries, { mode: 'favorites', rarity: 'All', search: '' }).map((e) => e.breedName)).toEqual(['Beagle']);
  expect(filterEntries(entries, { mode: 'all', rarity: 'Rare', search: '' }).map((e) => e.breedName)).toEqual(['Akita']);
  expect(filterEntries(entries, { mode: 'all', rarity: 'All', search: ' BEA ' }).map((e) => e.breedName)).toEqual(['Beagle', 'Boxer']);
  expect(filterEntries(entries, { mode: 'favorites', rarity: 'Rare', search: '' })).toEqual([]);
});
