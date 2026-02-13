import { Injectable } from '@nestjs/common';
import { PromptLoader } from './prompt-loader';
import { AIGenerationContext } from './providers/ai-provider.interface';
import { LayerLLMService } from './layer-llm.service';

/**
 * Legacy LLM validator/fixer (optional path).
 * Uses layer-based provider selection instead of hardcoded provider.
 */
@Injectable()
export class ValidatorAgentService {
  constructor(private layerLLMService: LayerLLMService) {}

  async fixSchema(schema: any, context?: AIGenerationContext): Promise<any | null> {
    const systemPrompt =
      'You are a JSON schema validator and fixer for a UI renderer. ' +
      'Return ONLY valid JSON that matches the renderer schema. ' +
      'If the input is already valid, return it unchanged.';

    const response = await this.layerLLMService.complete({
      layer: 'legacy_validator',
      traceId: context?.traceId,
      modelTier: 'balanced',
      responseType: 'json',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'system',
          content: `Renderer schema rules:\n${PromptLoader.getSystemPrompt()}`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            userPrompt: context?.userPrompt,
            schema,
          }),
        },
      ],
    });

    return response?.json || null;
  }
}
