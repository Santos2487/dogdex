import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { initialAchievements, type InitialAchievement } from '@/lib/data';
import type { Achievement } from '@/types';

export type AchievementMetric = Achievement['metric'];
export type AchievementMetrics = Record<AchievementMetric, number>;

/**
 * State for an achievement doc being created now, from the user's history.
 * Same rule as the capture save: progress is the metric value, and the
 * achievement is unlocked once it reaches the target.
 */
export function initialAchievementState(
  definition: Pick<InitialAchievement, 'metric' | 'target'>,
  metrics: AchievementMetrics,
  now: Date = new Date()
): { progress: number; unlocked: boolean; unlockedAt: Date | null } {
  const progress = metrics[definition.metric] ?? 0;
  const unlocked = progress >= definition.target;

  return { progress, unlocked, unlockedAt: unlocked ? now : null };
}

async function loadMetrics(
  db: Firestore,
  uid: string
): Promise<AchievementMetrics> {
  const entriesRef = collection(db, 'users', uid, 'entries');

  const [profileSnap, uncommon, rare] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getCountFromServer(query(entriesRef, where('rarity', '==', 'Uncommon'))),
    getCountFromServer(query(entriesRef, where('rarity', '==', 'Rare'))),
  ]);

  const profile = profileSnap.data() ?? {};

  return {
    totalCaptures: Number(profile.totalCaptures) || 0,
    uniqueBreedsCount: Number(profile.uniqueBreedsCount) || 0,
    uncommonCaptures: uncommon.data().count,
    rareCaptures: rare.data().count,
  };
}

/**
 * Creates any achievement docs the user is missing (e.g. definitions added
 * after they signed up), seeded from their existing progress. Existing
 * achievement docs are never modified.
 */
export async function ensureUserAchievements(
  db: Firestore,
  uid: string
): Promise<string[]> {
  const achievementsRef = collection(db, 'users', uid, 'achievements');

  const snapshots = await Promise.all(
    initialAchievements.map((definition) =>
      getDoc(doc(achievementsRef, definition.id))
    )
  );

  const missing = initialAchievements.filter(
    (_, index) => !snapshots[index].exists()
  );

  if (missing.length === 0) return [];

  const metrics = await loadMetrics(db, uid);
  const batch = writeBatch(db);

  for (const definition of missing) {
    const { icon: _icon, ...data } = definition;

    batch.set(doc(achievementsRef, definition.id), {
      ...data,
      ...initialAchievementState(definition, metrics),
    });
  }

  await batch.commit();

  return missing.map((definition) => definition.id);
}
