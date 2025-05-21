'use server';

/**
 * @fileOverview Generates a spoken narrative about a location using Google Gemini.
 *
 * - generateNarrative - A function that generates the narrative.
 * - GenerateNarrativeInput - The input type for the generateNarrative function.
 * - GenerateNarrativeOutput - The return type for the generateNarrative function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNarrativeInputSchema = z.object({
  locationDescription: z
    .string()
    .describe('A description of the location or landmark.'),
  informationStyle: z
    .string()
    .describe(
      'The preferred information style (historical, curious, legends).' + ')'
    ),
});
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;

const GenerateNarrativeOutputSchema = z.object({
  narrativeText: z.string().describe('The generated narrative text.'),
});
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;

export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
  return generateNarrativeFlow(input);
}

const narrativePrompt = ai.definePrompt({
  name: 'narrativePrompt',
  input: {schema: GenerateNarrativeInputSchema},
  output: {schema: GenerateNarrativeOutputSchema},
  prompt: `You are a tour guide specializing in narrating stories about different locations.

  Based on the location description and the user's preferred information style, generate a spoken narrative about the location.

  Location Description: {{{locationDescription}}}
  Information Style: {{{informationStyle}}}
  `,
});

const generateNarrativeFlow = ai.defineFlow(
  {
    name: 'generateNarrativeFlow',
    inputSchema: GenerateNarrativeInputSchema,
    outputSchema: GenerateNarrativeOutputSchema,
  },
  async input => {
    const {output} = await narrativePrompt(input);
    return output!;
  }
);
