import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LayerProvider, ModelTier } from './providers/ai-provider.interface';

const MODEL_TIERS: ModelTier[] = ['fast', 'balanced', 'quality'];

export interface ResolveLayerModelInput {
  layer: string;
  modelTier?: ModelTier;
  providerOverride?: LayerProvider;
  modelOverride?: string;
}

export interface ResolveModelInput {
  layer: string;
  provider: LayerProvider;
  modelTier?: ModelTier;
  modelOverride?: string;
}

export interface ResolvedProviderModel {
  provider: LayerProvider;
  model: string;
}

export interface ResolvedLayerModelChain {
  layer: string;
  modelTier: ModelTier;
  primary: ResolvedProviderModel;
  fallbacks: ResolvedProviderModel[];
  chain: ResolvedProviderModel[];
}

export class LayerModelConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayerModelConfigError';
  }
}

/**
 * Resolves provider/model for each layer+tier with provider-specific model guards.
 */
@Injectable()
export class ModelResolverService {
  constructor(private configService: ConfigService) {}

  resolveLayerChain(input: ResolveLayerModelInput): ResolvedLayerModelChain {
    const modelTier = input.modelTier || 'balanced';
    const layerKey = this.toEnvSegment(input.layer);
    const tierKey = modelTier.toUpperCase();

    const primary =
      input.providerOverride ||
      this.readProvider(
        this.readValue(`AI_LAYER_${layerKey}_PROVIDER_${tierKey}`) ||
          this.readValue(`AI_LAYER_${layerKey}_PROVIDER`) ||
          this.readValue('AI_LAYER_DEFAULT_PROVIDER') ||
          'gemini',
      ) ||
      'gemini';

    const fallbackProviders = this.uniqueProviders([
      ...this.parseProviderList(
        this.readValue(`AI_LAYER_${layerKey}_FALLBACK_PROVIDERS_${tierKey}`),
      ),
      ...this.parseProviderList(
        this.readValue(`AI_LAYER_${layerKey}_FALLBACK_PROVIDERS`),
      ),
      ...this.parseProviderList(this.readValue('AI_LAYER_FALLBACK_PROVIDERS')),
      // Conservative safety net in case config is incomplete
      'openrouter',
      'groq',
      'openai',
      'anthropic',
      'gemini',
    ]).filter((provider) => provider !== primary);

    const primaryResolved: ResolvedProviderModel = {
      provider: primary,
      model: this.resolveModel({
        layer: input.layer,
        provider: primary,
        modelTier,
        modelOverride: input.modelOverride,
      }),
    };

    const fallbacks: ResolvedProviderModel[] = fallbackProviders.map((provider) => ({
      provider,
      model: this.resolveModel({
        layer: input.layer,
        provider,
        modelTier,
      }),
    }));

    return {
      layer: input.layer,
      modelTier,
      primary: primaryResolved,
      fallbacks,
      chain: [primaryResolved, ...fallbacks],
    };
  }

  resolveModel(input: ResolveModelInput): string {
    const modelTier = input.modelTier || 'balanced';
    const layerKey = this.toEnvSegment(input.layer);
    const tierKey = modelTier.toUpperCase();
    const providerKey = input.provider.toUpperCase();

    const configuredPrimaryProvider =
      this.readProvider(
        this.readValue(`AI_LAYER_${layerKey}_PROVIDER_${tierKey}`) ||
          this.readValue(`AI_LAYER_${layerKey}_PROVIDER`),
      ) || null;

    const candidates: string[] = [];
    if (input.modelOverride) {
      candidates.push(input.modelOverride);
    }

    // Layer keys, provider-specific first.
    candidates.push(
      this.readValue(`AI_LAYER_${layerKey}_${providerKey}_MODEL_${tierKey}`) || '',
      this.readValue(`AI_LAYER_${layerKey}_MODEL_${tierKey}_${providerKey}`) || '',
      this.readValue(`AI_LAYER_${layerKey}_${providerKey}_MODEL`) || '',
      this.readValue(`AI_LAYER_${layerKey}_MODEL_${providerKey}`) || '',
    );

    // Generic layer-tier model only when this provider is selected for this layer+tier.
    if (!configuredPrimaryProvider || configuredPrimaryProvider === input.provider) {
      candidates.push(this.readValue(`AI_LAYER_${layerKey}_MODEL_${tierKey}`) || '');
      candidates.push(this.readValue(`AI_LAYER_${layerKey}_MODEL`) || '');
    }

    // Provider-centric layer keys (supports GROQ_MODEL_ROUTER_FAST and OPENROUTER_SCHEMA_MODEL_QUALITY).
    candidates.push(
      this.readValue(`${providerKey}_MODEL_${layerKey}_${tierKey}`) || '',
      this.readValue(`${providerKey}_MODEL_${layerKey}`) || '',
      this.readValue(`${providerKey}_${layerKey}_MODEL_${tierKey}`) || '',
      this.readValue(`${providerKey}_${layerKey}_MODEL`) || '',
      this.readValue(`${providerKey}_${layerKey}`) || '',
    );

    // Provider defaults.
    candidates.push(...this.providerDefaultCandidates(input.provider, modelTier));

    const selected = candidates
      .map((value) => this.interpolateEnv(value))
      .map((value) => String(value || '').trim())
      .find((value) => value.length > 0);

    if (!selected) {
      throw new LayerModelConfigError(
        `No model configured for layer=${input.layer} tier=${modelTier} provider=${input.provider}`,
      );
    }

    this.assertProviderModelCompatibility(input.provider, selected, input.layer, modelTier);
    return selected;
  }

