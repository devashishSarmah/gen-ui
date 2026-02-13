import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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
export class GroqProvider extends AIProvider {
  private readonly logger = new Logger(GroqProvider.name);
  readonly name = 'groq';
  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    jsonMode: true,
    maxTokens: 4096,
    supportsVision: false,
  };

  private client: OpenAI | null = null;
  private modelDefault: string;
  private modelFast: string;
  private modelQuality: string;

  constructor(
    private configService: ConfigService,
    private manifestLoader: ManifestLoaderService,
    private modelResolver: ModelResolverService,
  ) {
    super();
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL:
          this.configService.get<string>('GROQ_BASE_URL') ||
          'https://api.groq.com/openai/v1',
      });
    }

    this.modelDefault =
      this.configService.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
    this.modelFast =
      this.configService.get<string>('GROQ_MODEL_FAST') ||
      this.configService.get<string>('GROQ_MODEL_ROUTER_FAST') ||
      'llama-3.1-8b-instant';
    this.modelQuality =
      this.configService.get<string>('GROQ_MODEL_QUALITY') || this.modelDefault;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.configService.get('GROQ_API_KEY');
  }

  async *generateUI(context: AIGenerationContext): AsyncIterableIterator<UISchemaChunk> {
    const trace = context.traceId || 'no-trace';
    if (!this.client) {
      this.logger.error(`[${trace}] groq_generate_error provider_not_configured`);
      yield {
        type: 'error',
        data: { error: 'Groq provider is not configured' },
        done: true,
      };
      return;
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] groq_generate_start model=${model} promptLen=${userPrompt.length}`,
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.formatConversationHistory(context.conversationHistory),
      { role: 'user', content: userPrompt },
    ] as any[];

    const promptText = messages.map((m) => String(m.content || '')).join('\n\n');

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        response_format: { type: 'json_object' },
        stream: true,
        stream_options: { include_usage: true } as any,
        temperature: 0.5,
      } as any);

      let accumulatedContent = '';
      let rawUsage: any = null;
      let partialChunks = 0;

      for await (const chunk of stream as any) {
        const content = chunk?.choices?.[0]?.delta?.content || '';
        accumulatedContent += content;
        partialChunks += 1;

        if (chunk?.usage) {
          rawUsage = chunk.usage;
        }

        if (partialChunks === 1 || partialChunks % 25 === 0) {
          this.logger.log(
            `[${trace}] groq_generate_partial count=${partialChunks} contentLen=${content.length}`,
          );
        }

        yield {
          type: 'partial',
          data: { content },
          done: false,
        };
      }

      const uiSchema = JSON.parse(accumulatedContent);
      const usage = buildUsageMetrics({
        layer: 'schema_generation',
        provider: 'groq',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] groq_generate_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: uiSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] groq_generate_error error=${message}`);
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
    if (!this.client) {
      this.logger.error(`[${trace}] groq_update_error provider_not_configured`);
      yield {
        type: 'error',
        data: { error: 'Groq provider is not configured' },
        done: true,
      };
      return;
    }

    const systemPrompt = this.buildSystemPrompt();
    const updatePrompt = this.buildUpdatePrompt(currentSchema, interaction, context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] groq_update_start model=${model} promptLen=${updatePrompt.length}`,
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: updatePrompt },
    ] as any[];

    const promptText = messages.map((m) => String(m.content || '')).join('\n\n');

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        response_format: { type: 'json_object' },
        stream: true,
        stream_options: { include_usage: true } as any,
        temperature: 0.5,
      } as any);

      let accumulatedContent = '';
      let rawUsage: any = null;
      let partialChunks = 0;

      for await (const chunk of stream as any) {
        const content = chunk?.choices?.[0]?.delta?.content || '';
        accumulatedContent += content;
        partialChunks += 1;

        if (chunk?.usage) {
          rawUsage = chunk.usage;
        }

        if (partialChunks === 1 || partialChunks % 25 === 0) {
          this.logger.log(
            `[${trace}] groq_update_partial count=${partialChunks} contentLen=${content.length}`,
          );
        }

        yield {
          type: 'partial',
          data: { content },
          done: false,
        };
      }

      const updatedSchema = JSON.parse(accumulatedContent);
      const usage = buildUsageMetrics({
        layer: 'schema_update',
        provider: 'groq',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] groq_update_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: updatedSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] groq_update_error error=${message}`);
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
        provider: 'groq',
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
      return { role: msg.role, content };
    });
  }
}
