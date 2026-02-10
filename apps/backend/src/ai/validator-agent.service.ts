import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PromptLoader } from './prompt-loader';
import { AIGenerationContext } from './providers/ai-provider.interface';

@Injectable()
export class ValidatorAgentService {
  private client: OpenAI | null = null;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENROUTER_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }
    this.model =
      this.configService.get('OPENROUTER_VALIDATOR_MODEL') ||
      this.configService.get('OPENROUTER_MODEL') ||
      'arcee-ai/trinity-large-preview:free';
  }

  async fixSchema(schema: any, context?: AIGenerationContext): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    const systemPrompt =
      'You are a JSON schema validator and fixer for a UI renderer. ' +
      'Return ONLY valid JSON that matches the renderer schema. ' +
      'If the input is already valid, return it unchanged.';

    const prompt = [
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
    ] as any;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: prompt,
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content || '';
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
