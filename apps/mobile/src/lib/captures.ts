import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import type { Rarity } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { photoBlob } from '@/lib/photo-blob';
import { computeCaptureProgress } from '@/lib/progression';
import type { AchievementDoc } from '@/types';

export type CaptureInput = {
  /** Output of preparePhoto: local JPEG uri plus the same bytes as base64. */
  photo: { uri: string; base64: string };
  breedName: string;
  name?: string;
  notes?: string;
  favorite: boolean;
  rarity: Rarity;
  isMixed: boolean;
  confidence: number;
  candidateBreeds?: string[];
};

export type SaveResult = { entryId: string; isNewBreed: boolean; isRare: boolean; xpGained: number };

/**
 * Ported from the Next app's ReviewForm.onSubmit: upload to Storage, then one transaction
 * for the entry, XP, level, counters, achievements and the public profile.
 */
export async function saveCapture(uid: string, input: CaptureInput): Promise<SaveResult> {
  const entriesRef = collection(db, 'users', uid, 'entries');
  const entryRef = doc(entriesRef);
  const entryId = entryRef.id;

  const blob = await photoBlob(input.photo);
  const photoRef = ref(storage, `users/${uid}/entries/${entryId}.jpg`);
  const upload = await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
  // Guard against silently storing a bad body (seen on Android with fetch(file://)).
  if (!blob.size || upload.metadata.size !== blob.size || blob.size < 100) {
    throw new Error(`Photo upload failed (${upload.metadata.size}/${blob.size} bytes)`);
  }
  const photoUrl = await getDownloadURL(photoRef);

  // Queries can't run inside client transactions; same approach as the web app.
  const [sameBreed, uncommon, rare, achievementsSnap] = await Promise.all([
    getDocs(query(entriesRef, where('breedName', '==', input.breedName))),
    getDocs(query(entriesRef, where('rarity', '==', 'Uncommon'))),
    getDocs(query(entriesRef, where('rarity', '==', 'Rare'))),
    getDocs(collection(db, 'users', uid, 'achievements')),
  ]);
  const achievements = achievementsSnap.docs.map((d) => ({ ...(d.data() as AchievementDoc), id: d.id }));
  const isNewBreed = sameBreed.empty;

  let xpGained = 0;
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error('User profile not found.');
    const userData = userSnap.data();

    const progress = computeCaptureProgress({
      user: userData,
      rarity: input.rarity,
      isNewBreed,
      existingUncommon: uncommon.size,
      existingRare: rare.size,
      achievements,
    });
    xpGained = progress.xpGained;

    tx.set(entryRef, {
      photoUrl,
      breedName: input.breedName,
      name: input.name ?? '',
      notes: input.notes ?? '',
      favorite: input.favorite,
      rarity: input.rarity,
      isMixed: input.isMixed,
      confidence: input.confidence,
      aiCandidates: input.candidateBreeds ?? [],
      capturedAt: new Date(),
      userId: uid,
      aiProvider: 'gemini',
    });

    for (const u of progress.achievementUpdates) {
      const achRef = doc(db, 'users', uid, 'achievements', u.id);
      tx.update(achRef, u.unlocked
        ? { progress: u.progress, unlocked: true, unlockedAt: new Date() }
        : { progress: u.progress });
    }

    tx.update(userRef, {
      xp: progress.xp,
      level: progress.level,
      totalCaptures: progress.totalCaptures,
      uniqueBreedsCount: progress.uniqueBreedsCount,
    });

    if (userData.trainerName) {
      tx.set(
        doc(db, 'publicProfiles', uid),
        {
          uid,
          trainerName: userData.trainerName,
          level: progress.level,
          xp: progress.xp,
          totalCaptures: progress.totalCaptures,
          uniqueBreedsCount: progress.uniqueBreedsCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  });

  return { entryId, isNewBreed, isRare: input.rarity !== 'Common', xpGained };
}

export async function setFavorite(uid: string, entryId: string, favorite: boolean) {
  await updateDoc(doc(db, 'users', uid, 'entries', entryId), { favorite });
}

/** Same behaviour as the web app: removes the photo and the entry (counters are untouched). */
export async function deleteCapture(uid: string, entryId: string, photoUrl?: string) {
  if (photoUrl) {
    try {
      await deleteObject(ref(storage, photoUrl));
    } catch (e) {
      console.warn('Could not delete image from Storage:', e);
    }
  }
  await deleteDoc(doc(db, 'users', uid, 'entries', entryId));
}
