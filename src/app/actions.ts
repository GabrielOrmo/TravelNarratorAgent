
// src/app/actions.ts
"use server";

import { generateNarrative } from "@/ai/flows/narrative-generation";
import type { GenerateNarrativeOutput } from "@/ai/flows/narrative-generation";
import { narrationToAudio } from "@/ai/flows/narration-to-audio";
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string;
}

export async function generateTravelNarrativeAction(
  values: NarratorFormValues
): Promise<TravelNarrativeResult | { error: string }> {
  try {
    // Validate input again on the server side
    const validation = narratorFormSchema.safeParse(values);
    if (!validation.success) {
      // Construct a more detailed error message string
      const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      return { error: "Invalid input: " + errorMessages };
    }

    const { locationDescription, informationStyle } = values;

    // 1. Generate Narrative Text
    const narrativeResult: GenerateNarrativeOutput = await generateNarrative({
      locationDescription,
      informationStyle,
    });

    if (!narrativeResult.narrativeText) {
      return { error: "Failed to generate narrative text." };
    }
    
    // 2. Convert Narrative to Audio
    // The current AI flow for narrationToAudio doesn't use a specific voice from user preferences yet.
    // We'll use a generic voice for now.
    const audioResult: NarrationToAudioOutput = await narrationToAudio({
      narratedText: narrativeResult.narrativeText,
      voice: "default", // Placeholder, can be enhanced later
    });

    if (!audioResult.audioDataUri) {
      return { error: "Failed to generate audio." };
    }

    return {
      narrativeText: narrativeResult.narrativeText,
      audioDataUri: audioResult.audioDataUri,
    };
  } catch (error) {
    console.error("Error in generateTravelNarrativeAction:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
