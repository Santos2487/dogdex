import { getLevelFromXp, initialAchievements, type Rarity } from '@/lib/data';
import type { AchievementDoc } from '@/types';

/**
 * Pure progression rules, extracted from the Next app's ReviewForm so they can be
 * unit tested. +1 XP per capture, +2 for a new breed, +1 for a Rare dog.
 */
export type ProgressInput = {
  user: { xp?: number; totalCaptures?: number; uniqueBreedsCount?: number };
  rarity: Rarity;
  isNewBreed: boolean;
  /** Counts of existing entries, before this capture. */
  existingUncommon: number;
  existingRare: number;
  achievements: Pick<AchievementDoc, 'id' | 'unlocked'>[];
};

export type AchievementUpdate = { id: string; progress: number; unlocked: boolean };

export type ProgressResult = {
  xpGained: number;
  xp: number;
  level: number;
  totalCaptures: number;
  uniqueBreedsCount: number;
  achievementUpdates: AchievementUpdate[];
};

export function xpForCapture(rarity: Rarity, isNewBreed: boolean): number {
  let xp = 1;
  if (isNewBreed) xp += 2;
  if (rarity === 'Rare') xp += 1;
  return xp;
}

export function computeCaptureProgress(input: ProgressInput): ProgressResult {
  const { user, rarity, isNewBreed } = input;
  const xpGained = xpForCapture(rarity, isNewBreed);
  const xp = (user.xp ?? 0) + xpGained;
  const totalCaptures = (user.totalCaptures ?? 0) + 1;
  const uniqueBreedsCount = (user.uniqueBreedsCount ?? 0) + (isNewBreed ? 1 : 0);
  const uncommon = input.existingUncommon + (rarity === 'Uncommon' ? 1 : 0);
  const rare = input.existingRare + (rarity === 'Rare' ? 1 : 0);

  const metricValue = {
    totalCaptures,
    uniqueBreedsCount,
    uncommonCaptures: uncommon,
    rareCaptures: rare,
  } as const;

  const achievementUpdates: AchievementUpdate[] = [];
  for (const def of initialAchievements) {
    const existing = input.achievements.find((a) => a.id === def.id);
    // Same as the web app: only achievements that exist and are still locked are updated.
    if (!existing || existing.unlocked) continue;
    const progress = metricValue[def.metric];
    achievementUpdates.push({ id: def.id, progress, unlocked: progress >= def.target });
  }

  return {
    xpGained,
    xp,
    level: getLevelFromXp(xp).level,
    totalCaptures,
    uniqueBreedsCount,
    achievementUpdates,
  };
}
