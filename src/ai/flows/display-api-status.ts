'use server';

/**
 * @fileOverview Checks the status of the Gemini API.
 *
 * - displayApiStatus - A function that checks the Gemini API status.
 * - DisplayApiStatusOutput - The return type for the displayApiStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DisplayApiStatusOutputSchema = z.object({
  isConnected: z.boolean().describe('Whether the Gemini API is connected.'),
  errorMessage: z.string().optional().describe('Error message if the API is not connected.'),
});
export type DisplayApiStatusOutput = z.infer<typeof DisplayApiStatusOutputSchema>;

async function checkGeminiApiStatus(): Promise<DisplayApiStatusOutput> {
  try {
    // Attempt a simple API call to check the connection.
    await ai.generate({
      prompt: 'This is a test prompt to check the API status.',
    });
    return {isConnected: true};
  } catch (error: any) {
    console.error('Gemini API connection error:', error);
    return {
      isConnected: false,
      errorMessage: error.message || 'Failed to connect to Gemini API.',
    };
  }
}

export async function displayApiStatus(): Promise<DisplayApiStatusOutput> {
  return displayApiStatusFlow();
}

const displayApiStatusFlow = ai.defineFlow({
  name: 'displayApiStatusFlow',
  outputSchema: DisplayApiStatusOutputSchema,
}, async () => {
  return await checkGeminiApiStatus();
});