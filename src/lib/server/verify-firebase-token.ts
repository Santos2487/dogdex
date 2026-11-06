import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTPayload } from 'jose';

// Firebase ID tokens are signed by securetoken; see
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export class AuthError extends Error {}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  opts: { emulator?: boolean } = {}
): Promise<{ uid: string }> {
  let payload: JWTPayload;
  if (opts.emulator) {
    // The Auth emulator issues unsigned tokens; firebase-admin also skips the signature check there.
    try {
      payload = decodeJwt(token);
    } catch (e) {
      throw new AuthError(`Invalid ID token: ${(e as Error).message}`);
    }
    if (payload.aud !== projectId) throw new AuthError('Token audience mismatch');
  } else {
    try {
      ({ payload } = await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ['RS256'],
      }));
    } catch (e) {
      throw new AuthError(`Invalid ID token: ${(e as Error).message}`);
    }
  }
  if (!payload.sub) throw new AuthError('Token has no subject');
  return { uid: payload.sub };
}
