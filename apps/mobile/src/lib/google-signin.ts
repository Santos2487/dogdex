// Native Google sign-in (iOS and Android). Needs a development build: the module is not in Expo Go.
// The OAuth clients were created by Firebase when the iOS and Android apps were registered in
// project dogdex-d6dcf; see "Native Google sign-in" in docs/expo-migration-plan.md.
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Client IDs are public identifiers, not secrets. The env vars let another Firebase project override them.
// webClientId is the audience Firebase Auth accepts for Google ID tokens; iosClientId must match the
// reversed iosUrlScheme in app.json. Android picks its client from the package name and signing SHA-1.
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '554469466347-mbibbn8qf7rhv29e48d98iq66ojvk6nb.apps.googleusercontent.com';
const iosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '554469466347-1u7bas7fo0pv8rb5qrv7q0iddq7eoghg.apps.googleusercontent.com';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId, iosClientId });
  configured = true;
}

/**
 * Shows the native Google account sheet and returns the Google ID token,
 * or null if the user cancelled. Throws on any other failure.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Like the web's prompt=select_account: forget the last account so the picker always shows.
  await GoogleSignin.signOut().catch(() => {});
  try {
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelled
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google did not return an ID token (check webClientId).');
    return idToken;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw e;
  }
}

/** Clears the native Google session so the next sign-in shows the account picker. */
export async function signOutGoogle(): Promise<void> {
  ensureConfigured();
  await GoogleSignin.signOut().catch(() => {});
}
