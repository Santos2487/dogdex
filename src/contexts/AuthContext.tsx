'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, writeBatch, onSnapshot, DocumentData } from 'firebase/firestore';
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
        try {
          const userCredential = await signInAnonymously(auth);
          const newUser = userCredential.user;
          
          const userRef = doc(db, 'users', newUser.uid);
          const newUserProfile: UserProfile = {
            uid: newUser.uid,
            createdAt: serverTimestamp() as any, // Cast because serverTimestamp is a sentinel
            authProvider: 'anonymous',
            level: 1,
            xp: 0,
            totalCaptures: 0,
            uniqueBreedsCount: 0,
          };
          await setDoc(userRef, newUserProfile, { merge: true });

          const achievementsCollectionRef = collection(db, 'users', newUser.uid, 'achievements');
          const batch = writeBatch(db);
          initialAchievements.forEach(ach => {
            const achRef = doc(achievementsCollectionRef, ach.id);
            const initialAchData = {
                ...ach,
                unlocked: false,
                progress: 0,
                unlockedAt: null,
            };
            delete (initialAchData as any).icon; // Don't store React component in Firestore
            batch.set(achRef, initialAchData);
          });
          await batch.commit();

        } catch (error) {
          console.error('Error signing in anonymously:', error);
          setLoading(false);
        }
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
