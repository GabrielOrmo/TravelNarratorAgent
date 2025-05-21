
"use server";

import { generateImageDescription } from "@/ai/flows/image-to-description-flow";
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow";
import { narrationToAudio } from "@/ai/flows/narration-to-audio"; // Still needed for follow-ups
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { generateFollowUpAnswer } from "@/ai/flows/follow-up-question-flow";
import type { GenerateFollowUpOutput } from "@/ai/flows/follow-up-question-flow";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string; // Will be empty for main narrative from webhook
  locationDescription: string;
  outputLanguage: string;
}

const WEBHOOK_URL = "https://n8n-mayia-test-u42339.vm.elestio.app/webhook-test/a21f3fcb-4808-495c-974a-7646892675a2";

export async function generateTravelNarrativeAction(
  rawValues: NarratorFormValues,
  language: string
): Promise<TravelNarrativeResult | { error: string }> {
  try {
    const validation = narratorFormSchema.safeParse(rawValues);
    if (!validation.success) {
      const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      return { error: "Invalid input: " + errorMessages };
    }

    const { imageDataUri, locationQuery, informationStyle } = validation.data;
    let identifiedLocationDescription: string;

    if (imageDataUri) {
      const imageDescriptionResult: GenerateImageDescriptionOutput = await generateImageDescription({
        imageDataUri,
      });

      if (!imageDescriptionResult || !imageDescriptionResult.description) {
        return { error: "Failed to get description from the provided image. Please try a different image or ensure it's clear." };
      }
      identifiedLocationDescription = imageDescriptionResult.description;
    } else if (locationQuery) {
      identifiedLocationDescription = locationQuery;
    } else {
      return { error: "Please provide either a location search term or an image." };
    }

    // Call the external webhook
    let narrativeTextFromWebhook: string;
    try {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Style': informationStyle,
          'Prompt': identifiedLocationDescription,
          // 'Content-Type': 'application/json', // If sending a body
        },
        // body: JSON.stringify({}), // If your webhook expects a JSON body
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("Webhook error response:", errorText);
        return { error: `Failed to get narrative from agent. Status: ${webhookResponse.status}. ${errorText}` };
      }
      narrativeTextFromWebhook = await webhookResponse.text();
      if (!narrativeTextFromWebhook) {
        return { error: "Agent returned an empty narrative." };
      }
    } catch (fetchError) {
      console.error("Error calling webhook:", fetchError);
      return { error: `Error contacting the narrative agent: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` };
    }

    return {
      narrativeText: narrativeTextFromWebhook,
      audioDataUri: "", // No audio from webhook for main narrative
      locationDescription: identifiedLocationDescription,
      outputLanguage: language,
    };

  } catch (error) {
    console.error("Error in generateTravelNarrativeAction:", error);
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}

export interface FollowUpServerInput {
  currentNarrativeText: string;
  locationDescription: string;
  userQuestion: string;
  language: string;
}

export interface FollowUpResult {
  answerText: string;
  answerAudioDataUri: string;
}

export async function generateFollowUpAnswerAction(
  input: FollowUpServerInput
): Promise<FollowUpResult | { error: string }> {
  try {
    if (!input.userQuestion.trim()) {
      return { error: "Follow-up question cannot be empty." };
    }

    // Follow-up questions still use the internal Genkit flow
    const followUpAnswerResult: GenerateFollowUpOutput = await generateFollowUpAnswer({
      currentNarrativeText: input.currentNarrativeText,
      locationDescription: input.locationDescription,
      userQuestion: input.userQuestion,
      outputLanguage: input.language,
    });

    if (!followUpAnswerResult.answerText) {
      return { error: "Failed to generate an answer for the follow-up question." };
    }

    const audioResult: NarrationToAudioOutput = await narrationToAudio({
      narratedText: followUpAnswerResult.answerText,
      voice: "default", // You might want to make voice configurable or tie to language
    });

    if (!audioResult.audioDataUri) {
      return { error: "Failed to generate audio for the follow-up answer." };
    }

    return {
      answerText: followUpAnswerResult.answerText,
      answerAudioDataUri: audioResult.audioDataUri,
    };
  } catch (error) {
    console.error("Error in generateFollowUpAnswerAction:", error);
    let errorMessage = "An unexpected error occurred while processing your follow-up question.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
