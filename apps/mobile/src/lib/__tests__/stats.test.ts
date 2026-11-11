import { computeStats } from '@/lib/stats';

it('aggregates totals, percentages and top breeds', () => {
  const s = computeStats([
    { breedName: 'Beagle', favorite: true, isMixed: false, rarity: 'Common' },
    { breedName: 'Beagle', favorite: false, isMixed: true, rarity: 'Common' },
    { breedName: 'Akita', favorite: false, isMixed: false, rarity: 'Rare' },
  ]);
  expect(s).toMatchObject({ total: 3, favorites: 1, favoritePercent: 33, mixedPercent: 33, common: 2, rare: 1, uncommon: 0 });
  expect(s.topBreeds).toEqual([['Beagle', 2], ['Akita', 1]]);
  expect(computeStats([]).favoritePercent).toBe(0);
});
