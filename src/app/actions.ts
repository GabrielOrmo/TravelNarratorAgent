// src/app/actions.ts
"use server";

import { z } from "zod";
import { generateNarrative } from "@/ai/flows/narrative-generation";
import type { GenerateNarrativeOutput } from "@/ai/flows/narrative-generation";
import { narrationToAudio } from "@/ai/flows/narration-to-audio";
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";

export const narratorFormSchema = z.object({
  locationDescription: z.string().min(10, {
    message: "Location description must be at least 10 characters.",
  }).max(500, {
    message: "Location description must be at most 500 characters.",
  }),
  informationStyle: z.enum(["Historical", "Curious", "Legends"], {
    required_error: "You need to select an information style.",
  }),
});

export type NarratorFormValues = z.infer<typeof narratorFormSchema>;

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string;
}

export async function generateTravelNarrativeAction(
  values: NarratorFormValues
): Promise<TravelNarrativeResult | { error: string }> {
  try {
    // Validate input again on the server side (optional, as client validates too)
    const validation = narratorFormSchema.safeParse(values);
    if (!validation.success) {
      return { error: "Invalid input: " + validation.error.flatten().fieldErrors };
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
