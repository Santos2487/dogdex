/** Firebase config, mirroring the Next app's NEXT_PUBLIC_FIREBASE_* vars as EXPO_PUBLIC_*. */
export const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === '1';
export const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';

const demoProject = 'demo-canisquest';

// EXPO_PUBLIC_* must be referenced statically so Metro can inline them.
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || (useEmulators ? 'demo-api-key' : ''),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || (useEmulators ? `${demoProject}.firebaseapp.com` : ''),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || (useEmulators ? demoProject : ''),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || (useEmulators ? `${demoProject}.appspot.com` : ''),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || (useEmulators ? 'demo-app-id' : ''),
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
