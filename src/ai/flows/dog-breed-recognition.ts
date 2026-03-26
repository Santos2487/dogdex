'use server';
/**
 * @fileOverview Dog breed recognition flow that uses the Gemini multimodal API to identify the breed of a dog from an image.
 *
 * - dogBreedRecognition - A function that handles the dog breed recognition process.
 * - DogBreedRecognitionInput - The input type for the dogBreedRecognition function.
 * - DogBreedRecognitionOutput - The return type for the dogBreedRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DogBreedRecognitionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a dog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
});
export type DogBreedRecognitionInput = z.infer<
  typeof DogBreedRecognitionInputSchema
>;

const DogBreedRecognitionOutputSchema = z.object({
  breedName: z
    .string()
    .describe('The identified breed of the dog.'),
  confidence: z
    .number()
    .describe('The confidence score (0-1) of the identification.'),
  candidateBreeds: z
    .array(z.string())
    .optional()
    .describe('Optional list of candidate breeds.'),
});
export type DogBreedRecognitionOutput = z.infer<
  typeof DogBreedRecognitionOutputSchema
>;

export async function dogBreedRecognition(
  input: DogBreedRecognitionInput
): Promise<DogBreedRecognitionOutput> {
  return dogBreedRecognitionFlow(input);
}

const dogBreedRecognitionPrompt = ai.definePrompt({
  name: 'dogBreedRecognitionPrompt',
  input: {schema: DogBreedRecognitionInputSchema},
  output: {schema: DogBreedRecognitionOutputSchema},
  prompt: `You are an expert dog breed identifier. Analyze the image and identify the breed of the dog in the image. Also return the confidence score of the identification between 0 and 1.

  Photo: {{media url=photoDataUri}}
  \nReturn the data in JSON format.
  {
    "breedName": "",
    "confidence": 0.0,
    "candidateBreeds": [ ]
  }`,
});

const dogBreedRecognitionFlow = ai.defineFlow(
  {
    name: 'dogBreedRecognitionFlow',
    inputSchema: DogBreedRecognitionInputSchema,
    outputSchema: DogBreedRecognitionOutputSchema,
  },
  async input => {
    const {output} = await dogBreedRecognitionPrompt(input);
    return output!;
  }
);
