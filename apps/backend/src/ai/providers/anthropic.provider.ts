import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  AIProviderCapabilities,
  AIGenerationContext,
  UISchemaChunk,
} from './ai-provider.interface';

@Injectable()
export class AnthropicProvider extends AIProvider {
  readonly name = 'anthropic';
  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    functionCalling: false,
    jsonMode: false, // Anthropic doesn't have native JSON mode
    maxTokens: 4096,
    supportsVision: true,
  };

  private client: Anthropic;
  private model: string;

  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey });
    this.model = this.configService.get('ANTHROPIC_MODEL') || 'claude-3-opus-20240229';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.configService.get('ANTHROPIC_API_KEY');
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async *generateUI(context: AIGenerationContext): AsyncIterableIterator<UISchemaChunk> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    try {
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: this.capabilities.maxTokens,
        system: systemPrompt,
        messages: [
          ...this.formatConversationHistory(context.conversationHistory),
          { role: 'user', content: userPrompt },
        ],
      });

      let accumulatedContent = '';

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text;
          accumulatedContent += content;

          yield {
            type: 'partial',
            data: { content },
            done: false,
          };
        }
      }

      // Extract JSON from markdown code blocks if present
      const jsonMatch = accumulatedContent.match(/```json\n([\s\S]*?)\n```/) ||
                        accumulatedContent.match(/```\n([\s\S]*?)\n```/);
      
      const jsonContent = jsonMatch ? jsonMatch[1] : accumulatedContent;
      const uiSchema = JSON.parse(jsonContent);

      yield {
        type: 'complete',
        data: uiSchema,
        done: true,
      };
    } catch (error) {
      yield {
        type: 'error',
        data: { error: error.message },
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
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: this.capabilities.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: updatePrompt }],
      });

      let accumulatedContent = '';

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text;
          accumulatedContent += content;

          yield {
            type: 'partial',
            data: { content },
            done: false,
          };
        }
      }

      const jsonMatch = accumulatedContent.match(/```json\n([\s\S]*?)\n```/) ||
                        accumulatedContent.match(/```\n([\s\S]*?)\n```/);
      
      const jsonContent = jsonMatch ? jsonMatch[1] : accumulatedContent;
      const updatedSchema = JSON.parse(jsonContent);

      yield {
        type: 'complete',
        data: updatedSchema,
        done: true,
      };
    } catch (error) {
      yield {
        type: 'error',
        data: { error: error.message },
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

Always wrap your JSON response in \`\`\`json code blocks.
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
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content || JSON.stringify(msg.uiSchema),
    }));
  }
}
