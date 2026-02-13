import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ModelResolverService } from './model-resolver.service';
import { LayerProvider, ModelTier } from './providers/ai-provider.interface';

const DEFAULT_LAYERS = [
  'router',
  'summarizer',
  'ux',
  'schema',
  'repair',
  'copy',
  'safety',
  'legacy_validator',
];
const TIERS: ModelTier[] = ['fast', 'balanced', 'quality'];

/**
 * Best-effort startup checks for model routing and provider connectivity.
 * This service never throws to avoid blocking boot in non-critical environments.
 */
@Injectable()
export class ProviderHealthService implements OnModuleInit {
  private readonly logger = new Logger(ProviderHealthService.name);

  constructor(
    private configService: ConfigService,
    private modelResolver: ModelResolverService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled =
      String(this.configService.get('AI_PROVIDER_HEALTHCHECK_ENABLED') ?? 'true') ===
      'true';

    if (!enabled) {
      this.logger.log('Provider health checks disabled');
      return;
    }

    this.validateLayerRoutingConfig();
    await this.checkGroqModels();
    await this.checkGeminiAuthAndModel();
    await this.checkOpenRouterModels();
  }

  private validateLayerRoutingConfig(): void {
    for (const layer of DEFAULT_LAYERS) {
      for (const tier of TIERS) {
        try {
          this.modelResolver.resolveLayerChain({
            layer,
            modelTier: tier,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Layer routing config issue: layer=${layer} tier=${tier} error=${message}`,
          );
        }
      }
    }
  }

  private async checkGroqModels(): Promise<void> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.log('Groq health check skipped (no GROQ_API_KEY)');
      return;
    }

    const client = new OpenAI({
      apiKey,
      baseURL:
        this.configService.get<string>('GROQ_BASE_URL') ||
        'https://api.groq.com/openai/v1',
    });

    try {
      const response = await client.models.list();
      const available = new Set((response.data || []).map((m: any) => String(m.id)));
      this.logMissingConfiguredModels('groq', available);
      this.logger.log(
        `Groq health check passed (models=${available.size || 0})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Groq health check failed: ${message}`);
    }
  }

  private async checkOpenRouterModels(): Promise<void> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      this.logger.log('OpenRouter health check skipped (no OPENROUTER_API_KEY)');
      return;
    }

    const client = new OpenAI({
      apiKey,
      baseURL:
        this.configService.get<string>('OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1',
    });

    try {
      const response = await client.models.list();
      const available = new Set((response.data || []).map((m: any) => String(m.id)));
      this.logMissingConfiguredModels('openrouter', available);
      this.logger.log(
        `OpenRouter health check passed (models=${available.size || 0})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`OpenRouter health check failed: ${message}`);
    }
  }

  private async checkGeminiAuthAndModel(): Promise<void> {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      this.logger.log('Gemini health check skipped (no GEMINI_API_KEY/GOOGLE_API_KEY)');
      return;
    }

    const baseURL =
      this.configService.get<string>('GEMINI_BASE_URL') ||
      'https://generativelanguage.googleapis.com/v1beta/openai/';

    const client = new OpenAI({
      apiKey,
      baseURL,
    });

    let routerModel = '';
    try {
      routerModel = this.modelResolver.resolveModel({
        layer: 'router',
        provider: 'gemini',
        modelTier: 'fast',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Gemini health check model resolution failed for router.fast: ${message}`,
      );
      return;
    }

    try {
      await client.chat.completions.create({
        model: routerModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 4,
        temperature: 0,
        stream: false,
      } as any);

      this.logMissingConfiguredModels('gemini');
      this.logger.log(
        `Gemini health check passed (router.fast model=${routerModel})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Gemini health check failed (model=${routerModel}): ${message}`);
    }
  }

  private logMissingConfiguredModels(
    provider: LayerProvider,
    available?: Set<string>,
  ): void {
    const configured = this.modelResolver.collectConfiguredModels(provider);
    if (configured.length === 0) {
      return;
    }

    if (!available || available.size === 0) {
      this.logger.log(
        `${provider} configured models: ${configured.join(', ')}`,
      );
      return;
    }

    const missing = configured.filter((model) => !available.has(model));
    if (missing.length > 0) {
      this.logger.warn(
        `${provider} configured models not found in provider catalog: ${missing.join(', ')}`,
      );
    }
  }
}
