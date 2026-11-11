import { identifyDogBreedStrict, MOCK_IDENTIFY_RESULT } from '@/ai/identify-dog-breed-prompt';
import { AuthError, verifyFirebaseIdToken } from '@/lib/server/verify-firebase-token';

/**
 * POST /api/identify — breed recognition for the CanisQuest mobile app (apps/mobile).
 *
 * Headers: Authorization: Bearer <Firebase ID token>
 * Body:    { imageBase64: string, mimeType: string }
 * Returns: IdentifyResult { breedName, isMixed, confidence, rarity, candidateBreeds }
 *
 * Uses the same Genkit prompt as the web app's server action, but upstream/config errors
 * return 5xx instead of the web flow's "Mixed Breed" fallback, so the app can tell the user.
 * The web UI does not use this route.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// About 7.5 MB of image. The app resizes to <=1280px JPEG, so real requests are far smaller.
const MAX_BASE64_LENGTH = 10_000_000;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // Local-testing switches are ignored in production: an unsigned emulator token or a mocked
  // result must never be accepted by the deployed app.
  const isProduction = process.env.NODE_ENV === 'production';
  const useAuthEmulator = !isProduction && Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (useAuthEmulator ? 'demo-canisquest' : '');
  if (!projectId) return error(500, 'Server is missing FIREBASE_PROJECT_ID');

  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return error(401, 'Missing ID token');
  try {
    await verifyFirebaseIdToken(token, projectId, { emulator: useAuthEmulator });
  } catch (e) {
    if (e instanceof AuthError) return error(401, e.message);
    throw e;
  }

  let body: { imageBase64?: unknown; mimeType?: unknown };
  try {
    body = await request.json();
  } catch {
    return error(400, 'Body must be JSON');
  }
  const { imageBase64, mimeType } = body ?? {};
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return error(400, 'imageBase64 is required');
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) return error(413, 'Image too large');
  const mime = typeof mimeType === 'string' ? mimeType : 'image/jpeg';
  if (!ALLOWED_MIME.has(mime)) return error(400, `Unsupported mimeType ${mime}`);

  if (!isProduction && process.env.GEMINI_MOCK === '1') return Response.json(MOCK_IDENTIFY_RESULT);

  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    return error(500, 'Server is missing GEMINI_API_KEY');
  }

  try {
    const result = await identifyDogBreedStrict(`data:${mime};base64,${imageBase64}`);
    return Response.json(result);
  } catch (e) {
    console.error('identify failed', e);
    return error(502, 'Breed recognition is unavailable');
  }
}
