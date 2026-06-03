'use server';
/**
 * @fileOverview Un agente de IA que proporciona recomendaciones de licores y combos basadas en el estado de ánimo o la ocasión del usuario.
 *
 * - recommendByMood - Una función que maneja el proceso de recomendación.
 * - AiMoodBasedRecommendationInput - El tipo de entrada para la función recommendByMood.
 * - AiMoodBasedRecommendationOutput - El tipo de retorno para la función recommendByMood.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiMoodBasedRecommendationInputSchema = z.object({
  mood: z
    .string()
    .describe(
      "El estado de ánimo actual del usuario o la ocasión para la cual necesitan recomendaciones (ej., 'Pre-copeo', 'Se acabó el trago (Urgente)', 'Cena Romántica', 'After Party')."
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
          name: z.string().describe('El nombre del licor.'),
          description: z.string().describe('Una breve descripción del licor en español.'),
          category: z.string().describe('La categoría del licor (ej., Ron, Vodka, Cerveza).'),
        })
      )
      .describe('Una lista de productos de licor recomendados.'),
    combos: z
      .array(
        z.object({
          name: z.string().describe('El nombre del combo.'),
          description: z.string().describe('Una breve descripción del combo en español.'),
          items: z.array(z.string()).describe('Lista de artículos incluidos en el combo.'),
        })
      )
      .describe('Una lista de combos de licor recomendados.'),
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
  prompt: `Eres un sommelier experto y planificador de fiestas para PartyFlow, un servicio de entrega de licores 24/7. Tu objetivo es proporcionar recomendaciones personalizadas de licores y combos basadas en el estado de ánimo u ocasión del usuario.

RESPONDE SIEMPRE EN ESPAÑOL.

Considera los siguientes estados de ánimo/ocasiones:
- Pre-copeo: Bebidas ligeras, mezcladores, cervezas.
- Se acabó el trago (Urgente): Destilados populares y rápidos de entregar, cervezas.
- Cena Romántica: Vino, champagne, destilados finos.
- After Party: Bebidas energéticas, shots, ingredientes para cócteles fuertes.

Basado en la entrada del usuario, proporciona una lista de 3-5 recomendaciones de licores y 1-2 recomendaciones de combos. Asegúrate de que las recomendaciones sean relevantes para el estado de ánimo y describe por qué encajan bien.

Estado de Ánimo/Ocasión del Usuario: {{{mood}}}`,
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
