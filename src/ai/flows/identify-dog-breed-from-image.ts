'use server';
/**
 * Identifies dog breed, detects mixes, and estimates rarity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IdentifyDogBreedInputSchema = z.object({
  photoDataUri: z.string(),
});

export type IdentifyDogBreedInput = z.infer<typeof IdentifyDogBreedInputSchema>;

const IdentifyDogBreedOutputSchema = z.object({
  breedName: z.string(),
  isMixed: z.boolean(),
  confidence: z.number().min(0).max(1),
  rarity: z.enum(['Common', 'Uncommon', 'Rare']),
  candidateBreeds: z.array(z.string()).optional(),
});

export type IdentifyDogBreedOutput = z.infer<typeof IdentifyDogBreedOutputSchema>;

export async function identifyDogBreed(
  input: IdentifyDogBreedInput
): Promise<IdentifyDogBreedOutput> {
  return identifyDogBreedFlow(input);
}

const identifyDogBreedPrompt = ai.definePrompt({
  name: 'identifyDogBreedPrompt',
  input: { schema: IdentifyDogBreedInputSchema },
  output: { schema: IdentifyDogBreedOutputSchema },

  prompt: `You are an expert dog breed identifier.

Analyze the image and return EXACTLY this JSON:

{
  "breedName": "",
  "isMixed": false,
  "confidence": 0.0,
  "rarity": "Common",
  "candidateBreeds": []
}

Rules:

1. breedName:
- ALWAYS return a non-empty string
- Use the most specific breed possible
- Example: "English Bulldog", NOT "Bulldog"

2. Mixed detection:
- If clearly mixed → isMixed = true
- If pure → isMixed = false

- If mixed:
  - If one breed dominates → "English Bulldog mix"
  - If two clear breeds → "Labrador Retriever / Border Collie mix"
  - If unclear → "Mixed Breed"

3. candidateBreeds:
- List possible breeds if unsure or mixed
- Include components of mix

4. confidence:
- 0.90–1.00 → very clear
- 0.70–0.89 → likely
- 0.40–0.69 → uncertain / possible mix
- <0.40 → poor image / unclear

5. rarity:
- Common → very popular breeds
- Uncommon → moderately common
- Rare → unusual or distinctive
- For mixes, estimate based on visual uniqueness

6. CRITICAL:
- NEVER return empty breedName
- NEVER return text outside JSON
- ALWAYS follow schema exactly

Photo: {{media url=photoDataUri}}`,
});

const identifyDogBreedFlow = ai.defineFlow(
  {
    name: 'identifyDogBreedFlow',
    inputSchema: IdentifyDogBreedInputSchema,
    outputSchema: IdentifyDogBreedOutputSchema,
  },
  async (input) => {
    const { output } = await identifyDogBreedPrompt(input);

    if (!output) {
      throw new Error('AI could not identify the dog.');
    }

    return output;
  }
);