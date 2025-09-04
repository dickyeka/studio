'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating images from a product image and a prompt.
 *
 * It takes a product image (as a data URI), a prompt, and optional model details as input.
 * It then uses the Gemini Pro Vision API to generate a set of unique images based on the prompt and input image.
 *
 * - generateImagesFromPrompt - The main function that triggers the image generation flow.
 * - GenerateImagesFromPromptInput - The input type for the generateImagesFromPrompt function.
 * - GenerateImagesFromPromptOutput - The return type for the generateImagesFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagesFromPromptInputSchema = z.object({
  productImageDataUri: z
    .string()
    .describe(
      "A product image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The prompt to use for image generation.'),
  modelGender: z.enum(['Male', 'Female']).optional().describe('The gender of the model, if applicable.'),
  modelAvatar: z.string().optional().describe('The data URI of the model avatar, if applicable.'),
  numImages: z.number().min(1).max(6).default(6).describe('The number of images to generate.'),
});
export type GenerateImagesFromPromptInput = z.infer<typeof GenerateImagesFromPromptInputSchema>;

const GenerateImagesFromPromptOutputSchema = z.object({
  generatedImages: z.array(z.string()).describe('An array of generated image data URIs.'),
});
export type GenerateImagesFromPromptOutput = z.infer<typeof GenerateImagesFromPromptOutputSchema>;

export async function generateImagesFromPrompt(
  input: GenerateImagesFromPromptInput
): Promise<GenerateImagesFromPromptOutput> {
  return generateImagesFromPromptFlow(input);
}

const generateImagesFromPromptFlow = ai.defineFlow(
  {
    name: 'generateImagesFromPromptFlow',
    inputSchema: GenerateImagesFromPromptInputSchema,
    outputSchema: GenerateImagesFromPromptOutputSchema,
  },
  async input => {
    const generatedImages: string[] = [];
    const imagePromises = [];

    for (let i = 0; i < input.numImages; i++) {
        imagePromises.push(ai.generate({
            model: 'googleai/gemini-2.0-flash-image-preview',
            prompt: [
              {media: {url: input.productImageDataUri}},
              {text: input.prompt},
            ],
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
        }));
    }

    const results = await Promise.all(imagePromises);

    for (const result of results) {
        if (result.media) {
            generatedImages.push(result.media.url);
        }
    }

    return {generatedImages};
  }
);
