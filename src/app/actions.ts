
// src/app/actions.ts
"use server";

import { generateNarrative } from "@/ai/flows/narrative-generation";
import type { GenerateNarrativeOutput } from "@/ai/flows/narrative-generation";
import { narrationToAudio } from "@/ai/flows/narration-to-audio";
import type { NarrationToAudioOutput } from "@/ai/flows/narration-to-audio";
import { generateImageDescription } from "@/ai/flows/image-to-description-flow";
import type { GenerateImageDescriptionOutput } from "@/ai/flows/image-to-description-flow";
import { generateFollowUpAnswer } from "@/ai/flows/follow-up-question-flow";
import type { GenerateFollowUpOutput } from "@/ai/flows/follow-up-question-flow";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

export interface TravelNarrativeResult {
  narrativeText: string;
  audioDataUri: string;
  locationDescription: string;
}

export async function generateTravelNarrativeAction(
  rawValues: NarratorFormValues
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

export interface FollowUpInput {
  currentNarrativeText: string;
  locationDescription: string;
  userQuestion: string;
}

export interface FollowUpResult {
  answerText: string;
  answerAudioDataUri: string;
}

export async function generateFollowUpAnswerAction(
  input: FollowUpInput
): Promise<FollowUpResult | { error: string }> {
  try {
    if (!input.userQuestion.trim()) {
      return { error: "Follow-up question cannot be empty." };
    }

    const followUpAnswerResult: GenerateFollowUpOutput = await generateFollowUpAnswer({
      currentNarrativeText: input.currentNarrativeText,
      locationDescription: input.locationDescription,
      userQuestion: input.userQuestion,
    });

    if (!followUpAnswerResult.answerText) {
      return { error: "Failed to generate an answer for the follow-up question." };
    }

    const audioResult: NarrationToAudioOutput = await narrationToAudio({
      narratedText: followUpAnswerResult.answerText,
      voice: "default",
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
