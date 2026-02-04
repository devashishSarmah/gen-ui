import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIGenerationContext, UISchemaChunk } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { SchemaValidationService } from './schema-validation.service';

@Injectable()
export class AIService {
  private providers: Map<string, AIProvider>;
  private defaultProvider: string;

  constructor(
    private configService: ConfigService,
    private openaiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
    private schemaValidation: SchemaValidationService
  ) {
    this.providers = new Map();
    this.providers.set('openai', this.openaiProvider);
    this.providers.set('anthropic', this.anthropicProvider);
    
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
   * Generate UI from user prompt
   */
  async *generateUI(
    context: AIGenerationContext,
    providerName?: string
  ): AsyncIterableIterator<UISchemaChunk> {
    const provider = this.getProvider(providerName);

    for await (const chunk of provider.generateUI(context)) {
      // Validate complete schemas
      if (chunk.type === 'complete') {
        const validation = this.schemaValidation.validate(chunk.data);
        
        if (!validation.valid) {
          yield {
            type: 'error',
            data: { error: 'Schema validation failed', details: validation.errors },
            done: true,
          };
          return;
        }
      }

      yield chunk;
    }
  }

  /**
   * Update UI based on interaction
   */
  async *updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext,
    providerName?: string
  ): AsyncIterableIterator<UISchemaChunk> {
    const provider = this.getProvider(providerName);

    for await (const chunk of provider.updateUI(currentSchema, interaction, context)) {
      // Validate complete schemas
      if (chunk.type === 'complete') {
        const validation = this.schemaValidation.validate(chunk.data);
        
        if (!validation.valid) {
          yield {
            type: 'error',
            data: { error: 'Schema validation failed', details: validation.errors },
            done: true,
          };
          return;
        }
      }

      yield chunk;
    }
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
