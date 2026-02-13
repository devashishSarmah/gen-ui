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
export class GeminiProvider extends AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  readonly name = 'gemini';
  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    functionCalling: true,
    jsonMode: true,
    maxTokens: 4096,
    supportsVision: true,
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

    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL:
          this.configService.get<string>('GEMINI_BASE_URL') ||
          'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    }

    this.modelDefault =
      this.configService.get<string>('GEMINI_MODEL') ||
      this.configService.get<string>('GEMINI_MODEL_PRO') ||
      'gemini-2.5-pro';

    this.modelFast =
      this.configService.get<string>('GEMINI_MODEL_FAST') ||
      this.configService.get<string>('GEMINI_MODEL') ||
      'gemini-2.0-flash';

    this.modelQuality =
      this.configService.get<string>('GEMINI_MODEL_QUALITY') ||
      this.configService.get<string>('GEMINI_MODEL_PRO') ||
      this.modelDefault;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.client;
  }

  async *generateUI(context: AIGenerationContext): AsyncIterableIterator<UISchemaChunk> {
    const trace = context.traceId || 'no-trace';
    if (!this.client) {
      this.logger.error(`[${trace}] gemini_generate_error provider_not_configured`);
      yield {
        type: 'error',
        data: { error: 'Gemini provider is not configured' },
        done: true,
      };
      return;
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] gemini_generate_start model=${model} promptLen=${userPrompt.length}`,
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
        temperature: 0.2,
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
            `[${trace}] gemini_generate_partial count=${partialChunks} contentLen=${content.length}`,
          );
        }

        yield {
          type: 'partial',
          data: { content },
          done: false,
        };
      }

      const uiSchema = this.parseSchemaFromModelOutput(
        accumulatedContent,
        trace,
        'generate',
      );
      const usage = buildUsageMetrics({
        layer: 'schema_generation',
        provider: 'gemini',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] gemini_generate_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: uiSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] gemini_generate_error error=${message}`);
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
      this.logger.error(`[${trace}] gemini_update_error provider_not_configured`);
      yield {
        type: 'error',
        data: { error: 'Gemini provider is not configured' },
        done: true,
      };
      return;
    }

    const systemPrompt = this.buildSystemPrompt();
    const updatePrompt = this.buildUpdatePrompt(currentSchema, interaction, context);
    const model = this.resolveModel(context);
    this.logger.log(
      `[${trace}] gemini_update_start model=${model} promptLen=${updatePrompt.length}`,
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
        temperature: 0.2,
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
            `[${trace}] gemini_update_partial count=${partialChunks} contentLen=${content.length}`,
          );
        }

        yield {
          type: 'partial',
          data: { content },
          done: false,
        };
      }

      const updatedSchema = this.parseSchemaFromModelOutput(
        accumulatedContent,
        trace,
        'update',
      );
      const usage = buildUsageMetrics({
        layer: 'schema_update',
        provider: 'gemini',
        model,
        promptText,
        completionText: accumulatedContent,
        rawUsage,
        configService: this.configService,
      });

      this.logger.log(
        `[${trace}] gemini_update_complete partialChunks=${partialChunks} totalTokens=${usage.totalTokens}`,
      );

      yield {
        type: 'complete',
        data: updatedSchema,
        done: true,
        meta: { usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${trace}] gemini_update_error error=${message}`);
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
        provider: 'gemini',
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

  private parseSchemaFromModelOutput(
    rawContent: string,
    trace: string,
    phase: 'generate' | 'update',
  ): any {
    const normalized = String(rawContent || '').trim();
    const candidates = this.buildJsonCandidates(normalized);
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch (error) {
        lastError = error;
      }

      try {
        return JSON.parse(this.repairJsonString(candidate));
      } catch (error) {
        lastError = error;
      }
    }

    const detail =
      lastError instanceof Error ? lastError.message : String(lastError || 'Unknown parse error');
    const preview = this.safePreview(normalized);

    this.logger.warn(
      `[${trace}] gemini_${phase}_json_parse_failed detail=${detail} preview=${preview}`,
    );

    throw new Error(`Gemini returned invalid JSON (${phase})`);
  }

  private buildJsonCandidates(content: string): string[] {
    const candidates: string[] = [];
    const trimmed = String(content || '').trim();
    if (trimmed) {
      candidates.push(trimmed);
    }

    const extracted = this.extractJsonString(trimmed);
    if (extracted && extracted !== trimmed) {
      candidates.push(extracted);
    }

    return [...new Set(candidates)];
  }

  private extractJsonString(value: string): string {
    const text = (value || '').trim();

    const fenced =
      text.match(/```json\s*([\s\S]*?)\s*```/i) ||
      text.match(/```\s*([\s\S]*?)\s*```/);
    if (fenced?.[1]) {
      return fenced[1].trim();
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1).trim();
    }

    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      return text.slice(firstBracket, lastBracket + 1).trim();
    }

    return text;
  }

  private repairJsonString(value: string): string {
    let repaired = String(value || '').trim();

    // Normalize special quote characters and remove invisible leading marks.
    repaired = repaired
      .replace(/^\uFEFF/, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    // Remove trailing commas before object/array closes.
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    // Quote unquoted object keys: { key: ... } -> { "key": ... }
    repaired = repaired.replace(
      /([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)(\s*:)/g,
      '$1"$2"$3',
    );

    // Quote bareword string values: "type": paragraph -> "type": "paragraph"
    repaired = repaired.replace(
      /(:\s*)([A-Za-z_][A-Za-z0-9_-]*)(\s*[,}\]])/g,
      (_match, prefix: string, token: string, suffix: string) => {
        if (/^(true|false|null)$/i.test(token)) {
          return `${prefix}${token.toLowerCase()}${suffix}`;
        }
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(token)) {
          return `${prefix}${token}${suffix}`;
        }
        return `${prefix}"${token}"${suffix}`;
      },
    );

    return repaired;
  }

  private safePreview(value: string): string {
    return value
      .replace(/\s+/g, ' ')
      .slice(0, 220)
      .replace(/"/g, "'");
  }
}
