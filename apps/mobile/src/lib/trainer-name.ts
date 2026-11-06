import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';

export const TRAINER_NAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export function isValidTrainerName(name: string) {
  return TRAINER_NAME_RE.test(name.trim());
}

export class TrainerNameError extends Error {
  constructor(public code: 'already-have-name' | 'taken' | 'no-profile') {
    super(code);
  }
}

/** Reserve a unique, permanent collector name (same transaction as the Next app's settings page). */
export async function reserveTrainerName(uid: string, rawName: string, userData: UserProfile) {
  const name = rawName.trim();
  const lower = name.toLowerCase();
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, 'users', uid);
    const nameRef = doc(db, 'trainerNames', lower);
    const [userSnap, nameSnap] = [await tx.get(userRef), await tx.get(nameRef)];
    if (!userSnap.exists()) throw new TrainerNameError('no-profile');
    if (userSnap.data().trainerName) throw new TrainerNameError('already-have-name');
    if (nameSnap.exists()) throw new TrainerNameError('taken');
    tx.set(nameRef, { uid, trainerName: name, trainerNameLower: lower, createdAt: serverTimestamp() });
    tx.update(userRef, { trainerName: name, trainerNameLower: lower, trainerNameSetAt: serverTimestamp() });
    tx.set(doc(db, 'publicProfiles', uid), {
      uid,
      trainerName: name,
      level: userData.level ?? 1,
      xp: userData.xp ?? 0,
      totalCaptures: userData.totalCaptures ?? 0,
      uniqueBreedsCount: userData.uniqueBreedsCount ?? 0,
      updatedAt: serverTimestamp(),
    });
  });
}
