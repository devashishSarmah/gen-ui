import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  AIProviderCapabilities,
  AIGenerationContext,
  ModelTier,
  UISchemaChunk,
} from './ai-provider.interface';
import { ManifestLoaderService } from '../manifest-loader.service';
import { buildUsageMetrics } from '../usage/usage-utils';
import { ModelResolverService } from '../model-resolver.service';

@Injectable()
export class AnthropicProvider extends AIProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  readonly name = 'anthropic';
  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    functionCalling: false,
    jsonMode: false,
    maxTokens: 4096,
    supportsVision: true,
  };

  private client: Anthropic;
  private modelDefault: string;
  private modelFast: string;
  private modelQuality: string;

  constructor(
    private configService: ConfigService,
    private manifestLoader: ManifestLoaderService,
    private modelResolver: ModelResolverService,
  ) {
    super();
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey });
    this.modelDefault =
      this.configService.get('ANTHROPIC_MODEL') || 'claude-3-opus-20240229';
    this.modelFast =
      this.configService.get('ANTHROPIC_MODEL_FAST') || this.modelDefault;
    this.modelQuality =
      this.configService.get('ANTHROPIC_MODEL_QUALITY') || this.modelDefault;
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
    const trace = context.traceId || 'no-trace';
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] anthropic_generate_start model=${model} promptLen=${userPrompt.length}`,
    );

    const messages = [
      ...this.formatConversationHistory(context.conversationHistory),
      { role: 'user', content: userPrompt },
    ] as any[];

    const promptText = [systemPrompt, ...messages.map((m) => String(m.content || ''))].join('\n\n');

    try {
      const stream = await this.client.messages.stream({
        model,
        max_tokens: this.capabilities.maxTokens,
        system: systemPrompt,
        messages,
      } as any);

      let accumulatedContent = '';
      let rawUsage: any = null;
      let partialChunks = 0;

      for await (const chunk of stream as any) {
        if (chunk?.type === 'message_start' && chunk?.message?.usage) {
          rawUsage = chunk.message.usage;
        }

        if (chunk?.type === 'message_delta' && chunk?.usage) {
          rawUsage = { ...rawUsage, ...chunk.usage };
        }

        if (chunk?.type === 'content_block_delta' && chunk?.delta?.type === 'text_delta') {
          const content = chunk.delta.text;
          accumulatedContent += content;
          partialChunks += 1;

          if (partialChunks === 1 || partialChunks % 25 === 0) {
            this.logger.log(
              `[${trace}] anthropic_generate_partial count=${partialChunks} contentLen=${content.length}`,
            );
          }

          yield {
            type: 'partial',
            data: { content },
            done: false,
          };
        }
      }

      const jsonContent = this.extractJsonString(accumulatedContent);
      const uiSchema = JSON.parse(jsonContent);

      const usage = buildUsageMetrics({
        layer: 'schema_generation',
        provider: 'anthropic',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] anthropic_generate_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: uiSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] anthropic_generate_error error=${message}`);
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
    context: AIGenerationContext,
  ): AsyncIterableIterator<UISchemaChunk> {
    const trace = context.traceId || 'no-trace';
    const systemPrompt = this.buildSystemPrompt();
    const updatePrompt = this.buildUpdatePrompt(currentSchema, interaction, context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] anthropic_update_start model=${model} promptLen=${updatePrompt.length}`,
    );

    const promptText = [systemPrompt, updatePrompt].join('\n\n');

    try {
      const stream = await this.client.messages.stream({
        model,
        max_tokens: this.capabilities.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: updatePrompt }],
      } as any);

      let accumulatedContent = '';
      let rawUsage: any = null;
      let partialChunks = 0;

      for await (const chunk of stream as any) {
        if (chunk?.type === 'message_start' && chunk?.message?.usage) {
          rawUsage = chunk.message.usage;
        }

        if (chunk?.type === 'message_delta' && chunk?.usage) {
          rawUsage = { ...rawUsage, ...chunk.usage };
        }

        if (chunk?.type === 'content_block_delta' && chunk?.delta?.type === 'text_delta') {
          const content = chunk.delta.text;
          accumulatedContent += content;
          partialChunks += 1;

          if (partialChunks === 1 || partialChunks % 25 === 0) {
            this.logger.log(
              `[${trace}] anthropic_update_partial count=${partialChunks} contentLen=${content.length}`,
            );
          }

          yield {
            type: 'partial',
            data: { content },
            done: false,
          };
        }
      }

      const jsonContent = this.extractJsonString(accumulatedContent);
      const updatedSchema = JSON.parse(jsonContent);

      const usage = buildUsageMetrics({
        layer: 'schema_update',
        provider: 'anthropic',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] anthropic_update_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: updatedSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] anthropic_update_error error=${message}`);
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

    if (context.uiStateDigest) {
      prompt += `UI state digest:\n${context.uiStateDigest}\n\n`;
    }

    if (context.contextSummary) {
      prompt += `${context.contextSummary}\n\n`;
    }

    if (context.searchResults?.summary) {
      const sources = (context.searchResults.sources || [])
        .map((source) => `- ${source.title ? source.title + ' ' : ''}(${source.url})`)
        .join('\n');
      prompt += `Web search summary:\n${context.searchResults.summary}\n\nSources:\n${sources}\n\n`;
    }

    const routingHints = this.buildRoutingHints(context);
    if (routingHints) {
      prompt += `Routing hints:\n${routingHints}\n\n`;
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

    const summaryContext = context.contextSummary
      ? `\n\nConversation summary:\n${context.contextSummary}`
      : '';

    const uiStateDigest = context.uiStateDigest
      ? `\n\nUI state digest:\n${context.uiStateDigest}`
      : '';

    const uxPlan = context.uxPlan
      ? `\n\nUX Design plan to follow:\n${context.uxPlan}`
      : '';

    const routingHints = this.buildRoutingHints(context);
    const routingContext = routingHints ? `\n\nRouting hints:\n${routingHints}` : '';

    const patchInstruction =
      context.routingDecision?.mode === 'patch'
        ? '\n\nPrefer mode="patch" with minimal JSON Patch operations. Keep unchanged structure untouched.'
        : '';

    return `Current UI schema: ${JSON.stringify(currentSchema)}

User interaction: ${JSON.stringify(interaction)}

User request: ${context.userPrompt}${searchContext}${summaryContext}${uiStateDigest}${uxPlan}${routingContext}${patchInstruction}

Update the UI schema based on the interaction and request.`;
  }

  private buildRoutingHints(context: AIGenerationContext): string | null {
    const decision = context.routingDecision;
    if (!decision) return null;

    const patchHints = (decision.patchHints || []).map((hint) => `- ${hint}`).join('\n');

    return [
      `- mode: ${decision.mode}`,
      `- model tier: ${decision.modelTier}`,
      `- run UX plan: ${decision.runUxPlan ? 'yes' : 'no'}`,
      `- run web search: ${decision.runWebSearch ? 'yes' : 'no'}`,
      ...(patchHints ? [patchHints] : []),
    ].join('\n');
  }

  private resolveModel(context: AIGenerationContext): string {
    const tier: ModelTier = context.routingDecision?.modelTier || 'balanced';
    try {
      return this.modelResolver.resolveModel({
        layer: 'schema',
        provider: 'anthropic',
        modelTier: tier,
      });
    } catch {
      if (tier === 'fast') return this.modelFast;
      if (tier === 'quality') return this.modelQuality;
      return this.modelDefault;
    }
  }

  private formatConversationHistory(history: any[]): any[] {
    const MAX_CONTENT_CHARS = 500;
    return history.map((msg) => {
      let content = msg.content || '';
      if (!content && msg.uiSchema) {
        content = '[UI schema response]';
      }
      if (content.length > MAX_CONTENT_CHARS) {
        content = content.slice(0, MAX_CONTENT_CHARS) + '…[truncated]';
      }
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content,
      };
    });
  }

  private extractJsonString(value: string): string {
    const text = (value || '').trim();

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/i) || text.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch?.[1]) {
      return jsonMatch[1];
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1);
    }

    return text;
  }
}
