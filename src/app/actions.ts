
"use server";

import { generateImageDescription } from "@/ai/flows/image-to-description-flow";
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow";
import { narrationToAudio } from "@/ai/flows/narration-to-audio"; 
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
// Removed: import { generateFollowUpAnswer } from "@/ai/flows/follow-up-question-flow";
// Removed: import type { GenerateFollowUpOutput } from "@/ai/flows/follow-up-question-flow";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string; 
  locationDescription: string;
  outputLanguage: string;
  informationStyle: string; // Added
  userId: string; // Added
  latitude?: number | null; // Added
  longitude?: number | null; // Added
}

const WEBHOOK_URL = "https://n8n-mayia-test-u42339.vm.elestio.app/webhook-test/a21f3fcb-4808-495c-974a-7646892675a2";

export async function generateTravelNarrativeAction(
  rawValues: NarratorFormValues,
  language: string, 
  userId: string,
  latitude?: number | null,
  longitude?: number | null
): Promise<TravelNarrativeResult | { error: string }> {
  try {
    const validation = narratorFormSchema.safeParse(rawValues);
    if (!validation.success) {
      const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      return { error: "Invalid input: " + errorMessages };
    }

    if (!userId) {
      return { error: "User ID is missing. Cannot proceed." };
    }

    const { imageDataUri, locationQuery, informationStyle } = validation.data; // outputLanguage removed from form
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

    const effectiveOutputLanguage = language;


    let narrativeTextFromWebhook: string;
    try {
      const headers: Record<string, string> = {
        'Style': informationStyle,
        'Prompt': identifiedLocationDescription,
        'X-User-ID': userId, 
        'X-Output-Language': effectiveOutputLanguage,
        'X-Latitude': latitude?.toString() || '',
        'X-Longitude': longitude?.toString() || '',
        'Follow-Up': "false", // Added Follow-Up header
      };
      
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: headers,
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
      audioDataUri: "", 
      locationDescription: identifiedLocationDescription,
      outputLanguage: effectiveOutputLanguage,
      informationStyle, // Return for follow-up
      userId, // Return for follow-up
      latitude, // Return for follow-up
      longitude, // Return for follow-up
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
  informationStyle: string; // Added
  userId: string; // Added
  latitude?: number | null; // Added
  longitude?: number | null; // Added
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
    if (!input.userId) {
      return { error: "User ID is missing for follow-up. Cannot proceed." };
    }

    let answerTextFromWebhook: string;
    try {
      const headers: Record<string, string> = {
        'Style': input.informationStyle,
        'Prompt': input.userQuestion, // Follow-up question is the prompt
        'X-User-ID': input.userId, 
        'X-Output-Language': input.language,
        'X-Latitude': input.latitude?.toString() || '',
        'X-Longitude': input.longitude?.toString() || '',
        'Follow-Up': "true", // Added Follow-Up header
        'X-Current-Narrative': input.currentNarrativeText, // Context for the agent
        'X-Location-Context': input.locationDescription, // Context for the agent
      };
      
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: headers,
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("Follow-up webhook error response:", errorText);
        return { error: `Failed to get follow-up answer from agent. Status: ${webhookResponse.status}. ${errorText}` };
      }
      answerTextFromWebhook = await webhookResponse.text();
      if (!answerTextFromWebhook) {
        return { error: "Agent returned an empty follow-up answer." };
      }
    } catch (fetchError) {
      console.error("Error calling webhook for follow-up:", fetchError);
      return { error: `Error contacting the agent for follow-up: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` };
    }

    // Generate audio for the webhook's text response
    const audioResult: NarrationToAudioOutput = await narrationToAudio({
      narratedText: answerTextFromWebhook,
      voice: "default", 
    });

    if (!audioResult.audioDataUri) {
      return { error: "Failed to generate audio for the follow-up answer." };
    }

    return {
      answerText: answerTextFromWebhook,
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
