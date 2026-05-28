'use server';

/**
 * @fileOverview Identifies dog breeds from images using AI.
 *
 * - identifyDogBreedFromImage - Main exported function
 * - IdentifyDogBreedInput - Input type
 * - IdentifyDogBreedOutput - Output type
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

export type IdentifyDogBreedInput = z.infer<
  typeof IdentifyDogBreedInputSchema
>;

const CandidateBreedSchema = z.object({
  breed: z.string(),
  confidence: z.number().min(0).max(1),
});

const IdentifyDogBreedOutputSchema = z.object({
  breedName: z
    .string()
    .describe('The most likely primary dog breed.'),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Confidence score for the primary breed between 0 and 1.'
    ),

  isMixed: z
    .boolean()
    .default(false)
    .describe(
      'Whether the dog appears to be a mixed breed.'
    ),

  candidateBreeds: z
    .array(CandidateBreedSchema)
    .default([])
    .describe(
      'Alternative possible breeds with confidence scores.'
    ),

  rarity: z
    .enum(['Common', 'Uncommon', 'Rare'])
    .default('Common')
    .describe(
      'Estimated rarity based on breed popularity.'
    ),
});

export type IdentifyDogBreedOutput = z.infer<
  typeof IdentifyDogBreedOutputSchema
>;

export async function identifyDogBreedFromImage(
  input: IdentifyDogBreedInput
): Promise<IdentifyDogBreedOutput> {
  return identifyDogBreedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyDogBreedPrompt',

  input: {
    schema: IdentifyDogBreedInputSchema,
  },

  output: {
    schema: IdentifyDogBreedOutputSchema,
  },

  prompt: `
You are an expert canine breed identification AI.

Analyze the dog image carefully and determine:

- The most likely primary breed
- Confidence score
- Whether it is a mixed breed
- Alternative candidate breeds
- Breed rarity

Rules:
- confidence must be between 0 and 1.
- Only mark isMixed as true if there is visible evidence of multiple breeds.
- Avoid overusing mixed breed classification.
- candidateBreeds should contain up to 3 realistic alternatives.
- candidateBreeds must NOT include the main breedName.
- candidateBreeds must be sorted from highest to lowest confidence.
- If the breed is visually obvious and confidence > 0.9, candidateBreeds may be empty.
- For mixed dogs, candidateBreeds should include likely contributing breeds.
- Be conservative and realistic with confidence values.
- Avoid hallucinating rare breeds unless clearly visible.

Rarity guidelines:
- Common = extremely common household breeds
- Uncommon = recognizable but less frequently seen
- Rare = uncommon or visually distinctive breeds

Return valid structured JSON only.

Photo:
{{media url=photoDataUri}}
`,
});

const identifyDogBreedFlow = ai.defineFlow(
  {
    name: 'identifyDogBreedFlow',

    inputSchema: IdentifyDogBreedInputSchema,

    outputSchema: IdentifyDogBreedOutputSchema,
  },

  async (input) => {
    try {
      const { output } = await prompt(input);

      if (!output) {
        throw new Error('No AI output generated.');
      }

      const sanitizedCandidates =
        (output.candidateBreeds || [])
          .filter(
            (candidate) =>
              candidate.breed &&
              candidate.breed !== output.breedName
          )
          .sort(
            (a, b) => b.confidence - a.confidence
          )
          .slice(0, 3);

      return {
        breedName:
          output.breedName || 'Unknown Breed',

        confidence:
          typeof output.confidence === 'number'
            ? output.confidence
            : 0.5,

        isMixed: output.isMixed ?? false,

        candidateBreeds: sanitizedCandidates,

        rarity: output.rarity || 'Common',
      };
    } catch (error) {
      console.error(
        'Dog breed identification failed:',
        error
      );

      return {
        breedName: 'Unknown Breed',
        confidence: 0.5,
        isMixed: false,
        candidateBreeds: [],
        rarity: 'Common',
      };
    }
  }
);