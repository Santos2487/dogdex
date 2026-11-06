import { rarities, type Rarity } from '@/lib/data';
import type { IdentifyResult } from '@/types';
import { IDENTIFY_PROMPT } from '@/server/identify-prompt';

/** Same fallback the Genkit flow returns when the model gives no usable breed. */
export const FALLBACK_RESULT: IdentifyResult = {
  breedName: 'Mixed Breed',
  isMixed: true,
  confidence: 0.45,
  rarity: 'Uncommon',
  candidateBreeds: [],
};

export const MOCK_RESULT: IdentifyResult = {
  breedName: 'Labrador Retriever',
  isMixed: false,
  confidence: 0.92,
  rarity: 'Common',
  candidateBreeds: ['Golden Retriever'],
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    breedName: { type: 'STRING' },
    isMixed: { type: 'BOOLEAN' },
    confidence: { type: 'NUMBER' },
    rarity: { type: 'STRING', enum: [...rarities] },
    candidateBreeds: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['breedName', 'isMixed', 'confidence', 'rarity', 'candidateBreeds'],
} as const;

export class UpstreamError extends Error {}

/** Mirrors the clamping/defaulting the Genkit flow did on the model output. */
export function normalizeResult(raw: unknown): IdentifyResult {
  if (!raw || typeof raw !== 'object') return FALLBACK_RESULT;
  const o = raw as Record<string, unknown>;
  const breedName = typeof o.breedName === 'string' ? o.breedName.trim() : '';
  if (!breedName) return FALLBACK_RESULT;
  const confidence =
    typeof o.confidence === 'number' && Number.isFinite(o.confidence)
      ? Math.min(Math.max(o.confidence, 0), 1)
      : 0.5;
  const rarity: Rarity = rarities.includes(o.rarity as Rarity) ? (o.rarity as Rarity) : 'Uncommon';
  const candidateBreeds = Array.isArray(o.candidateBreeds)
    ? o.candidateBreeds.filter((b): b is string => typeof b === 'string').slice(0, 10)
    : [];
  return { breedName, isMixed: o.isMixed === true, confidence, rarity, candidateBreeds };
}

export async function identifyDogBreed(
  image: { base64: string; mimeType: string },
  opts: { apiKey: string; model?: string; fetchImpl?: typeof fetch }
): Promise<IdentifyResult> {
  const model = opts.model || 'gemini-2.5-flash';
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: IDENTIFY_PROMPT },
              { inline_data: { mime_type: image.mimeType, data: image.base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new UpstreamError(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  try {
    return normalizeResult(JSON.parse(text));
  } catch {
    return FALLBACK_RESULT;
  }
}
