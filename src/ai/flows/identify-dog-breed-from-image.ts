'use server';
/**
 * @fileOverview Identifies dog breed, detects mixes, and estimates rarity.
 *
 * - identifyDogBreed - A function that handles the dog breed identification process.
 * - IdentifyDogBreedInput - The input type for the identifyDogBreed function.
 * - IdentifyDogBreedOutput - The return type for the identifyDogBreed function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IdentifyDogBreedInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a dog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type IdentifyDogBreedInput = z.infer<typeof IdentifyDogBreedInputSchema>;

const IdentifyDogBreedOutputSchema = z.object({
  breedName: z
    .string()
    .min(1)
    .describe(
      'The exact identified dog breed name. Use the most specific breed name possible.'
    ),
  isMixed: z
    .boolean()
    .default(false)
    .describe('Whether the dog appears to be a mixed breed.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence score between 0 and 1.'),
  rarity: z
    .enum(['Common', 'Uncommon', 'Rare'])
    .describe('The estimated rarity of this dog breed.'),
  candidateBreeds: z
    .array(z.string())
    .default([])
    .describe(
      'Alternative possible breeds, especially useful for mixed or uncertain dogs.'
    ),
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

Analyze the image and identify the dog breed as precisely as possible.

Return:
- breedName: the exact dog breed name
- isMixed: true or false
- confidence: a number between 0 and 1 representing how confident you are in the breed identification
- rarity: one of "Common", "Uncommon", or "Rare"
- candidateBreeds: alternative possible breeds, especially useful for mixed or uncertain dogs

Breed rules:
- Always return a non-empty breedName.
- Use the most specific breed name possible.
- Do not simplify specific breeds into broad categories.
- Example: return "English Bulldog", not just "Bulldog".
- Example: return "American Bulldog", not just "Bulldog".
- Example: return "French Bulldog", not just "Bulldog".
- Example: return "German Shepherd", not "Shepherd".
- Do not force the result into a predefined list.

Mixed breed rules:
- If the dog appears to be a mix and one breed is clearly dominant, return the dominant breed followed by "mix".
- Example: "English Bulldog mix".
- Example: "Labrador Retriever mix".
- If two breeds are clearly visible, use this format: "Breed A / Breed B mix".
- Example: "Labrador Retriever / Border Collie mix".
- If the dog appears mixed but no breed is reliable, return "Mixed Breed".
- Set isMixed to true when the dog appears mixed or when the breed is uncertain due to mixed traits.
- Use candidateBreeds to include likely alternatives or component breeds.

Difficult image rules:
- If the dog is side-facing, partially visible, moving, far away, low resolution, or the head is not fully clear, still provide the best likely breed identification.
- Do not fail only because the image is imperfect.
- Lower the confidence instead of leaving breedName empty.
- If a bully-type dog is visible but the exact breed is uncertain, use the most likely specific breed such as "American Staffordshire Terrier mix", "American Pit Bull Terrier mix", or "Bulldog mix", and include alternatives in candidateBreeds.

Confidence rules:
- Use 0.90–1.00 only when the breed is very visually clear.
- Use 0.70–0.89 when the breed is likely but not certain.
- Use 0.40–0.69 when several breeds are plausible or the dog may be mixed.
- Use below 0.40 only when the image is poor, the dog is obscured, or the dog is not clearly visible.
- If uncertain, lower the confidence instead of leaving breedName empty.

Rarity rules:
- "Common" = very popular and frequently seen breeds.
- "Uncommon" = moderately common, distinctive, or less frequently seen breeds.
- "Rare" = uncommon in everyday sightings, hard-to-find, unusual, or difficult-to-identify breeds.
- For mixed breeds, estimate rarity based on the dominant breed and how distinctive/unusual the mix appears.
- Estimate rarity based on general global popularity and recognizability.

Return JSON only with this exact structure:

{
  "breedName": "",
  "isMixed": false,
  "confidence": 0.0,
  "rarity": "Common",
  "candidateBreeds": []
}

Photo: {{media url=photoDataUri}}`,
});

const identifyDogBreedFlow = ai.defineFlow(
  {
    name: 'identifyDogBreedFlow',
    inputSchema: IdentifyDogBreedInputSchema,
    outputSchema: IdentifyDogBreedOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await identifyDogBreedPrompt(input);

      if (!output?.breedName) {
        return {
          breedName: 'Mixed Breed',
          isMixed: true,
          confidence: 0.45,
          rarity: 'Uncommon',
          candidateBreeds: [],
        };
      }

      return {
        breedName: output.breedName,
        isMixed: output.isMixed ?? false,
        confidence:
          typeof output.confidence === 'number'
            ? Math.min(Math.max(output.confidence, 0), 1)
            : 0.5,
        rarity: output.rarity ?? 'Uncommon',
        candidateBreeds: output.candidateBreeds ?? [],
      };
    } catch (error) {
      console.error('Dog breed AI fallback used:', error);

      return {
        breedName: 'Mixed Breed',
        isMixed: true,
        confidence: 0.45,
        rarity: 'Uncommon',
        candidateBreeds: [],
      };
    }
  }
);