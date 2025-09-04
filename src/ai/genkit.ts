import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure environment variables are loaded
if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_GENAI_API_KEY or GOOGLE_API_KEY environment variable is required');
}

export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY,
  })],
  model: process.env.GOOGLE_GENAI_MODEL || 'googleai/gemini-1.5-flash',
});
