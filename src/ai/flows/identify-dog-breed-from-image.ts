'use server';
/**
 * @fileOverview Identifies dog breed, detects mixes, and estimates rarity.
 *
 * - identifyDogBreed - A function that handles the dog breed identification process.
 * - IdentifyDogBreedInput - The input type for the identifyDogBreed function.
 * - IdentifyDogBreedOutput - The return type for the identifyDogBreed function.
 */

import { ai } from '@/ai/genkit';
import {
  FALLBACK_IDENTIFY_RESULT,
  IdentifyDogBreedInputSchema,
  IdentifyDogBreedOutputSchema,
  identifyDogBreedPrompt,
  normalizeIdentifyOutput,
  type IdentifyDogBreedInput,
  type IdentifyDogBreedOutput,
} from '@/ai/identify-dog-breed-prompt';

export type { IdentifyDogBreedInput, IdentifyDogBreedOutput };

export async function identifyDogBreed(
  input: IdentifyDogBreedInput
): Promise<IdentifyDogBreedOutput> {
  return identifyDogBreedFlow(input);
}

const identifyDogBreedFlow = ai.defineFlow(
  {
    name: 'identifyDogBreedFlow',
    inputSchema: IdentifyDogBreedInputSchema,
    outputSchema: IdentifyDogBreedOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await identifyDogBreedPrompt(input);
      return normalizeIdentifyOutput(output);
    } catch (error) {
      console.error('Dog breed AI fallback used:', error);
      return FALLBACK_IDENTIFY_RESULT;
    }
  }
);
