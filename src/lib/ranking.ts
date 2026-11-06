import {
  collection,
  limit,
  orderBy,
  query,
  type Firestore,
} from 'firebase/firestore';

export const RANKING_LIMIT = 50;

export const rankingFields = {
  xp: 'xp',
  captures: 'totalCaptures',
  breeds: 'uniqueBreedsCount',
} as const;

export type RankingTab = keyof typeof rankingFields;
export type RankingField = (typeof rankingFields)[RankingTab];

/**
 * Top public profiles by one metric. Uses the automatic single-field index,
 * so only RANKING_LIMIT docs are read instead of the whole collection.
 */
export function rankingQuery(
  db: Firestore,
  field: RankingField,
  max: number = RANKING_LIMIT
) {
  return query(
    collection(db, 'publicProfiles'),
    orderBy(field, 'desc'),
    limit(max)
  );
}
