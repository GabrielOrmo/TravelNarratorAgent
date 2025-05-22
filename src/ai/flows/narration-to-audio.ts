// src/ai/flows/narration-to-audio.ts
'use server';
/**
 * @fileOverview Converts narrated text into an audio file using Google Cloud Text-to-Speech.
 *
 * - narrationToAudio - A function that converts text to speech.
 * - NarrationToAudioInput - The input type for the narrationToAudio function.
 * - NarrationToAudioOutput - The return type for the narrationToAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {TextToSpeechClient, type protos} from '@google-cloud/text-to-speech';

const NarrationToAudioInputSchema = z.object({
  narratedText: z.string().describe('The text to be converted to speech.'),
  voice: z.string().describe('The language code for the audio (e.g., "en", "es", "fr"). This will be used to select an appropriate voice.'),
});
export type NarrationToAudioInput = z.infer<typeof NarrationToAudioInputSchema>;

const NarrationToAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio file as a data URI (e.g., data:audio/mp3;base64,...). Empty if generation failed.'),
});
export type NarrationToAudioOutput = z.infer<typeof NarrationToAudioOutputSchema>;

export async function narrationToAudio(input: NarrationToAudioInput): Promise<NarrationToAudioOutput> {
  return narrationToAudioFlow(input);
}

// Helper function to select a voice name based on language code
function getVoiceSelection(languageCode: string): protos.google.cloud.texttospeech.v1.IVoiceSelectionParams {
  // Default to NEUTRAL gender, letting Google pick a standard voice for the language.
  // For more specific voices, you can expand this mapping.
  // Examples:
  // 'en': { languageCode: 'en-US', name: 'en-US-Standard-C' }, // Female
  // 'es': { languageCode: 'es-ES', name: 'es-ES-Standard-A' }, // Female
  // 'fr': { languageCode: 'fr-FR', name: 'fr-FR-Standard-A' }, // Female
  
  const baseLanguage = languageCode.split('-')[0].toLowerCase();

  switch (baseLanguage) {
    case 'en':
      return { languageCode: 'en-US', name: 'en-US-Standard-C' }; // Standard Female
    case 'es':
      return { languageCode: 'es-ES', name: 'es-ES-Standard-A' }; // Standard Female
    case 'fr':
      return { languageCode: 'fr-FR', name: 'fr-FR-Standard-A' }; // Standard Female
    default:
      // Fallback for other languages - may or may not have a good default 'Standard' voice.
      // Using languageCode directly and a neutral gender is a safer bet for broader language support.
      return { languageCode: languageCode, ssmlGender: 'FEMALE' as protos.google.cloud.texttospeech.v1.SsmlVoiceGender };
  }
}

const narrationToAudioFlow = ai.defineFlow(
  {
    name: 'narrationToAudioFlow',
    inputSchema: NarrationToAudioInputSchema,
    outputSchema: NarrationToAudioOutputSchema,
  },
  async (input: NarrationToAudioInput): Promise<NarrationToAudioOutput> => {
    if (!input.narratedText || input.narratedText.trim() === "") {
        console.warn("Narration text is empty. Skipping TTS generation.");
        return { audioDataUri: "" };
    }

    try {
      const client = new TextToSpeechClient();

      const voiceSelection = getVoiceSelection(input.voice);

      const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { text: input.narratedText },
        voice: voiceSelection,
        audioConfig: { audioEncoding: 'MP3' },
      };

      const [response] = await client.synthesizeSpeech(request);

      if (response.audioContent) {
        const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
        const audioDataUri = `data:audio/mp3;base64,${audioBase64}`;
        return { audioDataUri };
      } else {
        console.error('Google Text-to-Speech API did not return audio content.');
        return { audioDataUri: '' };
      }
    } catch (error) {
      console.error('Error calling Google Text-to-Speech API:', error);
      // It's important to return the defined output schema, even in case of error.
      return { audioDataUri: '' }; 
    }
  }
);
