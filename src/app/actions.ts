
// src/app/actions.ts
"use server";

import { generateNarrative } from "@/ai/flows/narrative-generation";
import type { GenerateNarrativeOutput } from "@/ai/flows/narrative-generation";
import { narrationToAudio } from "@/ai/flows/narration-to-audio";
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { generateImageDescription } from "@/ai/flows/image-to-description-flow"; // New import
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow"; // New import
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string;
  locationDescription: string; // Add this to display it in the UI
}

export async function generateTravelNarrativeAction(
  values: NarratorFormValues
): Promise<TravelNarrativeResult | { error: string }> {
  try {
    // Validate input again on the server side
    const validation = narratorFormSchema.safeParse(values);
    if (!validation.success) {
      const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      return { error: "Invalid input: " + errorMessages };
    }

    const { imageDataUri, informationStyle } = values;

    // 1. Get description from image
    const imageDescriptionResult: GenerateImageDescriptionOutput = await generateImageDescription({
      imageDataUri,
    });

    if (!imageDescriptionResult || !imageDescriptionResult.description) {
      return { error: "Failed to get description from the provided image. Please try a different image or ensure it's clear." };
    }
    const identifiedLocationDescription = imageDescriptionResult.description;

    // 2. Generate Narrative Text using the description from the image
    const narrativeResult: GenerateNarrativeOutput = await generateNarrative({
      locationDescription: identifiedLocationDescription,
      informationStyle,
    });

    if (!narrativeResult.narrativeText) {
      return { error: "Failed to generate narrative text based on the image." };
    }
    
    // 3. Convert Narrative to Audio
    const audioResult: NarrationToAudioOutput = await narrationToAudio({
      narratedText: narrativeResult.narrativeText,
      voice: "default", 
    });

    if (!audioResult.audioDataUri) {
      return { error: "Failed to generate audio." };
    }

    return {
      narrativeText: narrativeResult.narrativeText,
      audioDataUri: audioResult.audioDataUri,
      locationDescription: identifiedLocationDescription, // Return the identified location
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
