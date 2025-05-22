
"use server";

import { generateImageDescription } from "@/ai/flows/image-to-description-flow";
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow";
import { narrationToAudio } from "@/ai/flows/narration-to-audio";
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";
import { Client, PlaceType2 } from "@googlemaps/google-maps-services-js";

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
const USER_CURRENT_LOCATION_REQUEST_FLAG = "[USER_CURRENT_LOCATION_REQUEST]";


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
    let identifiedLocationDescription: string | null = null;
    let shouldUseImageFlow = false;

    // Determine the primary input method and initial location description
    if (locationQuery && locationQuery !== USER_CURRENT_LOCATION_REQUEST_FLAG) {
      // Priority 1: User typed a specific location or selected an autocomplete/nearby suggestion
      identifiedLocationDescription = locationQuery;
    } else if (locationQuery === USER_CURRENT_LOCATION_REQUEST_FLAG && latitude && longitude) {
      // Priority 2: User requested current location and didn't select a specific nearby place
      identifiedLocationDescription = `Tell me about interesting places or hidden gems near my current location (Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}).`;
    } else if (imageDataUri) {
      // Priority 3: User provided an image (and no specific text query or current location flag was prioritized)
      shouldUseImageFlow = true;
    } else {
      // Fallback / Error case (should ideally be caught by Zod validation)
      return { error: "Please provide a location input (image, text, or use current location and select a suggestion)." };
    }

    // If image flow is determined to be the primary input, process the image
    if (shouldUseImageFlow) {
      if (!imageDataUri) { // Should be redundant due to above logic, but good for safety
        return { error: "Image data URI is missing when image input was prioritized."};
      }
      const imageDescriptionResult: GenerateImageDescriptionOutput = await generateImageDescription({
        imageDataUri,
      });

      if (!imageDescriptionResult || !imageDescriptionResult.description) {
        return { error: "Failed to get description from the provided image. Please try a different image or ensure it's clear." };
      }
      identifiedLocationDescription = imageDescriptionResult.description;
    }
    
    if (!identifiedLocationDescription) {
        // This should not be reached if logic above is correct and validation passed.
        return { error: "Could not determine a location description from the provided inputs." };
    }

    const effectiveOutputLanguage = language;

    let narrativeTextFromWebhook: string;
    try {
      const headers: Record<string, string> = {
        'Style': informationStyle,
        'Prompt': identifiedLocationDescription, // This will now be correctly prioritized
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

    let audioDataUriForResult = "";
    if (narrativeTextFromWebhook && narrativeTextFromWebhook.trim() !== "") {
      console.log("Attempting to generate audio for main narrative. Language:", effectiveOutputLanguage, "Text:", narrativeTextFromWebhook.substring(0,50) + "...");
      const audioResult: NarrationToAudioOutput = await narrationToAudio({
        narratedText: narrativeTextFromWebhook,
        voice: effectiveOutputLanguage,
      });
      if (audioResult.audioDataUri) {
        audioDataUriForResult = audioResult.audioDataUri;
        console.log("Audio generated successfully for main narrative.");
      } else {
        console.warn("Failed to generate audio for the main narrative (narrationToAudio returned empty). Text was:", narrativeTextFromWebhook.substring(0,100) + "...");
      }
    } else {
      console.warn("Skipping audio generation for main narrative: Webhook response text is empty.");
    }


    return {
      narrativeText: narrativeTextFromWebhook,
      audioDataUri: audioDataUriForResult,
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
    // Check if the error is likely from the image description flow
    if (error instanceof Error && (error.message.includes("GEMINI_API_KEY") || error.message.includes("GOOGLE_API_KEY") || error.message.includes("FAILED_PRECONDITION"))) {
        return { error: `AI Service Error: ${error.message}. Please ensure API keys are correctly configured if using image input.` };
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

      console.log("Calling follow-up webhook with headers:", headers);
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
      console.log("Follow-up answer from webhook:", answerTextFromWebhook.substring(0,100) + "...");
    } catch (fetchError) {
      console.error("Error calling webhook for follow-up:", fetchError);
      return { error: `Error contacting the agent for follow-up: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` };
    }

    let audioDataUriForResult = "";
    if(answerTextFromWebhook && answerTextFromWebhook.trim() !== "") {
      console.log("Attempting to generate audio for follow-up. Language:", input.language);
      const audioResult: NarrationToAudioOutput = await narrationToAudio({
        narratedText: answerTextFromWebhook,
        voice: input.language,
      });

      if (audioResult.audioDataUri) {
        audioDataUriForResult = audioResult.audioDataUri;
        console.log("Audio generated successfully for follow-up.");
      } else {
         console.warn("Failed to generate audio for the follow-up answer (narrationToAudio returned empty). Text was:", answerTextFromWebhook.substring(0,100) + "...");
      }
    } else {
       console.warn("Skipping audio generation for follow-up: Webhook response text is empty.");
    }

    return {
      answerText: answerTextFromWebhook,
      answerAudioDataUri: audioDataUriForResult,
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
    return [];
  }

  const client = new Client({});
  try {
    const response = await client.placeAutocomplete({
      params: {
        input: query,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
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


export async function getNearbyTouristSpots(
  latitude: number,
  longitude: number
): Promise<PlaceSuggestion[] | { error: string }> {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is not configured for Nearby Search.");
    return { error: "Nearby places service is not configured." };
  }

  const client = new Client({});
  try {
    const response = await client.placesNearby({
      params: {
        location: { lat: latitude, lng: longitude },
        radius: 2000,
        type: [
            PlaceType2.tourist_attraction,
            PlaceType2.point_of_interest,
            PlaceType2.landmark,
            PlaceType2.museum,
            PlaceType2.park,
            PlaceType2.natural_feature
        ],
        rankby: 'prominence',
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data.status === "OK") {

      const suggestions = response.data.results
        .filter(place => place.name && place.place_id)
        .slice(0, 5)
        .map((place) => ({
          description: place.name!,
          place_id: place.place_id!,
        }));
      return suggestions;
    } else if (response.data.status === "ZERO_RESULTS") {
      return [];
    } else {
      console.error(
        "Google Places Nearby Search API Error:",
        response.data.status,
        response.data.error_message
      );
      return { error: `Nearby search failed: ${response.data.status}` };
    }
  } catch (error) {
    console.error("Error calling Google Places Nearby Search API:", error);
    return { error: "Could not fetch nearby tourist spots." };
  }
}

