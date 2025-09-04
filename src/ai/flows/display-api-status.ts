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
    // Check if API key is available
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        isConnected: false,
        errorMessage: 'API key not found in environment variables',
      };
    }

    // Attempt a simple API call to check the connection.
    const response = await ai.generate({
      prompt: 'This is a test prompt to check the API status.',
    });

    if (response) {
      return {isConnected: true};
    } else {
      return {
        isConnected: false,
        errorMessage: 'API call succeeded but no response received',
      };
    }
  } catch (error: any) {
    console.error('Gemini API connection error:', error);
    let errorMessage = 'Failed to connect to Gemini API.';

    if (error.message) {
      errorMessage = error.message;
    }

    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      errorMessage = 'Invalid or missing API key';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network connection error';
    }

    return {
      isConnected: false,
      errorMessage,
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
