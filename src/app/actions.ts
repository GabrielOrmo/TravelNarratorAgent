
// src/app/actions.ts
"use server";

import { generateNarrative } from "@/ai/flows/narrative-generation";
import type { GenerateNarrativeOutput } from "@/ai/flows/narrative-generation";
import { narrationToAudio } from "@/ai/flows/narration-to-audio";
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { generateImageDescription } from "@/ai/flows/image-to-description-flow";
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string;
  locationDescription: string;
}

export async function generateTravelNarrativeAction(
  rawValues: NarratorFormValues // Changed from 'values' to 'rawValues' for clarity
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
      // This case should ideally be caught by client-side and schema validation
      return { error: "Please provide either a location search term or an image." };
    }
    
    const narrativeResult: GenerateNarrativeOutput = await generateNarrative({
      locationDescription: identifiedLocationDescription,
      informationStyle,
    });

    if (!narrativeResult.narrativeText) {
      return { error: "Failed to generate narrative text." };
    }
    
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
      locationDescription: identifiedLocationDescription,
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
