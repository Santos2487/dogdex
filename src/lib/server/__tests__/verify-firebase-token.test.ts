import { describe, expect, it } from 'vitest';

import { AuthError, verifyFirebaseIdToken } from '@/lib/server/verify-firebase-token';

function unsignedJwt(payload: object) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`;
}

describe('verifyFirebaseIdToken (emulator mode)', () => {
  it('accepts an emulator token for the right project', async () => {
    await expect(verifyFirebaseIdToken(unsignedJwt({ aud: 'p1', sub: 'u1' }), 'p1', { emulator: true })).resolves.toEqual({ uid: 'u1' });
  });
  it('rejects wrong audience, missing subject and garbage as AuthError', async () => {
    await expect(verifyFirebaseIdToken(unsignedJwt({ aud: 'other', sub: 'u1' }), 'p1', { emulator: true })).rejects.toBeInstanceOf(AuthError);
    await expect(verifyFirebaseIdToken(unsignedJwt({ aud: 'p1' }), 'p1', { emulator: true })).rejects.toBeInstanceOf(AuthError);
    await expect(verifyFirebaseIdToken('abc.def.ghi', 'p1', { emulator: true })).rejects.toBeInstanceOf(AuthError);
  });
});

describe('verifyFirebaseIdToken (production mode)', () => {
  it('rejects an unsigned token without trusting it', async () => {
    await expect(
      verifyFirebaseIdToken(unsignedJwt({ aud: 'p1', sub: 'u1', iss: 'https://securetoken.google.com/p1' }), 'p1')
    ).rejects.toBeInstanceOf(AuthError);
  });
});
