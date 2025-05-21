import { config } from 'dotenv';
config();

import '@/ai/flows/narration-to-audio.ts';
import '@/ai/flows/location-prompt-generation.ts';
import '@/ai/flows/narrative-generation.ts';