  collectConfiguredModels(provider: LayerProvider): string[] {
    const result = new Set<string>();
    const prefix = provider.toUpperCase();
    const discoveredLayers = this.discoverLayerNames();

    for (const layer of discoveredLayers) {
      for (const tier of MODEL_TIERS) {
        try {
          const model = this.resolveModel({ layer, provider, modelTier: tier });
          result.add(model);
        } catch {
          // Best effort only
        }
      }
    }

    for (const [key, raw] of Object.entries(process.env)) {
      if (!key.includes('MODEL')) continue;
      const upper = key.toUpperCase();
      const matchesProvider =
        upper.startsWith(`${prefix}_`) ||
        upper.includes(`_${prefix}_`) ||
        upper.endsWith(`_${prefix}`);

      if (!matchesProvider) continue;

      const value = this.interpolateEnv(String(raw || '')).trim();
      if (!value) continue;

      try {
        this.assertProviderModelCompatibility(provider, value, 'health', 'balanced');
        result.add(value);
      } catch {
        // Ignore incompatible values here; health check will log them separately.
      }
    }

    return [...result];
  }

  normalizeProvider(providerRaw: string | undefined | null): LayerProvider | null {
    if (!providerRaw) return null;
    const value = String(providerRaw).trim().toLowerCase();

    if (value === 'gemini' || value === 'google') return 'gemini';
    if (value === 'groq') return 'groq';
    if (value === 'openrouter') return 'openrouter';
    if (value === 'openai') return 'openai';
    if (value === 'anthropic') return 'anthropic';

    return null;
  }

  private readProvider(providerRaw: string | undefined | null): LayerProvider | null {
    return this.normalizeProvider(this.interpolateEnv(String(providerRaw || '')));
  }

  private parseProviderList(value: string | undefined): LayerProvider[] {
    if (!value) return [];
    return value
      .split(',')
      .map((provider) => this.normalizeProvider(provider))
      .filter((provider): provider is LayerProvider => !!provider);
  }

  private uniqueProviders(providers: LayerProvider[]): LayerProvider[] {
    return [...new Set(providers)];
  }

  private providerDefaultCandidates(
    provider: LayerProvider,
    tier: ModelTier,
  ): string[] {
    switch (provider) {
      case 'groq': {
        if (tier === 'fast') {
          return [
            this.readValue('GROQ_MODEL_FAST') || '',
            this.readValue('GROQ_MODEL_ROUTER_FAST') || '',
            this.readValue('GROQ_MODEL') || '',
            'llama-3.1-8b-instant',
          ];
        }
        if (tier === 'quality') {
          return [
            this.readValue('GROQ_MODEL_QUALITY') || '',
            this.readValue('GROQ_MODEL_REPAIR_FAST') || '',
            this.readValue('GROQ_MODEL') || '',
            'llama-3.3-70b-versatile',
          ];
        }
        return [
          this.readValue('GROQ_MODEL_BALANCED') || '',
          this.readValue('GROQ_MODEL') || '',
          'llama-3.3-70b-versatile',
        ];
      }
      case 'gemini': {
        if (tier === 'fast') {
          return [
            this.readValue('GEMINI_MODEL_FAST') || '',
            this.readValue('GEMINI_MODEL_FLASH') || '',
            this.readValue('GEMINI_MODEL') || '',
            'gemini-2.0-flash',
          ];
        }
        if (tier === 'quality') {
          return [
            this.readValue('GEMINI_MODEL_QUALITY') || '',
            this.readValue('GEMINI_MODEL_PRO') || '',
            this.readValue('GEMINI_MODEL') || '',
            'gemini-2.5-pro',
          ];
        }
        return [
          this.readValue('GEMINI_MODEL_BALANCED') || '',
          this.readValue('GEMINI_MODEL_FLASH') || '',
          this.readValue('GEMINI_MODEL') || '',
          this.readValue('GEMINI_MODEL_PRO') || '',
          'gemini-2.5-flash',
        ];
      }
      case 'openrouter': {
        if (tier === 'fast') {
          return [
            this.readValue('OPENROUTER_MODEL_FAST') || '',
            this.readValue('OPENROUTER_MODEL') || '',
            'openai/gpt-4o-mini',
          ];
        }
        if (tier === 'quality') {
          return [
            this.readValue('OPENROUTER_MODEL_QUALITY') || '',
            this.readValue('OPENROUTER_MODEL') || '',
            'google/gemini-2.5-pro',
          ];
        }
        return [
          this.readValue('OPENROUTER_MODEL_BALANCED') || '',
          this.readValue('OPENROUTER_MODEL') || '',
          'google/gemini-2.5-flash',
        ];
      }
      case 'openai': {
        if (tier === 'fast') {
          return [
            this.readValue('OPENAI_MODEL_FAST') || '',
            this.readValue('OPENAI_MODEL') || '',
            'gpt-4o-mini',
          ];
        }
        if (tier === 'quality') {
          return [
            this.readValue('OPENAI_MODEL_QUALITY') || '',
            this.readValue('OPENAI_MODEL') || '',
            'gpt-4.1',
          ];
        }
        return [
          this.readValue('OPENAI_MODEL_BALANCED') || '',
          this.readValue('OPENAI_MODEL') || '',
          'gpt-4.1-mini',
        ];
      }
      case 'anthropic': {
        if (tier === 'fast') {
          return [
            this.readValue('ANTHROPIC_MODEL_FAST') || '',
            this.readValue('ANTHROPIC_MODEL') || '',
            'claude-3-5-haiku-latest',
          ];
        }
        if (tier === 'quality') {
          return [
            this.readValue('ANTHROPIC_MODEL_QUALITY') || '',
            this.readValue('ANTHROPIC_MODEL') || '',
            'claude-3-7-sonnet-latest',
          ];
        }
        return [
          this.readValue('ANTHROPIC_MODEL_BALANCED') || '',
          this.readValue('ANTHROPIC_MODEL') || '',
          'claude-3-5-sonnet-latest',
        ];
      }
      default:
        return [];
    }
  }

