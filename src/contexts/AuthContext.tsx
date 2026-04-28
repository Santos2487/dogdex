'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  writeBatch,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { initialAchievements } from '@/lib/data';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

async function createUserProfile(uid: string) {
  const userRef = doc(db, 'users', uid);
  const existingUser = await getDoc(userRef);

  if (!existingUser.exists()) {
    const newUserProfile: UserProfile = {
      uid,
      createdAt: serverTimestamp() as any,
      authProvider: 'anonymous',
      level: 1,
      xp: 0,
      totalCaptures: 0,
      uniqueBreedsCount: 0,
    };

    await setDoc(userRef, newUserProfile, { merge: true });

    const achievementsCollectionRef = collection(db, 'users', uid, 'achievements');
    const batch = writeBatch(db);

    initialAchievements.forEach((ach) => {
      const achRef = doc(achievementsCollectionRef, ach.id);

      const initialAchData = {
        ...ach,
        unlocked: false,
        progress: 0,
        unlockedAt: null,
      };

      delete (initialAchData as any).icon;

      batch.set(achRef, initialAchData);
    });

    await batch.commit();
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          await createUserProfile(currentUser.uid);

          if (unsubscribeProfile) unsubscribeProfile();

          const userRef = doc(db, 'users', currentUser.uid);

          unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserProfile);
            }

            setUser(currentUser);
            setLoading(false);
          });
        } else {
          const userCredential = await signInAnonymously(auth);
          await createUserProfile(userCredential.user.uid);
        }
      } catch (error) {
        console.error('Auth/Profile error:', error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);