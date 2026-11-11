import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const strict = vi.hoisted(() => vi.fn());
vi.mock('@/ai/identify-dog-breed-prompt', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  identifyDogBreedStrict: strict,
}));
vi.mock('@/ai/genkit', () => ({ ai: { definePrompt: () => vi.fn() } }));

import { POST } from '@/app/api/identify/route';

const token = (payload: object) => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64(payload)}.`;
};
const good = token({ aud: 'demo-canisquest', sub: 'user-1' });

function req(body: unknown, auth: string | null = `Bearer ${good}`) {
  return new Request('http://localhost/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const image = { imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg' };

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:9099');
  vi.stubEnv('FIREBASE_PROJECT_ID', '');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '');
  vi.stubEnv('GEMINI_MOCK', '');
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
  strict.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/identify', () => {
  it('401 without or with a bad token', async () => {
    expect((await POST(req(image, null))).status).toBe(401);
    expect((await POST(req(image, 'Bearer abc.def.ghi'))).status).toBe(401);
    expect((await POST(req(image, `Bearer ${token({ aud: 'other-project', sub: 'u' })}`))).status).toBe(401);
  });

  it('400 for bad bodies, 413 for huge images', async () => {
    expect((await POST(req('not json'))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ imageBase64: 'x', mimeType: 'text/plain' }))).status).toBe(400);
    expect((await POST(req({ imageBase64: 'a'.repeat(10_000_001) }))).status).toBe(413);
  });

  it('returns the Genkit result as a data URI round-trip', async () => {
    strict.mockResolvedValueOnce({ breedName: 'Beagle', isMixed: false, confidence: 0.8, rarity: 'Common', candidateBreeds: [] });
    const res = await POST(req(image));
    expect(res.status).toBe(200);
    expect((await res.json()).breedName).toBe('Beagle');
    expect(strict).toHaveBeenCalledWith('data:image/jpeg;base64,aGVsbG8=');
  });

  it('502 when Gemini fails (no Mixed Breed fallback)', async () => {
    strict.mockRejectedValueOnce(new Error('quota'));
    const res = await POST(req(image));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Breed recognition is unavailable' });
  });

  it('500 when the key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GOOGLE_API_KEY', '');
    expect((await POST(req(image))).status).toBe(500);
    expect(strict).not.toHaveBeenCalled();
  });

  it('GEMINI_MOCK returns a fixed result without calling Gemini', async () => {
    vi.stubEnv('GEMINI_MOCK', '1');
    const res = await POST(req(image));
    expect((await res.json()).breedName).toBe('Labrador Retriever');
    expect(strict).not.toHaveBeenCalled();
  });

  it('ignores the emulator token and GEMINI_MOCK switches in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GEMINI_MOCK', '1');
    vi.stubEnv('FIREBASE_PROJECT_ID', 'demo-canisquest');
    // Unsigned emulator token must be rejected (signature check against Google's JWKS).
    expect((await POST(req(image))).status).toBe(401);
  });
});
