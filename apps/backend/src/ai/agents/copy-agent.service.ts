import { Injectable } from '@nestjs/common';
import {
  AIGenerationContext,
  AIUsageMetrics,
} from '../providers/ai-provider.interface';
import { LayerLLMService } from '../layer-llm.service';

export interface CopyGenerationResult {
  labels: Record<string, string>;
  helperText: Record<string, string>;
  usage?: AIUsageMetrics;
}

/**
 * Optional copy agent for compact microcopy polish.
 */
@Injectable()
export class CopyAgentService {
  constructor(private layerLLMService: LayerLLMService) {}

  async generateCopy(input: {
    sections: string[];
    context: AIGenerationContext;
  }): Promise<CopyGenerationResult> {
    const fallback = this.deterministicFallback(input.sections);

    try {
      const response = await this.layerLLMService.complete({
        layer: 'copy',
        traceId: input.context.traceId,
        modelTier: 'fast',
        responseType: 'json',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You generate compact UI microcopy. Return ONLY JSON with keys: labels(object) and helperText(object). No emojis. Keep labels <= 3 words and helper text <= 10 words.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              userPrompt: input.context.userPrompt,
              sections: input.sections,
            }),
          },
        ],
      });

      if (!response?.json) {
        return fallback;
      }

      return {
        labels: this.ensureStringMap(response.json.labels),
        helperText: this.ensureStringMap(response.json.helperText),
        usage: response.usage,
      };
    } catch {
      return fallback;
    }
  }

  private deterministicFallback(sections: string[]): CopyGenerationResult {
    const labels: Record<string, string> = {};
    const helperText: Record<string, string> = {};

    for (const section of sections) {
      const clean = String(section || '')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim();

      labels[section] = clean || 'Section';
      helperText[section] = 'Review details and adjust options.';
    }

    return { labels, helperText };
  }

  private ensureStringMap(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object') {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(value as Record<string, any>)) {
      result[String(key)] = String(val || '').trim();
    }
    return result;
  }
}
