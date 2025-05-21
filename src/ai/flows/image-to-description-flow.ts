
'use server';
/**
 * @fileOverview Generates a textual description of a landmark or location from an image.
 *
 * - generateImageDescription - A function that analyzes an image and returns a description.
 * - GenerateImageDescriptionInput - The input type for the generateImageDescription function.
 * - GenerateImageDescriptionOutput - The return type for the generateImageDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageDescriptionInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a landmark or location, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageDescriptionInput = z.infer<typeof GenerateImageDescriptionInputSchema>;

const GenerateImageDescriptionOutputSchema = z.object({
  description: z.string().describe('A textual description of the main landmark or location in the image.'),
});
export type GenerateImageDescriptionOutput = z.infer<typeof GenerateImageDescriptionOutputSchema>;

export async function generateImageDescription(input: GenerateImageDescriptionInput): Promise<GenerateImageDescriptionOutput> {
  return generateImageDescriptionFlow(input);
}

// This prompt will instruct Gemini to describe the image.
// Gemini is capable of understanding images when passed via {{media url=...}}
const imageDescriptionGenkitPrompt = ai.definePrompt({
  name: 'generateImageDescriptionPrompt',
  input: {schema: GenerateImageDescriptionInputSchema},
  output: {schema: GenerateImageDescriptionOutputSchema},
  prompt: `Analyze the provided image and identify the primary landmark, scenic view, or notable location depicted.
Provide a concise textual description of this main subject.
For example, if the image is of the Eiffel Tower, the description should be "The Eiffel Tower in Paris".
If it's a less known place, describe it generally, e.g., "A serene beach with palm trees".

Image: {{media url=imageDataUri}}`,
});

const generateImageDescriptionFlow = ai.defineFlow(
  {
    name: 'generateImageDescriptionFlow',
    inputSchema: GenerateImageDescriptionInputSchema,
    outputSchema: GenerateImageDescriptionOutputSchema,
  },
  async input => {
    // The global `ai` object is configured with 'googleai/gemini-2.0-flash'
    // which supports image input with {{media url=...}}
    const {output} = await imageDescriptionGenkitPrompt(input);
    if (!output) {
        throw new Error("Failed to get a description from the image model.");
    }
    return output;
  }
);
