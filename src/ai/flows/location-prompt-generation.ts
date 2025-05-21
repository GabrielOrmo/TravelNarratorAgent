//Location prompt generation flow.
'use server';
/**
 * @fileOverview Generates a text prompt based on the location identified by Google Cloud Vision AI and user's preferred information style.
 *
 * - generateLocationPrompt - A function that generates the location prompt.
 * - GenerateLocationPromptInput - The input type for the generateLocationPrompt function.
 * - GenerateLocationPromptOutput - The return type for the generateLocationPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLocationPromptInputSchema = z.object({
  locationDescription: z
    .string()
    .describe('The description of the location identified by Google Cloud Vision AI.'),
  informationStyle: z
    .string()
    .describe(
      'The preferred information style (e.g., historical, curious, legends).' + ' ' + 'This style will be incorporated into the prompt.'
    ),
});
export type GenerateLocationPromptInput = z.infer<typeof GenerateLocationPromptInputSchema>;

const GenerateLocationPromptOutputSchema = z.object({
  prompt: z.string().describe('The generated text prompt for the location.'),
});
export type GenerateLocationPromptOutput = z.infer<typeof GenerateLocationPromptOutputSchema>;

export async function generateLocationPrompt(
  input: GenerateLocationPromptInput
): Promise<GenerateLocationPromptOutput> {
  return generateLocationPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLocationPromptPrompt',
  input: {schema: GenerateLocationPromptInputSchema},
  output: {schema: GenerateLocationPromptOutputSchema},
  prompt: `You are an expert in generating prompts for LLMs that will provide users with a narrative about a location.

  The user has provided the following description of the location:
  {{locationDescription}}

  The user prefers the narrative to be in the following style:
  {{informationStyle}}

  Generate a prompt that will instruct an LLM to provide a spoken narrative about the location, incorporating the user's preferred style.
  The prompt should be clear, concise, and specific, so that the LLM can generate a high-quality narrative.
  The prompt should encourage creativity and detail.
  `,
});

const generateLocationPromptFlow = ai.defineFlow(
  {
    name: 'generateLocationPromptFlow',
    inputSchema: GenerateLocationPromptInputSchema,
    outputSchema: GenerateLocationPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
