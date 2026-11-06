import { MOCK_RESULT, identifyDogBreed, UpstreamError } from '@/server/identify';
import { AuthError, verifyFirebaseIdToken } from '@/server/verify-token';

// About 7.5 MB of JPEG. The client resizes to 1280px, so real requests are far smaller.
const MAX_BASE64_LENGTH = 10_000_000;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/**
 * POST /api/identify
 * Headers: Authorization: Bearer <Firebase ID token>
 * Body: { imageBase64: string, mimeType: string }
 * Returns IdentifyResult. The Gemini key stays on the server (GEMINI_API_KEY).
 */
export async function POST(request: Request) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === '1' ? 'demo-canisquest' : '');
  if (!projectId) return error(500, 'Server is missing FIREBASE_PROJECT_ID');

  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return error(401, 'Missing ID token');
  try {
    await verifyFirebaseIdToken(token, projectId, {
      emulator: Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST),
    });
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
  const { imageBase64, mimeType } = body;
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return error(400, 'imageBase64 is required');
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) return error(413, 'Image too large');
  const mime = typeof mimeType === 'string' ? mimeType : 'image/jpeg';
  if (!ALLOWED_MIME.has(mime)) return error(400, `Unsupported mimeType ${mime}`);

  if (process.env.GEMINI_MOCK === '1') return Response.json(MOCK_RESULT);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return error(500, 'Server is missing GEMINI_API_KEY');

  try {
    const result = await identifyDogBreed(
      { base64: imageBase64, mimeType: mime },
      { apiKey, model: process.env.GEMINI_MODEL }
    );
    return Response.json(result);
  } catch (e) {
    console.error('identify failed', e);
    // The Genkit flow silently returned "Mixed Breed" on any error (including a missing
    // key). Surface it instead so the client shows "Analysis failed".
    return error(502, e instanceof UpstreamError ? 'Breed recognition is unavailable' : 'Breed recognition failed');
  }
}
