import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  LayerProvider,
  ModelTier,
  AIUsageMetrics,
} from './providers/ai-provider.interface';
import { buildUsageMetrics } from './usage/usage-utils';
import {
  LayerModelConfigError,
  ModelResolverService,
  ResolvedProviderModel,
} from './model-resolver.service';

export interface LayerLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LayerLLMRequest {
  layer: string;
  traceId?: string;
  messages: LayerLLMMessage[];
  responseType?: 'text' | 'json';
  modelTier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
  providerOverride?: LayerProvider;
  modelOverride?: string;
  allowFallback?: boolean;
}

export interface LayerLLMResponse {
  provider: LayerProvider;
  model: string;
  text: string;
  json?: any;
  usage: AIUsageMetrics;
}

@Injectable()
export class LayerLLMService {
  private readonly logger = new Logger(LayerLLMService.name);

  private openaiClient: OpenAI | null = null;
  private openrouterClient: OpenAI | null = null;
  private geminiClient: OpenAI | null = null;
  private groqClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor(
    private configService: ConfigService,
    private modelResolver: ModelResolverService,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }

    const openrouterKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (openrouterKey) {
      this.openrouterClient = new OpenAI({
        apiKey: openrouterKey,
        baseURL:
          this.configService.get<string>('OPENROUTER_BASE_URL') ||
          'https://openrouter.ai/api/v1',
      });
    }

    const geminiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');
    if (geminiKey) {
      this.geminiClient = new OpenAI({
        apiKey: geminiKey,
        baseURL:
          this.configService.get<string>('GEMINI_BASE_URL') ||
          'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    }

    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      this.groqClient = new OpenAI({
        apiKey: groqKey,
        baseURL:
          this.configService.get<string>('GROQ_BASE_URL') ||
          'https://api.groq.com/openai/v1',
      });
    }

    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
    }
  }

