import type { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  linkWithCredential,
  signInWithCredential,
  type Auth,
  type User,
} from 'firebase/auth';

/**
 * Turns a Google ID token into a Firebase session, the same way the web app's signInWithGoogle does:
 * - a guest (anonymous) user is linked to Google, so the UID and its collection are kept;
 * - if that Google account already belongs to another Firebase user (for example one created on the
 *   web), the app signs into that account instead. The guest's data is not migrated (issue #7).
 * - any other user just signs in with Google.
 */
export async function signInWithGoogleIdToken(auth: Auth, idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const current = auth.currentUser;

  if (current?.isAnonymous) {
    try {
      return (await linkWithCredential(current, credential)).user;
    } catch (e) {
      if ((e as { code?: string }).code !== 'auth/credential-already-in-use') throw e;
      // The web uses the credential from the error; fall back to ours, which is the same token.
      const existing = GoogleAuthProvider.credentialFromError(e as FirebaseError) ?? credential;
      return (await signInWithCredential(auth, existing)).user;
    }
  }

  return (await signInWithCredential(auth, credential)).user;
}
