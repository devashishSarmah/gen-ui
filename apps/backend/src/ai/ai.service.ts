import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIGenerationContext, UISchemaChunk } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { AgentOrchestratorService } from './agent-orchestrator.service';

/**
 * Preferred fallback order when the primary provider fails with a
 * retryable error (429, 5xx, timeout, etc.).
 */
const FALLBACK_ORDER: string[] = [
  'gemini',
  'openrouter',
  'openai',
  'anthropic',
  'groq',
];

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private providers: Map<string, AIProvider>;
  private defaultProvider: string;

  constructor(
    private configService: ConfigService,
    private openaiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
    private openrouterProvider: OpenRouterProvider,
    private geminiProvider: GeminiProvider,
    private groqProvider: GroqProvider,
    private orchestrator: AgentOrchestratorService,
  ) {
    this.providers = new Map();
    this.providers.set('openai', this.openaiProvider);
    this.providers.set('anthropic', this.anthropicProvider);
    this.providers.set('openrouter', this.openrouterProvider);
    this.providers.set('gemini', this.geminiProvider);
    this.providers.set('groq', this.groqProvider);

    this.defaultProvider =
      this.configService.get('AI_LAYER_DEFAULT_PROVIDER') || 'gemini';
  }

  /**
   * Get available providers
   */
  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];

    for (const [name, provider] of this.providers.entries()) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }

    return available;
  }

  /**
   * Generate UI from user prompt.
   * The orchestrator handles the full pipeline:
   *   enrich → UX plan → provider generate → validate → repair
   * Falls back to alternate providers on retryable errors (429, 5xx).
   */
  async *generateUI(
    context: AIGenerationContext,
    providerName?: string,
  ): AsyncIterableIterator<UISchemaChunk> {
    const primary = this.getProvider(providerName);
    this.logger.log(
      `[${context.traceId || 'no-trace'}] generateUI provider=${primary.name} requestedProvider=${providerName || 'default'}`,
    );

    yield* this.withFallback(
      primary,
      providerName,
      (provider) => this.orchestrator.generateUI(context, provider),
      context.traceId,
    );
  }

  /**
   * Update UI based on interaction.
   * The orchestrator handles the full pipeline:
   *   enrich → provider update → validate → repair
   * Falls back to alternate providers on retryable errors (429, 5xx).
   */
  async *updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext,
    providerName?: string,
  ): AsyncIterableIterator<UISchemaChunk> {
    const primary = this.getProvider(providerName);
    this.logger.log(
      `[${context.traceId || 'no-trace'}] updateUI provider=${primary.name} requestedProvider=${providerName || 'default'}`,
    );

    yield* this.withFallback(
      primary,
      providerName,
      (provider) => this.orchestrator.updateUI(currentSchema, interaction, context, provider),
      context.traceId,
    );
  }

  // -- Fallback logic -------------------------------------------------------

  /**
   * Run a provider-backed generator. Streams chunks from the primary in
   * real-time. If the primary stream finishes WITHOUT a 'complete' chunk and
   * ANY error looks retryable (429, 5xx, timeout), buffer-retry with
   * fallback providers.
   *
   * On the happy path, streaming is zero-overhead (no buffering).
   */
  private async *withFallback(
    primary: AIProvider,
    requestedName: string | undefined,
    run: (provider: AIProvider) => AsyncIterableIterator<UISchemaChunk>,
    traceId?: string,
  ): AsyncIterableIterator<UISchemaChunk> {
    const trace = traceId || 'no-trace';

    // ── Primary attempt: stream in real-time ──────────────────────────
    const bufferedErrors: UISchemaChunk[] = [];
    let hasComplete = false;

    for await (const chunk of run(primary)) {
      if (chunk.type === 'complete') {
        hasComplete = true;
        yield chunk;
      } else if (chunk.type === 'error') {
        bufferedErrors.push(chunk);
        // Don't yield errors yet — might be retried
      } else {
        // partial chunks stream through immediately
        yield chunk;
      }
    }

    if (hasComplete) return; // success — done

    // ── Primary failed — check if retryable ───────────────────────────
    const retryableError = bufferedErrors.find((c) => this.isRetryable(c));
    if (!retryableError) {
      // Non-retryable errors — yield them and exit
      for (const err of bufferedErrors) yield err;
      return;
    }

    // ── Fallback attempts (buffered — can't partially stream then retry) ──
    const fallbacks = await this.getFallbackProviders(primary.name);
    if (fallbacks.length === 0) {
      this.logger.warn(`[${trace}] fallback_none_available primary=${primary.name}`);
      for (const err of bufferedErrors) yield err;
      return;
    }

    this.logger.warn(
      `[${trace}] fallback_triggered primary=${primary.name} error="${String(retryableError.data?.error || '')}" candidates=${fallbacks.map((f) => f.name).join(',')}`,
    );

    for (const fallback of fallbacks) {
      this.logger.log(`[${trace}] fallback_attempt provider=${fallback.name}`);
      const fbResult = await this.collectStream(run(fallback));

      if (fbResult.hasComplete) {
        this.logger.log(`[${trace}] fallback_success provider=${fallback.name}`);
        yield* fbResult.chunks;
        return;
      }

      const fbRetryable = fbResult.chunks.find(
        (c) => c.type === 'error' && this.isRetryable(c),
      );
      if (!fbRetryable) {
        this.logger.warn(`[${trace}] fallback_non_retryable provider=${fallback.name}`);
        yield* fbResult.chunks;
        return;
      }

      this.logger.warn(
        `[${trace}] fallback_failed provider=${fallback.name} error="${String(fbRetryable.data?.error || '')}"`,
      );
    }

    // All fallbacks exhausted
    this.logger.error(
      `[${trace}] fallback_exhausted tried=${[primary.name, ...fallbacks.map((f) => f.name)].join(',')}`,
    );
    for (const err of bufferedErrors) yield err;
  }

  /**
   * Drain an async iterator into an array, tracking whether a 'complete' chunk appeared.
   */
  private async collectStream(
    stream: AsyncIterableIterator<UISchemaChunk>,
  ): Promise<{ chunks: UISchemaChunk[]; hasComplete: boolean }> {
    const chunks: UISchemaChunk[] = [];
    let hasComplete = false;
    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.type === 'complete') hasComplete = true;
    }
    return { chunks, hasComplete };
  }

  /**
   * Check if an error chunk represents a retryable failure
   * (rate-limit, server error, timeout, network issue).
   */
  private isRetryable(chunk: UISchemaChunk): boolean {
    const err = String(chunk.data?.error || '');
    const code = String(chunk.data?.code || '');
    return (
      /429|rate.?limit/i.test(err) ||
      /^5\d{2}\b/.test(err) ||
      /timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|socket hang up/i.test(err) ||
      /429|rate.?limit/i.test(code) ||
      /^5\d{2}\b/.test(code)
    );
  }

  /**
   * Build an ordered list of available fallback providers, excluding the failed one.
   */
  private async getFallbackProviders(excludeName: string): Promise<AIProvider[]> {
    const result: AIProvider[] = [];
    for (const name of FALLBACK_ORDER) {
      if (name === excludeName) continue;
      const provider = this.providers.get(name);
      if (provider && (await provider.isAvailable())) {
        result.push(provider);
      }
    }
    return result;
  }

  private getProvider(providerName?: string): AIProvider {
    const name = providerName || this.defaultProvider;
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(`AI provider '${name}' not found`);
    }

    return provider;
  }
}
