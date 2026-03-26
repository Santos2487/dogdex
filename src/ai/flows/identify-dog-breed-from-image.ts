'use server';
/**
 * @fileOverview Identifies the dog breed from an image.
 *
 * - identifyDogBreed - A function that handles the dog breed identification process.
 * - IdentifyDogBreedInput - The input type for the identifyDogBreed function.
 * - IdentifyDogBreedOutput - The return type for the identifyDogBreed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyDogBreedInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a dog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyDogBreedInput = z.infer<typeof IdentifyDogBreedInputSchema>;

const IdentifyDogBreedOutputSchema = z.object({
  breedName: z.string().describe('The identified breed of the dog.'),
  confidence: z
    .number()
    .describe('The confidence score (0-1) of the identification.'),
  candidateBreeds: z
    .array(z.string())
    .optional()
    .describe('Optional list of candidate breeds.'),
});
export type IdentifyDogBreedOutput = z.infer<typeof IdentifyDogBreedOutputSchema>;

export async function identifyDogBreed(input: IdentifyDogBreedInput): Promise<IdentifyDogBreedOutput> {
  return identifyDogBreedFlow(input);
}

const identifyDogBreedPrompt = ai.definePrompt({
  name: 'identifyDogBreedPrompt',
  input: {schema: IdentifyDogBreedInputSchema},
  output: {schema: IdentifyDogBreedOutputSchema},
  prompt: `You are an expert dog breed identifier. Analyze the image and identify the breed of the dog in the image. Also return the confidence score of the identification between 0 and 1.

  Photo: {{media url=photoDataUri}}
  \nReturn the data in JSON format.
  {
    "breedName": "",
    "confidence": 0.0,
    "candidateBreeds": [ ]
  }`,
});

const identifyDogBreedFlow = ai.defineFlow(
  {
    name: 'identifyDogBreedFlow',
    inputSchema: IdentifyDogBreedInputSchema,
    outputSchema: IdentifyDogBreedOutputSchema,
  },
  async input => {
    const {output} = await identifyDogBreedPrompt(input);
    return output!;
  }
);
