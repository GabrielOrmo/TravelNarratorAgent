
"use server";

import { generateImageDescription } from "@/ai/flows/image-to-description-flow";
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow";
import { narrationToAudio } from "@/ai/flows/narration-to-audio"; 
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";
import { Client } from "@googlemaps/google-maps-services-js";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string; 
  locationDescription: string;
  outputLanguage: string;
  informationStyle: string; 
  userId: string; 
  latitude?: number | null; 
  longitude?: number | null; 
}

const WEBHOOK_URL = "https://n8n-mayia-test-u42339.vm.elestio.app/webhook/a21f3fcb-4808-495c-974a-7646892675a2";

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
        'Follow-Up': "false", 
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
      informationStyle, 
      userId, 
      latitude, 
      longitude, 
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
  informationStyle: string; 
  userId: string; 
  latitude?: number | null; 
  longitude?: number | null; 
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
        'Prompt': input.userQuestion, 
        'X-User-ID': input.userId, 
        'X-Output-Language': input.language,
        'X-Latitude': input.latitude?.toString() || '',
        'X-Longitude': input.longitude?.toString() || '',
        'Follow-Up': "true", 
        // 'X-Current-Narrative': input.currentNarrativeText, // Removed as per user request
        'X-Location-Context': input.locationDescription, 
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


export interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export async function getPlaceAutocompleteSuggestions(
  query: string
): Promise<PlaceSuggestion[] | { error: string }> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is not configured.");
    return { error: "Autocomplete service is not configured." };
  }
  if (!query || query.trim().length < 2) {
    return []; // Don't search for very short queries
  }

  const client = new Client({});
  try {
    const response = await client.placeAutocomplete({
      params: {
        input: query,
        key: process.env.GOOGLE_MAPS_API_KEY,
        // You can add more parameters here, like 'types', 'components' for filtering
      },
      timeout: 5000, // milliseconds
    });

    if (response.data.status === "OK") {
      return response.data.predictions.map((prediction) => ({
        description: prediction.description,
        place_id: prediction.place_id,
      }));
    } else if (response.data.status === "ZERO_RESULTS") {
      return [];
    } else {
      console.error(
        "Google Places Autocomplete API Error:",
        response.data.status,
        response.data.error_message
      );
      return { error: `Autocomplete failed: ${response.data.status}` };
    }
  } catch (error) {
    console.error("Error calling Google Places Autocomplete API:", error);
    return { error: "Could not fetch place suggestions." };
  }
}
