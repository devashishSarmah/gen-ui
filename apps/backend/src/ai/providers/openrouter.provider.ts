import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIProvider,
  AIProviderCapabilities,
  AIGenerationContext,
  UISchemaChunk,
} from './ai-provider.interface';

@Injectable()
export class OpenRouterProvider extends AIProvider {
  readonly name = 'openrouter';
  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    jsonMode: true,
    maxTokens: 4096,
    supportsVision: true,
  };

  private client: OpenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get('OPENROUTER_API_KEY');
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.model =
      this.configService.get('OPENROUTER_MODEL') || 'arcee-ai/trinity-large-preview:free';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.configService.get('OPENROUTER_API_KEY');
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async *generateUI(context: AIGenerationContext): AsyncIterableIterator<UISchemaChunk> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.formatConversationHistory(context.conversationHistory),
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        stream: true,
        temperature: 0.7,
      });

      let accumulatedContent = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        accumulatedContent += content;

        yield {
          type: 'partial',
          data: { content },
          done: false,
        };
      }

      const uiSchema = JSON.parse(accumulatedContent);

      yield {
        type: 'complete',
        data: uiSchema,
        done: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      yield {
        type: 'error',
        data: { error: message },
        done: true,
      };
    }
  }

  async *updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext
  ): AsyncIterableIterator<UISchemaChunk> {
    const systemPrompt = this.buildSystemPrompt();
    const updatePrompt = this.buildUpdatePrompt(currentSchema, interaction, context);

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: updatePrompt },
        ],
        response_format: { type: 'json_object' },
        stream: true,
        temperature: 0.7,
      });

      let accumulatedContent = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        accumulatedContent += content;

        yield {
          type: 'partial',
          data: { content },
          done: false,
        };
      }

      const updatedSchema = JSON.parse(accumulatedContent);

      yield {
        type: 'complete',
        data: updatedSchema,
        done: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      yield {
        type: 'error',
        data: { error: message },
        done: true,
      };
    }
  }

  private buildSystemPrompt(): string {
    return `You are a UI generation assistant. Generate JSON schemas for Angular components based on user requests.

Your responses must be valid JSON with this structure:
{
  "schemaVersion": "1.0",
  "type": "form" | "dashboard" | "wizard" | "list" | "detail",
  "components": [...],
  "layout": {...},
  "validation": {...},
  "events": {...}
}

Available component types:
- text-input, number-input, select, checkbox, radio, textarea
- button, link
- card, panel, grid, flexbox
- table, list
- heading, paragraph, divider

Always include proper validation, event handlers, and accessibility attributes.`;
  }

  private buildUserPrompt(context: AIGenerationContext): string {
    let prompt = `User request: ${context.userPrompt}\n\n`;

    if (context.currentUiState) {
      prompt += `Current UI state: ${JSON.stringify(context.currentUiState)}\n\n`;
    }

    prompt += 'Generate a UI schema to fulfill this request.';

    return prompt;
  }

  private buildUpdatePrompt(currentSchema: any, interaction: any, context: AIGenerationContext): string {
    return `Current UI schema: ${JSON.stringify(currentSchema)}

User interaction: ${JSON.stringify(interaction)}

User request: ${context.userPrompt}

Update the UI schema based on the interaction and request.`;
  }

  private formatConversationHistory(history: any[]): any[] {
    return history.map((msg) => ({
      role: msg.role,
      content: msg.content || JSON.stringify(msg.uiSchema),
    }));
  }
}
