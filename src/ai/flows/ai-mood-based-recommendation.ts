'use server';
/**
 * @fileOverview An AI agent that provides liquor and combo recommendations based on a user's mood or occasion.
 *
 * - recommendByMood - A function that handles the recommendation process.
 * - AiMoodBasedRecommendationInput - The input type for the recommendByMood function.
 * - AiMoodBasedRecommendationOutput - The return type for the recommendByMood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiMoodBasedRecommendationInputSchema = z.object({
  mood: z
    .string()
    .describe(
      "The user's current mood or the occasion for which they need recommendations (e.g., 'Pre-copeo', 'Se acabó el trago (Urgente)', 'Cena Romántica', 'After Party')."
    ),
});
export type AiMoodBasedRecommendationInput = z.infer<
  typeof AiMoodBasedRecommendationInputSchema
>;

const AiMoodBasedRecommendationOutputSchema = z.object({
  recommendations: z.object({
    liquors: z
      .array(
        z.object({
          name: z.string().describe('The name of the liquor.'),
          description: z.string().describe('A brief description of the liquor.'),
          category: z.string().describe('The category of the liquor (e.g., Rum, Vodka, Beer).'),
        })
      )
      .describe('A list of recommended liquor products.'),
    combos: z
      .array(
        z.object({
          name: z.string().describe('The name of the combo.'),
          description: z.string().describe('A brief description of the combo.'),
          items: z.array(z.string()).describe('List of items included in the combo.'),
        })
      )
      .describe('A list of recommended liquor combos.'),
  }),
});
export type AiMoodBasedRecommendationOutput = z.infer<
  typeof AiMoodBasedRecommendationOutputSchema
>;

export async function recommendByMood(
  input: AiMoodBasedRecommendationInput
): Promise<AiMoodBasedRecommendationOutput> {
  return aiMoodBasedRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiMoodBasedRecommendationPrompt',
  input: { schema: AiMoodBasedRecommendationInputSchema },
  output: { schema: AiMoodBasedRecommendationOutputSchema },
  prompt: `You are an expert sommelier and party planner for PartyFlow, a 24/7 liquor delivery service. Your goal is to provide personalized liquor and combo recommendations based on the user's mood or occasion.

Consider the following moods/occasions:
- Pre-copeo: Light drinks, mixers, beers.
- Se acabó el trago (Urgente): Popular, quick-to-deliver spirits and beers.
- Cena Romántica: Wine, champagne, fine spirits.
- After Party: Energy drinks, shots, strong cocktails ingredients.

Based on the user's input, provide a list of 3-5 liquor recommendations and 1-2 combo recommendations. Ensure the recommendations are relevant to the mood and describe why they are a good fit.

User's Mood/Occasion: {{{mood}}}`,
});

const aiMoodBasedRecommendationFlow = ai.defineFlow(
  {
    name: 'aiMoodBasedRecommendationFlow',
    inputSchema: AiMoodBasedRecommendationInputSchema,
    outputSchema: AiMoodBasedRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
