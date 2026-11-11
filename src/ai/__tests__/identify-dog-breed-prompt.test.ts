import { describe, expect, it, vi } from 'vitest';

const prompt = vi.hoisted(() => vi.fn());
vi.mock('@/ai/genkit', () => ({ ai: { definePrompt: () => prompt } }));

import {
  FALLBACK_IDENTIFY_RESULT,
  identifyDogBreedStrict,
  normalizeIdentifyOutput,
} from '@/ai/identify-dog-breed-prompt';

describe('normalizeIdentifyOutput (same rules as the web flow)', () => {
  it('clamps confidence and fills defaults', () => {
    expect(normalizeIdentifyOutput({ breedName: 'Akita', confidence: 3 })).toEqual({
      breedName: 'Akita',
      isMixed: false,
      confidence: 1,
      rarity: 'Uncommon',
      candidateBreeds: [],
    });
    expect(normalizeIdentifyOutput({ breedName: 'Akita' }).confidence).toBe(0.5);
  });
  it('falls back to Mixed Breed only when there is no breed', () => {
    expect(normalizeIdentifyOutput({ breedName: '' })).toBe(FALLBACK_IDENTIFY_RESULT);
    expect(normalizeIdentifyOutput(null)).toBe(FALLBACK_IDENTIFY_RESULT);
  });
});

describe('identifyDogBreedStrict', () => {
  it('passes the data URI to the shared prompt and normalises the output', async () => {
    prompt.mockResolvedValueOnce({ output: { breedName: 'Beagle', isMixed: false, confidence: 0.8, rarity: 'Common', candidateBreeds: [] } });
    await expect(identifyDogBreedStrict('data:image/jpeg;base64,AAAA')).resolves.toMatchObject({ breedName: 'Beagle' });
    expect(prompt).toHaveBeenCalledWith({ photoDataUri: 'data:image/jpeg;base64,AAAA' });
  });
  it('throws upstream errors instead of returning Mixed Breed', async () => {
    prompt.mockRejectedValueOnce(new Error('API key not valid'));
    await expect(identifyDogBreedStrict('data:image/jpeg;base64,AAAA')).rejects.toThrow('API key not valid');
  });
});
