import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIProvider,
  AIProviderCapabilities,
  AIGenerationContext,
  UISchemaChunk,
} from './ai-provider.interface';
import { PromptLoader } from '../prompt-loader';

@Injectable()
export class OpenAIProvider extends AIProvider {
  readonly name = 'openai';
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
    const apiKey = this.configService.get('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
    this.model = this.configService.get('OPENAI_MODEL') || 'gpt-4-turbo-preview';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.configService.get('OPENAI_API_KEY');
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async *generateUI(context: AIGenerationContext): AsyncIterableIterator<UISchemaChunk> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    if (this.useWebSearch()) {
      try {
        const uiSchema = await this.generateWithWebSearch([
          { role: 'system', content: systemPrompt },
          ...this.formatConversationHistory(context.conversationHistory),
          { role: 'user', content: userPrompt },
        ]);

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
      return;
    }

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
        temperature: 1,
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

      // Parse final JSON
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

    if (this.useWebSearch()) {
      try {
        const updatedSchema = await this.generateWithWebSearch([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: updatePrompt },
        ]);

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
      return;
    }

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
    return PromptLoader.getSystemPrompt();
  }

  private useWebSearch(): boolean {
    return this.configService.get('OPENAI_WEB_SEARCH') === 'true';
  }

  private buildWebSearchTool(): any {
    const allowlistRaw = this.configService.get('OPENAI_WEB_SEARCH_ALLOWLIST') || '';
    const allowlist = allowlistRaw
      .split(',')
      .map((domain: string) => domain.trim())
      .filter((domain: string) => domain.length > 0);

    const external = this.configService.get('OPENAI_WEB_SEARCH_EXTERNAL');

    const tool: any = { type: 'web_search' };
    if (allowlist.length > 0) {
      tool.filters = { allowed_domains: allowlist };
    }
    if (external === 'false') {
      tool.external_web_access = false;
    }

    return tool;
  }

  private async generateWithWebSearch(messages: any[]): Promise<any> {
    const response = await this.client.responses.create({
      model: this.model,
      tools: [this.buildWebSearchTool()],
      tool_choice: 'auto',
      input: messages,
    });

    const text = this.extractResponseText(response);
    return JSON.parse(text);
  }

  private extractResponseText(response: any): string {
    if (response?.output_text) {
      return response.output_text;
    }

    const output = response?.output || [];
    for (const item of output) {
      if (item?.type === 'message') {
        const content = item.content || [];
        const outputText = content.find((entry: any) => entry.type === 'output_text');
        if (outputText?.text) {
          return outputText.text;
        }
      }
    }

    throw new Error('No output text returned from web search response');
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
      role: msg.role,
      content: msg.content || JSON.stringify(msg.uiSchema),
    }));
  }
}