  async complete(request: LayerLLMRequest): Promise<LayerLLMResponse | null> {
    const trace = request.traceId || 'no-trace';
    const allowFallback = request.allowFallback !== false;

    const chainResolution = this.modelResolver.resolveLayerChain({
      layer: request.layer,
      modelTier: request.modelTier,
      providerOverride: request.providerOverride,
      modelOverride: request.modelOverride,
    });

    const pending: ResolvedProviderModel[] = [...chainResolution.chain];
    const attempted = new Set<string>();
    let lastError: unknown = null;

    this.logger.log(
      `[${trace}] LayerLLM start layer=${request.layer} tier=${chainResolution.modelTier} responseType=${request.responseType || 'text'} providers=${pending.map((entry) => `${entry.provider}:${entry.model}`).join('>')}`,
    );

    while (pending.length > 0) {
      const candidate = pending.shift();
      if (!candidate) {
        continue;
      }

      const attemptKey = `${candidate.provider}:${candidate.model}`;
      if (attempted.has(attemptKey)) {
        continue;
      }
      attempted.add(attemptKey);

      if (!this.isProviderConfigured(candidate.provider)) {
        this.logger.warn(
          `[${trace}] LayerLLM provider_not_configured layer=${request.layer} provider=${candidate.provider}`,
        );
        continue;
      }

      try {
        const response =
          candidate.provider === 'gemini'
            ? await this.completeWithGeminiRetry(request, candidate.model)
            : await this.completeWithProvider(
                request,
                candidate.provider,
                candidate.model,
              );

        this.logger.log(
          `[${trace}] LayerLLM success layer=${request.layer} provider=${candidate.provider} model=${candidate.model} tokens=${response.usage?.totalTokens || 0}`,
        );
        return response;
      } catch (error) {
        lastError = error;

        if (this.isOpenRouterInvalidModelError(candidate.provider, error)) {
          throw new LayerModelConfigError(
            `Invalid OpenRouter model '${candidate.model}' for layer=${request.layer}. Use namespaced model IDs like 'google/gemini-2.5-pro'.`,
          );
        }

        this.logger.warn(
          `[${trace}] LayerLLM failed layer=${request.layer} provider=${candidate.provider} model=${candidate.model}`,
          error as any,
        );

        if (!allowFallback) {
          break;
        }

        if (
          candidate.provider === 'gemini' &&
          this.isRateLimitError(error)
        ) {
          this.promoteOpenRouterFallback(pending, chainResolution.chain, attempted);
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    this.logger.warn(
      `[${trace}] LayerLLM no_available_provider layer=${request.layer}`,
    );
    return null;
  }

  isProviderConfigured(provider: LayerProvider): boolean {
    switch (provider) {
      case 'openai':
        return !!this.openaiClient;
      case 'openrouter':
        return !!this.openrouterClient;
      case 'gemini':
        return !!this.geminiClient;
      case 'groq':
        return !!this.groqClient;
      case 'anthropic':
        return !!this.anthropicClient;
      default:
        return false;
    }
  }

  private async completeWithGeminiRetry(
    request: LayerLLMRequest,
    model: string,
  ): Promise<LayerLLMResponse> {
    const trace = request.traceId || 'no-trace';
    const maxRetries = 2;

    let attempt = 0;
    while (true) {
      try {
        return await this.completeWithProvider(request, 'gemini', model);
      } catch (error) {
        if (!this.isRateLimitError(error) || attempt >= maxRetries) {
          throw error;
        }

        const delayMs = this.computeBackoffDelayMs(attempt);
        this.logger.warn(
          `[${trace}] LayerLLM gemini_rate_limited retry=${attempt + 1}/${maxRetries} delayMs=${delayMs}`,
        );
        await this.sleep(delayMs);
        attempt += 1;
      }
    }
  }

  private async completeWithProvider(
    request: LayerLLMRequest,
    provider: LayerProvider,
    model: string,
  ): Promise<LayerLLMResponse> {
    if (provider === 'anthropic') {
      return this.completeWithAnthropic(request, model);
    }

    return this.completeWithOpenAICompatible(
      request,
      provider as Exclude<LayerProvider, 'anthropic'>,
      model,
    );
  }

  private async completeWithOpenAICompatible(
    request: LayerLLMRequest,
    provider: Exclude<LayerProvider, 'anthropic'>,
    model: string,
  ): Promise<LayerLLMResponse> {
    const client =
      provider === 'openai'
        ? this.openaiClient
        : provider === 'openrouter'
          ? this.openrouterClient
          : provider === 'groq'
            ? this.groqClient
            : this.geminiClient;

    if (!client) {
      throw new Error(`Provider '${provider}' is not configured`);
    }

    const completion = await client.chat.completions.create({
      model,
      messages: request.messages as any,
      response_format:
        request.responseType === 'json' ? { type: 'json_object' } : undefined,
      temperature: request.temperature ?? 0,
      max_tokens: request.maxTokens,
      stream: false,
    } as any);

    const text = this.extractOpenAIText(completion);
    const json =
      request.responseType === 'json' ? this.parseJsonStrict(text || '{}') : undefined;

    const promptText = request.messages.map((msg) => msg.content).join('\n\n');

    const usage = buildUsageMetrics({
      layer: request.layer,
      provider,
      model,
      promptText,
      completionText: text,
      rawUsage: (completion as any).usage,
      configService: this.configService,
    });

    return {
      provider,
      model,
      text,
      json,
      usage,
    };
  }

  private async completeWithAnthropic(
    request: LayerLLMRequest,
    model: string,
  ): Promise<LayerLLMResponse> {
    if (!this.anthropicClient) {
      throw new Error("Provider 'anthropic' is not configured");
    }

    const systemPrompt = request.messages
      .filter((msg) => msg.role === 'system')
      .map((msg) => msg.content)
      .join('\n\n');

    const messagePayload = request.messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    const payload = {
      model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0,
      system: systemPrompt || undefined,
      messages:
        messagePayload.length > 0
          ? (messagePayload as any)
          : ([{ role: 'user', content: 'Continue.' }] as any),
    };

    const response = await this.anthropicClient.messages.create(payload as any);

    const text = (response.content || [])
      .filter((part: any) => part?.type === 'text')
      .map((part: any) => part.text)
      .join('')
      .trim();

    const normalizedText = text || '{}';
    const json =
      request.responseType === 'json'
        ? this.parseJsonStrict(this.extractJsonString(normalizedText))
        : undefined;

    const promptText = request.messages.map((msg) => msg.content).join('\n\n');

    const usage = buildUsageMetrics({
      layer: request.layer,
      provider: 'anthropic',
      model,
      promptText,
      completionText: normalizedText,
      rawUsage: (response as any).usage,
      configService: this.configService,
    });

    return {
      provider: 'anthropic',
      model,
      text: normalizedText,
      json,
      usage,
    };
  }

  private extractOpenAIText(response: any): string {
    const content = response?.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .join('')
        .trim();
    }

    return '';
  }

  private parseJsonStrict(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      const extracted = this.extractJsonString(text);
      return JSON.parse(extracted);
    }
  }

  private extractJsonString(text: string): string {
    const trimmed = (text || '').trim();
    const fencedMatch =
      trimmed.match(/```json\n([\s\S]*?)\n```/i) ||
      trimmed.match(/```\n([\s\S]*?)\n```/);
    if (fencedMatch?.[1]) {
      return fencedMatch[1];
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }

    return trimmed;
  }

  private promoteOpenRouterFallback(
    pending: ResolvedProviderModel[],
    sourceChain: ResolvedProviderModel[],
    attempted: Set<string>,
  ): void {
    const openRouterCandidate = sourceChain.find(
      (entry) => entry.provider === 'openrouter',
    );

    if (!openRouterCandidate) {
      return;
    }

    const key = `${openRouterCandidate.provider}:${openRouterCandidate.model}`;
    const alreadyPending = pending.some(
      (entry) => `${entry.provider}:${entry.model}` === key,
    );

    if (attempted.has(key) || alreadyPending) {
      return;
    }

    pending.unshift(openRouterCandidate);
  }

  private isRateLimitError(error: unknown): boolean {
    const status = this.errorStatus(error);
    if (status === 429) return true;

    const text = this.errorText(error);
    return text.includes('rate limit') || text.includes('too many requests');
  }

  private isOpenRouterInvalidModelError(
    provider: LayerProvider,
    error: unknown,
  ): boolean {
    if (provider !== 'openrouter') {
      return false;
    }

    const status = this.errorStatus(error);
    if (status !== 400) {
      return false;
    }

    const text = this.errorText(error);
    return (
      text.includes('model') &&
      (text.includes('invalid') ||
        text.includes('not found') ||
        text.includes('unknown'))
    );
  }

  private errorStatus(error: unknown): number | null {
    const raw = Number(
      (error as any)?.status ??
        (error as any)?.statusCode ??
        (error as any)?.response?.status ??
        (error as any)?.error?.status,
    );

    if (!Number.isFinite(raw) || raw <= 0) {
      return null;
    }

    return raw;
  }

  private errorText(error: unknown): string {
    return String(
      (error as any)?.message ||
        (error as any)?.error?.message ||
        (error as any)?.response?.data?.error?.message ||
        '',
    ).toLowerCase();
  }

  private computeBackoffDelayMs(attempt: number): number {
    const base = 400 * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * 250);
    return base + jitter;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
