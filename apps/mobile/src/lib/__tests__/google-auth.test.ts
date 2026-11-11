import { linkWithCredential, signInWithCredential, type Auth } from 'firebase/auth';

import { signInWithGoogleIdToken } from '@/lib/google-auth';

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn((idToken: string) => ({ providerId: 'google.com', idToken })),
    credentialFromError: jest.fn((e: { credential?: unknown }) => e.credential ?? null),
  },
  linkWithCredential: jest.fn(),
  signInWithCredential: jest.fn(),
}));

const link = linkWithCredential as jest.Mock;
const signIn = signInWithCredential as jest.Mock;

const guest = { uid: 'guest-uid', isAnonymous: true };
const authWith = (currentUser: unknown) => ({ currentUser }) as unknown as Auth;

beforeEach(() => jest.clearAllMocks());

test('links a guest to Google, keeping the UID', async () => {
  link.mockResolvedValue({ user: { ...guest, isAnonymous: false } });
  const user = await signInWithGoogleIdToken(authWith(guest), 'tok');
  expect(link).toHaveBeenCalledWith(guest, { providerId: 'google.com', idToken: 'tok' });
  expect(signIn).not.toHaveBeenCalled();
  expect(user.uid).toBe('guest-uid');
});

test('signs into the existing account when the Google credential is already in use', async () => {
  const fromError = { providerId: 'google.com', idToken: 'from-error' };
  link.mockRejectedValue({ code: 'auth/credential-already-in-use', credential: fromError });
  signIn.mockResolvedValue({ user: { uid: 'web-uid', isAnonymous: false } });
  const auth = authWith(guest);
  const user = await signInWithGoogleIdToken(auth, 'tok');
  expect(signIn).toHaveBeenCalledWith(auth, fromError);
  expect(user.uid).toBe('web-uid');
});

test('falls back to its own credential if the error carries none', async () => {
  link.mockRejectedValue({ code: 'auth/credential-already-in-use' });
  signIn.mockResolvedValue({ user: { uid: 'web-uid', isAnonymous: false } });
  const auth = authWith(guest);
  await signInWithGoogleIdToken(auth, 'tok');
  expect(signIn).toHaveBeenCalledWith(auth, { providerId: 'google.com', idToken: 'tok' });
});

test('rethrows other link errors', async () => {
  link.mockRejectedValue({ code: 'auth/network-request-failed' });
  await expect(signInWithGoogleIdToken(authWith(guest), 'tok')).rejects.toEqual({ code: 'auth/network-request-failed' });
  expect(signIn).not.toHaveBeenCalled();
});

test('signs in directly when there is no guest', async () => {
  signIn.mockResolvedValue({ user: { uid: 'web-uid', isAnonymous: false } });
  const auth = authWith(null);
  await signInWithGoogleIdToken(auth, 'tok');
  expect(link).not.toHaveBeenCalled();
  expect(signIn).toHaveBeenCalledWith(auth, { providerId: 'google.com', idToken: 'tok' });
});