  private assertProviderModelCompatibility(
    provider: LayerProvider,
    model: string,
    layer: string,
    tier: ModelTier,
  ): void {
    const trimmed = String(model || '').trim();

    if (!trimmed) {
      throw new LayerModelConfigError(
        `Empty model resolved for layer=${layer} tier=${tier} provider=${provider}`,
      );
    }

    if (trimmed.includes('${')) {
      throw new LayerModelConfigError(
        `Unresolved env interpolation in model '${trimmed}' for layer=${layer} tier=${tier} provider=${provider}`,
      );
    }

    switch (provider) {
      case 'gemini':
        if (!/^gemini-/i.test(trimmed)) {
          throw new LayerModelConfigError(
            `Gemini provider requires gemini-* model IDs. Got '${trimmed}' for layer=${layer} tier=${tier}`,
          );
        }
        break;
      case 'openrouter':
        if (!trimmed.includes('/')) {
          throw new LayerModelConfigError(
            `OpenRouter models must be namespaced (e.g. provider/model). Got '${trimmed}' for layer=${layer} tier=${tier}`,
          );
        }
        break;
      case 'groq':
        if (/^gemini-/i.test(trimmed) || trimmed.includes('/')) {
          throw new LayerModelConfigError(
            `Groq provider received incompatible model '${trimmed}' for layer=${layer} tier=${tier}`,
          );
        }
        break;
      case 'openai':
        if (/^gemini-/i.test(trimmed)) {
          throw new LayerModelConfigError(
            `OpenAI provider received Gemini model '${trimmed}' for layer=${layer} tier=${tier}`,
          );
        }
        break;
      case 'anthropic':
        if (/^gemini-/i.test(trimmed)) {
          throw new LayerModelConfigError(
            `Anthropic provider received Gemini model '${trimmed}' for layer=${layer} tier=${tier}`,
          );
        }
        break;
      default:
        break;
    }
  }

  private readValue(key: string): string | undefined {
    const direct = this.configService.get<string>(key);
    if (direct !== undefined && direct !== null && String(direct).trim().length > 0) {
      return String(direct);
    }

    const env = process.env[key];
    if (env !== undefined && env !== null && String(env).trim().length > 0) {
      return String(env);
    }

    return undefined;
  }

  private interpolateEnv(value: string): string {
    if (!value) return '';

    let out = String(value);
    for (let i = 0; i < 5; i++) {
      const next = out.replace(/\$\{([A-Z0-9_]+)\}/g, (_match, key) => {
        const replacement = this.readValue(String(key)) || '';
        return replacement;
      });

      if (next === out) break;
      out = next;
    }

    return out;
  }

  private discoverLayerNames(): string[] {
    return [
      'router',
      'summarizer',
      'ux',
      'schema',
      'repair',
      'copy',
      'safety',
      'legacy_validator',
    ];
  }

  private toEnvSegment(value: string): string {
    return String(value || '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }
}
