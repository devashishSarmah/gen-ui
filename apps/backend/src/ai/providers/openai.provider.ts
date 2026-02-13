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
export class OpenAIProvider extends AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  readonly name = 'openai';
  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    jsonMode: true,
    maxTokens: 4096,
    supportsVision: true,
  };

  private client: OpenAI;
  private modelDefault: string;
  private modelFast: string;
  private modelQuality: string;

  constructor(
    private configService: ConfigService,
    private manifestLoader: ManifestLoaderService,
    private modelResolver: ModelResolverService,
  ) {
    super();
    const apiKey = this.configService.get('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
    this.modelDefault = this.configService.get('OPENAI_MODEL') || 'gpt-4-turbo-preview';
    this.modelFast = this.configService.get('OPENAI_MODEL_FAST') || this.modelDefault;
    this.modelQuality =
      this.configService.get('OPENAI_MODEL_QUALITY') || this.modelDefault;
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
    const trace = context.traceId || 'no-trace';
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] openai_generate_start model=${model} promptLen=${userPrompt.length} webSearch=${this.useWebSearch(context)}`,
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.formatConversationHistory(context.conversationHistory),
      { role: 'user', content: userPrompt },
    ] as any[];

    const promptText = messages.map((m) => String(m.content || '')).join('\n\n');

    if (this.useWebSearch(context)) {
      try {
        const result = await this.generateWithWebSearch(messages, context);
        this.logger.log(
          `[${trace}] openai_generate_websearch_complete totalTokens=${result.usage?.totalTokens || 0}`,
        );

        yield {
          type: 'complete',
          data: result.schema,
          done: true,
          meta: { usage: result.usage },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[${trace}] openai_generate_websearch_error error=${message}`);
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
        model,
        messages,
        response_format: { type: 'json_object' },
        stream: true,
        stream_options: { include_usage: true } as any,
        temperature: 1,
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
            `[${trace}] openai_generate_partial count=${partialChunks} contentLen=${content.length}`,
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
        provider: 'openai',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] openai_generate_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: uiSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] openai_generate_error error=${message}`);
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
      `[${trace}] openai_update_start model=${model} promptLen=${updatePrompt.length} webSearch=${this.useWebSearch(context)}`,
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: updatePrompt },
    ] as any[];

    const promptText = messages.map((m) => String(m.content || '')).join('\n\n');

    if (this.useWebSearch(context)) {
      try {
        const result = await this.generateWithWebSearch(messages, context);
        this.logger.log(
          `[${trace}] openai_update_websearch_complete totalTokens=${result.usage?.totalTokens || 0}`,
        );

        yield {
          type: 'complete',
          data: result.schema,
          done: true,
          meta: { usage: result.usage },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[${trace}] openai_update_websearch_error error=${message}`);
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
        model,
        messages,
        response_format: { type: 'json_object' },
        stream: true,
        stream_options: { include_usage: true } as any,
        temperature: 0.7,
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
            `[${trace}] openai_update_partial count=${partialChunks} contentLen=${content.length}`,
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
        provider: 'openai',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] openai_update_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: updatedSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] openai_update_error error=${message}`);
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

  private useWebSearch(context?: AIGenerationContext): boolean {
    if (context?.routingDecision?.runWebSearch === false) {
      return false;
    }
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

  private async generateWithWebSearch(
    messages: any[],
    context: AIGenerationContext,
  ): Promise<{ schema: any; usage: any }> {
    const response = await this.client.responses.create({
      model: this.resolveModel(context),
      tools: [this.buildWebSearchTool()],
      tool_choice: 'auto',
      input: messages,
    });

    const text = this.extractResponseText(response);
    const schema = JSON.parse(text);

    const promptText = messages.map((m) => String(m.content || '')).join('\n\n');
    const usage = buildUsageMetrics({
      layer: 'schema_generation',
      provider: 'openai',
      model: this.resolveModel(context),
      promptText,
      completionText: text,
      rawUsage: (response as any).usage,
      configService: this.configService,
    });

    return { schema, usage };
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
        provider: 'openai',
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
