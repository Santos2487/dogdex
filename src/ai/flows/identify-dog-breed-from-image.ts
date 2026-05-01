'use server';
/**
 * @fileOverview Identifies the dog breed and rarity from an image.
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
    .describe('The exact identified dog breed name. Use the most specific breed name possible.'),
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
    .optional()
    .describe('Optional list of alternative possible breeds.'),
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
- confidence: a number between 0 and 1 representing how confident you are in the breed identification
- rarity: one of "Common", "Uncommon", or "Rare"
- candidateBreeds: optional alternative possible breeds

Breed rules:
- Use the most specific breed name possible.
- Do not simplify specific breeds into broad categories.
- Example: return "English Bulldog", not just "Bulldog".
- Example: return "American Bulldog", not just "Bulldog".
- Example: return "French Bulldog", not just "Bulldog".
- If the dog appears mixed but one breed is clearly dominant, return the dominant breed and include alternatives in candidateBreeds.
- If no specific breed is reliable, return "Mixed Breed".
- Do not force the result into a predefined list.

Confidence rules:
- Use 0.90–1.00 only when the breed is very visually clear.
- Use 0.70–0.89 when the breed is likely but not certain.
- Use 0.40–0.69 when several breeds are plausible.
- Use below 0.40 only when the image is poor or the dog is not clearly visible.

Rarity rules:
- "Common" = very popular and frequently seen breeds.
- "Uncommon" = moderately common or distinctive breeds.
- "Rare" = less common, harder-to-find, or less frequently seen breeds.
- Estimate rarity based on general global popularity and recognizability.

Return JSON only with this exact structure:

{
  "breedName": "",
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
    const { output } = await identifyDogBreedPrompt(input);

    if (!output) {
      throw new Error('AI could not identify the dog breed.');
    }

    return output;
  }
);