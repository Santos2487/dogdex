'use server';
/**
 * @fileOverview Implements the review capture flow with manual breed selection fallback.
 *
 * - reviewCaptureWithFallback - A function that handles the review capture process with fallback.
 * - ReviewCaptureWithFallbackInput - The input type for the reviewCaptureWithFallback function.
 * - ReviewCaptureWithFallbackOutput - The return type for the reviewCaptureWithFallback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewCaptureWithFallbackInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a dog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
  confidence: z
    .number()
    .describe('The confidence score (0-1) of the AI model identifying the dog breed.'),
  breedName: z.string().optional().describe('The identified breed name.'),
});
export type ReviewCaptureWithFallbackInput = z.infer<
  typeof ReviewCaptureWithFallbackInputSchema
>;

const ReviewCaptureWithFallbackOutputSchema = z.object({
  suggestManualSelection: z
    .boolean()
    .describe(
      'Whether or not to suggest manual breed selection based on the confidence score.'
    ),
  breedName: z.string().describe('The identified breed of the dog.'),
  photoDataUri: z.string().describe('The photo data URI of the captured image.'),
  confidence: z.number().describe('The confidence score of the AI model.'),
  reason: z.string().optional().describe('Reason for suggesting manual selection.'),
});
export type ReviewCaptureWithFallbackOutput = z.infer<
  typeof ReviewCaptureWithFallbackOutputSchema
>;

export async function reviewCaptureWithFallback(
  input: ReviewCaptureWithFallbackInput
): Promise<ReviewCaptureWithFallbackOutput> {
  return reviewCaptureWithFallbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewCaptureWithFallbackPrompt',
  input: {schema: ReviewCaptureWithFallbackInputSchema},
  output: {schema: ReviewCaptureWithFallbackOutputSchema},
  prompt: `Given the AI model's confidence score of {{confidence}} for the identified dog breed in the photo {{media url=photoDataUri}}, and identified breed name {{breedName}}, determine whether to suggest manual breed selection to the user.\n
  Suggest manual selection if the confidence score is below 0.70 or if the breedName is not provided. Return a reason why.\n  If the confidence is 0.70 or above and the breedName is provided, do not suggest manual selection.\n  `,
});

const reviewCaptureWithFallbackFlow = ai.defineFlow(
  {
    name: 'reviewCaptureWithFallbackFlow',
    inputSchema: ReviewCaptureWithFallbackInputSchema,
    outputSchema: ReviewCaptureWithFallbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output!,
      breedName: input.breedName!,
      photoDataUri: input.photoDataUri,
      confidence: input.confidence,
    };
  }
);
