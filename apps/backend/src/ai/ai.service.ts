import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIGenerationContext, UISchemaChunk } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { AgentOrchestratorService } from './agent-orchestrator.service';

@Injectable()
export class AIService {
  private providers: Map<string, AIProvider>;
  private defaultProvider: string;

  constructor(
    private configService: ConfigService,
    private openaiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
    private openrouterProvider: OpenRouterProvider,
    private orchestrator: AgentOrchestratorService,
  ) {
    this.providers = new Map();
    this.providers.set('openai', this.openaiProvider);
    this.providers.set('anthropic', this.anthropicProvider);
    this.providers.set('openrouter', this.openrouterProvider);

    this.defaultProvider = this.configService.get('DEFAULT_AI_PROVIDER') || 'openai';
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
   */
  async *generateUI(
    context: AIGenerationContext,
    providerName?: string,
  ): AsyncIterableIterator<UISchemaChunk> {
    const provider = this.getProvider(providerName);
    yield* this.orchestrator.generateUI(context, provider);
  }

  /**
   * Update UI based on interaction.
   * The orchestrator handles the full pipeline:
   *   enrich → provider update → validate → repair
   */
  async *updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext,
    providerName?: string,
  ): AsyncIterableIterator<UISchemaChunk> {
    const provider = this.getProvider(providerName);
    yield* this.orchestrator.updateUI(currentSchema, interaction, context, provider);
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
