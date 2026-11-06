/** @jest-environment node */
import { FALLBACK_RESULT, identifyDogBreed, normalizeResult, UpstreamError } from '@/server/identify';

describe('normalizeResult', () => {
  it('clamps confidence and defaults bad fields', () => {
    expect(
      normalizeResult({ breedName: ' Akita ', confidence: 3, rarity: 'Legendary', candidateBreeds: ['Shiba Inu', 4] })
    ).toEqual({ breedName: 'Akita', isMixed: false, confidence: 1, rarity: 'Uncommon', candidateBreeds: ['Shiba Inu'] });
  });
  it('falls back when breed is empty', () => {
    expect(normalizeResult({ breedName: '' })).toBe(FALLBACK_RESULT);
    expect(normalizeResult(null)).toBe(FALLBACK_RESULT);
  });
});

describe('identifyDogBreed', () => {
  const image = { base64: 'aGVsbG8=', mimeType: 'image/jpeg' };

  it('sends the image inline with the key in a header and parses JSON output', async () => {
    const fetchImpl = jest.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.contents[0].parts[1].inline_data).toEqual({ mime_type: 'image/jpeg', data: 'aGVsbG8=' });
      expect(body.generationConfig.responseMimeType).toBe('application/json');
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"breedName":"Beagle","isMixed":false,"confidence":0.8,"rarity":"Common","candidateBreeds":[]}' }] } }],
        }),
        { status: 200 }
      );
    });
    const result = await identifyDogBreed(image, { apiKey: 'k', fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.breedName).toBe('Beagle');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('/models/gemini-2.5-flash:generateContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('k');
    expect(url).not.toContain('key=');
  });

  it('throws UpstreamError on non-2xx', async () => {
    const fetchImpl = async () => new Response('quota', { status: 429 });
    await expect(identifyDogBreed(image, { apiKey: 'k', fetchImpl: fetchImpl as unknown as typeof fetch })).rejects.toBeInstanceOf(UpstreamError);
  });

  it('falls back on unparseable model text', async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }));
    await expect(identifyDogBreed(image, { apiKey: 'k', fetchImpl: fetchImpl as unknown as typeof fetch })).resolves.toBe(FALLBACK_RESULT);
  });
});
