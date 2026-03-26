import { config } from 'dotenv';
config();

import '@/ai/flows/identify-dog-breed-from-image.ts';
import '@/ai/flows/suggest-manual-breed-selection-on-error.ts';
import '@/ai/flows/review-capture-with-fallback.ts';
import '@/ai/flows/dog-breed-recognition.ts';