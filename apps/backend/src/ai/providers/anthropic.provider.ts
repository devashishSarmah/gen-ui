import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  AIProviderCapabilities,
  AIGenerationContext,
  UISchemaChunk,
} from './ai-provider.interface';
import { ManifestLoaderService } from '../manifest-loader.service';

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

  constructor(
    private configService: ConfigService,
    private manifestLoader: ManifestLoaderService,
  ) {
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
      const message = error instanceof Error ? error.message : String(error);
      yield {
        type: 'error',
        data: { error: message },
        done: true,
      };
    }
  }

  private buildSystemPrompt(): string {
    return this.manifestLoader.getSystemPrompt();
  }

  private buildUserPrompt(context: AIGenerationContext): string {
    let prompt = `User request: ${context.userPrompt}\n\n`;

    if (context.currentUiState) {
      prompt += `Current UI state: ${JSON.stringify(context.currentUiState)}\n\n`;
    }

    if (context.searchResults?.summary) {
      const sources = (context.searchResults.sources || [])
        .map((source) => `- ${source.title ? source.title + ' ' : ''}(${source.url})`)
        .join('\n');
      prompt += `Web search summary:\n${context.searchResults.summary}\n\nSources:\n${sources}\n\n`;
    }

    if (context.uxPlan) {
      prompt += `UX Design plan to follow:\n${context.uxPlan}\n\n`;
    }

    prompt += 'Generate a UI schema to fulfill this request.';

    return prompt;
  }

  private buildUpdatePrompt(currentSchema: any, interaction: any, context: AIGenerationContext): string {
    const searchContext = context.searchResults?.summary
      ? `\n\nWeb search summary:\n${context.searchResults.summary}\n\nSources:\n${(context.searchResults.sources || [])
          .map((source) => `- ${source.title ? source.title + ' ' : ''}(${source.url})`)
          .join('\n')}`
      : '';

    return `Current UI schema: ${JSON.stringify(currentSchema)}

User interaction: ${JSON.stringify(interaction)}

User request: ${context.userPrompt}${searchContext}

Update the UI schema based on the interaction and request.`;
  }

  private formatConversationHistory(history: any[]): any[] {
    return history.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content || JSON.stringify(msg.uiSchema),
    }));
  }
}
