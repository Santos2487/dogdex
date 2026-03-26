'use server';
/**
 * @fileOverview This flow suggests manual breed selection when the AI model's confidence is low.
 *
 * - suggestManualBreedSelectionOnError - A function that triggers manual breed selection suggestion.
 * - SuggestManualBreedSelectionOnErrorInput - The input type for the suggestManualBreedSelectionOnError function.
 * - SuggestManualBreedSelectionOnErrorOutput - The return type for the suggestManualBreedSelectionOnError function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestManualBreedSelectionOnErrorInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a dog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
  confidence: z
    .number()
    .describe('The confidence score (0-1) of the AI model identifying the dog breed.'),
});
export type SuggestManualBreedSelectionOnErrorInput = z.infer<
  typeof SuggestManualBreedSelectionOnErrorInputSchema
>;

const SuggestManualBreedSelectionOnErrorOutputSchema = z.object({
  suggestManualSelection: z
    .boolean()
    .describe(
      'Whether or not to suggest manual breed selection based on the confidence score.'
    ),
  reason: z.string().optional().describe('Reason for suggesting manual selection.'),
});
export type SuggestManualBreedSelectionOnErrorOutput = z.infer<
  typeof SuggestManualBreedSelectionOnErrorOutputSchema
>;

export async function suggestManualBreedSelectionOnError(
  input: SuggestManualBreedSelectionOnErrorInput
): Promise<SuggestManualBreedSelectionOnErrorOutput> {
  return suggestManualBreedSelectionOnErrorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestManualBreedSelectionOnErrorPrompt',
  input: {schema: SuggestManualBreedSelectionOnErrorInputSchema},
  output: {schema: SuggestManualBreedSelectionOnErrorOutputSchema},
  prompt: `Given the AI model's confidence score of {{confidence}} for the identified dog breed in the photo {{media url=photoDataUri}}, determine whether to suggest manual breed selection to the user.

  Suggest manual selection if the confidence score is below 0.70. Return a reason why.
  If the confidence is 0.70 or above, do not suggest manual selection.
  `,
});

const suggestManualBreedSelectionOnErrorFlow = ai.defineFlow(
  {
    name: 'suggestManualBreedSelectionOnErrorFlow',
    inputSchema: SuggestManualBreedSelectionOnErrorInputSchema,
    outputSchema: SuggestManualBreedSelectionOnErrorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
