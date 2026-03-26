// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your own Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'your-messaging-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// If in development, connect to emulators
if (process.env.NODE_ENV === 'development') {
    // Before running the app, run: firebase emulators:start
    // UNCOMMENT THE FOLLOWING LINES TO USE EMULATORS
    // try {
    //     connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    //     connectFirestoreEmulator(db, "localhost", 8080);
    //     connectStorageEmulator(storage, "localhost", 9199);
    //     console.log("Connected to Firebase emulators");
    // } catch (e) {
    //     console.error("Error connecting to Firebase emulators. Is it running? `firebase emulators:start`", e);
    // }
}


export { app, auth, db, storage };
