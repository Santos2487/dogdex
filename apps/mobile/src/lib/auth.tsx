import { onAuthStateChanged, signInAnonymously, signOut, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { initialAchievements } from '@/lib/data';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';

type AuthState = {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const DEAD_SESSION_CODES = new Set([
  'auth/invalid-refresh-token',
  'auth/user-token-expired',
  'auth/user-disabled',
  'auth/user-not-found',
]);

async function ensureUserAchievements(uid: string) {
  const batch = writeBatch(db);
  let missing = false;
  for (const ach of initialAchievements) {
    const ref = doc(db, 'users', uid, 'achievements', ach.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const { icon: _icon, ...data } = ach;
      batch.set(ref, { ...data, unlocked: false, progress: 0, unlockedAt: null });
      missing = true;
    }
  }
  if (missing) await batch.commit();
}

/** Same as the Next app's createUserProfile. */
async function createUserProfile(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        createdAt: serverTimestamp(),
        authProvider: user.isAnonymous ? 'anonymous' : 'google',
        level: 1,
        xp: 0,
        totalCaptures: 0,
        uniqueBreedsCount: 0,
      },
      { merge: true }
    );
  }
  await ensureUserAchievements(user.uid);
  if (!user.isAnonymous) {
    await setDoc(
      userRef,
      {
        authProvider: 'google',
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (current) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      try {
        if (!current) {
          setUser(null);
          setUserData(null);
          await signInAnonymously(auth); // fires onAuthStateChanged again
          return;
        }
        try {
          // Fails fast if the persisted session is dead (user deleted/disabled, or the auth
          // emulator was reset); otherwise Firestore just reports "client is offline".
          await current.getIdToken();
        } catch (e) {
          if (DEAD_SESSION_CODES.has((e as { code?: string }).code ?? '')) {
            console.warn('Stored session is no longer valid; starting a new guest session.');
            await signOut(auth); // fires onAuthStateChanged(null) -> anonymous sign-in
            return;
          }
          throw e;
        }
        await createUserProfile(current);
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', current.uid),
          (snap) => {
            setUserData(snap.exists() ? (snap.data() as UserProfile) : null);
            setUser(current);
            setLoading(false);
          },
          (e) => {
            setError(e.message);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error('Auth/Profile error:', e);
        setError((e as Error).message);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  async function signOutUser() {
    setUserData(null);
    setUser(null);
    await signOut(auth);
  }

  return (
    <AuthContext value={{ user, userData, loading, error, signOutUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
