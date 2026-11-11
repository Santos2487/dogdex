import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

import { createAuth } from '@/lib/firebase-auth';
import { emulatorHost, firebaseConfig, useEmulators } from '@/lib/firebase-env';

const isFirstInit = getApps().length === 0;
export const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();
export const auth = createAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (useEmulators && isFirstInit) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectStorageEmulator(storage, emulatorHost, 9199);
}
