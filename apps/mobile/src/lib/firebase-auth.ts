// Native: persist the session in AsyncStorage (the default in-memory auth would sign out on reload).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

export function createAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Fast refresh: auth was already initialised for this app.
    return getAuth(app);
  }
}
