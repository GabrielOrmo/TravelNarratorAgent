
import { config } from 'dotenv';
config();

import '@/ai/flows/narration-to-audio.ts';
import '@/ai/flows/location-prompt-generation.ts';
import '@/ai/flows/narrative-generation.ts';
import '@/ai/flows/image-to-description-flow.ts'; // Added new flow
