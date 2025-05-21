
'use server';
/**
 * @fileOverview Generates an answer to a follow-up question based on a previous narrative and location.
 *
 * - generateFollowUpAnswer - A function that handles generating the follow-up answer.
 * - GenerateFollowUpInput - The input type for the generateFollowUpAnswer function.
 * - GenerateFollowUpOutput - The return type for the generateFollowUpAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFollowUpInputSchema = z.object({
  currentNarrativeText: z.string().describe('The text of the narrative that was just presented to the user.'),
  locationDescription: z.string().describe('The description of the location related to the narrative.'),
  userQuestion: z.string().describe('The follow-up question asked by the user.'),
});
export type GenerateFollowUpInput = z.infer<typeof GenerateFollowUpInputSchema>;

const GenerateFollowUpOutputSchema = z.object({
  answerText: z.string().describe('The generated answer to the user\'s follow-up question.'),
});
export type GenerateFollowUpOutput = z.infer<typeof GenerateFollowUpOutputSchema>;

export async function generateFollowUpAnswer(input: GenerateFollowUpInput): Promise<GenerateFollowUpOutput> {
  return generateFollowUpAnswerFlow(input);
}

const followUpPrompt = ai.definePrompt({
  name: 'generateFollowUpPrompt',
  input: {schema: GenerateFollowUpInputSchema},
  output: {schema: GenerateFollowUpOutputSchema},
  prompt: `You are a helpful and knowledgeable tour guide assistant.
The user was just told the following about "{{locationDescription}}":
"{{currentNarrativeText}}"

The user now has a follow-up question: "{{userQuestion}}"

Please answer their question concisely and accurately, based on the information from the narrative and the location context.
If the question cannot be answered from the given context or is unrelated, politely state that you don't have that information or that it's outside the scope of the current topic.
Focus on being helpful and staying on topic with the original narrative.
Generate only the answer text.`,
});

const generateFollowUpAnswerFlow = ai.defineFlow(
  {
    name: 'generateFollowUpAnswerFlow',
    inputSchema: GenerateFollowUpInputSchema,
    outputSchema: GenerateFollowUpOutputSchema,
  },
  async input => {
    const {output} = await followUpPrompt(input);
    if (!output) {
        throw new Error("Failed to get an answer from the AI model for the follow-up question.");
    }
    return output;
  }
);
