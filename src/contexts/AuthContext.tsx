'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  linkWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { auth, db, googleProvider } from '@/lib/firebase';

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
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

async function createUserProfile(uid: string, user?: User) {
  const userRef = doc(db, 'users', uid);
  const existingUser = await getDoc(userRef);

  if (!existingUser.exists()) {
    const newUserProfile: UserProfile = {
      uid,
      createdAt: serverTimestamp() as any,
      authProvider: user?.isAnonymous ? 'anonymous' : 'google',
      level: 1,
      xp: 0,
      totalCaptures: 0,
      uniqueBreedsCount: 0,
    };

    await setDoc(userRef, newUserProfile, { merge: true });

    const achievementsCollectionRef = collection(
      db,
      'users',
      uid,
      'achievements'
    );

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
  } else if (user && !user.isAnonymous) {
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    const currentUser = auth.currentUser;

    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        await createUserProfile(result.user.uid, result.user);
        return;
      } catch (error: any) {
        if (error?.code !== 'auth/credential-already-in-use') {
          throw error;
        }
      }
    }

    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user.uid, result.user);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          await createUserProfile(currentUser.uid, currentUser);

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
          await createUserProfile(userCredential.user.uid, userCredential.user);
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
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);