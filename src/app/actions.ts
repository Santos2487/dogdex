'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  runTransaction,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { initialAchievements, getLevelFromXp } from '@/lib/data';
import type { UserProfile, Achievement as AchievementData } from '@/types';
import type { z } from 'zod';
import type { reviewSchema } from '@/components/review/ReviewForm';

type ReviewFormData = z.infer<typeof reviewSchema>;

export async function saveCapture(
  userId: string,
  data: ReviewFormData,
  photoUrl: string,
  confidence: number
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  if (!photoUrl) {
    return { success: false, error: 'No photo URL provided.' };
  }

  const entryId = uuidv4();

  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found.');
      }

      const userData = userDoc.data() as UserProfile;

      const entriesRef = collection(db, 'users', userId, 'entries');
      const q = query(entriesRef, where('breedName', '==', data.breedName));
      const existingBreedDocs = await getDocs(q);
      const isNewBreed = existingBreedDocs.empty;

      let newXp = userData.xp + 1;
      if (isNewBreed) newXp += 2;
      if (data.rarity === 'Rare') newXp += 1;

      const newTotalCaptures = userData.totalCaptures + 1;
      const newUniqueBreedsCount = isNewBreed
        ? userData.uniqueBreedsCount + 1
        : userData.uniqueBreedsCount;

      const newLevel = getLevelFromXp(newXp).level;

      transaction.set(doc(db, 'users', userId, 'entries', entryId), {
        photoUrl,
        ...data,
        confidence,
        capturedAt: new Date(),
        userId,
        aiProvider: 'gemini',
      });

      const achievementsRef = collection(db, 'users', userId, 'achievements');
      const achievementsSnapshot = await getDocs(query(achievementsRef));
      const achievements = achievementsSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as (AchievementData & { id: string })[];

      const rareCapturesSnapshot = await getDocs(
        query(entriesRef, where('rarity', 'in', ['Uncommon', 'Rare']))
      );

      const newRareCapturesCount =
        rareCapturesSnapshot.size + (data.rarity !== 'Common' ? 1 : 0);

      for (const achDef of initialAchievements) {
        const achievement = achievements.find((a) => a.id === achDef.id);

        if (achievement && !achievement.unlocked) {
          let currentProgress = 0;

          if (achDef.metric === 'totalCaptures') {
            currentProgress = newTotalCaptures;
          }

          if (achDef.metric === 'uniqueBreedsCount') {
            currentProgress = newUniqueBreedsCount;
          }

          if (achDef.metric === 'rareCaptures') {
            currentProgress = newRareCapturesCount;
          }

          const achRef = doc(db, 'users', userId, 'achievements', achDef.id);

          if (currentProgress >= achDef.target) {
            transaction.update(achRef, {
              progress: currentProgress,
              unlocked: true,
              unlockedAt: new Date(),
            });
          } else {
            transaction.update(achRef, {
              progress: currentProgress,
            });
          }
        }
      }

      transaction.update(userRef, {
        xp: newXp,
        level: newLevel,
        totalCaptures: newTotalCaptures,
        uniqueBreedsCount: newUniqueBreedsCount,
      });
    });

    revalidatePath('/collection');
    revalidatePath('/stats');
    revalidatePath('/badges');

    return { success: true };
  } catch (e: any) {
    console.error('Failed to save capture:', e);

    return {
      success: false,
      error: e.message || 'An unknown error occurred.',
    };
  }
}

export async function deleteCapture(
  userId: string,
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  if (!entryId) {
    return { success: false, error: 'Entry not found.' };
  }

  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found.');
      }

      const userData = userDoc.data() as UserProfile;

      transaction.delete(entryRef);

      transaction.update(userRef, {
        totalCaptures: Math.max((userData.totalCaptures || 1) - 1, 0),
      });
    });

    revalidatePath('/collection');
    revalidatePath('/stats');

    return { success: true };
  } catch (e: any) {
    console.error('Delete failed:', e);

    return {
      success: false,
      error: e.message || 'Failed to delete capture.',
    };
  }
}

export async function toggleFavorite(
  userId: string,
  entryId: string,
  favorite: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  if (!entryId) {
    return { success: false, error: 'Entry not found.' };
  }

  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);

    await runTransaction(db, async (transaction) => {
      transaction.update(entryRef, {
        favorite,
      });
    });

    revalidatePath('/collection');
    revalidatePath(`/entry/${entryId}`);

    return { success: true };
  } catch (e: any) {
    console.error('Favorite update failed:', e);

    return {
      success: false,
      error: e.message || 'Failed to update favorite.',
    };
  }
}