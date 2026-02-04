import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerFactory } from '../circuit-breaker/circuit-breaker';
import { Retryable, retryAsync, DEFAULT_RETRY_CONFIG } from '../decorators/retryable.decorator';
import { AiProviderException, TimeoutException } from '../exceptions/custom-exceptions';

/**
 * AI Provider interface for abstraction
 */
export interface IAiProvider {
  name: string;
  generateSchema(prompt: string): Promise<any>;
  isAvailable(): Promise<boolean>;
}

/**
 * Fault-tolerant AI service with provider fallback
 */
@Injectable()
export class FaultTolerantAiService {
  private readonly logger = new Logger(FaultTolerantAiService.name);
  private circuitBreakerFactory = new CircuitBreakerFactory();
  private providers: IAiProvider[] = [];
  private primaryProvider: IAiProvider | null = null;

  /**
   * Register AI provider with fault tolerance
   */
  registerProvider(provider: IAiProvider, primary: boolean = false) {
    this.providers.push(provider);
    if (primary) {
      this.primaryProvider = provider;
    }
    this.logger.log(`Registered AI provider: ${provider.name}`);
  }

  /**
   * Generate schema with automatic fallback on failure
   */
  async generateSchemaWithFallback(prompt: string): Promise<any> {
    if (!this.primaryProvider) {
      throw new AiProviderException('No AI provider configured', 'none', false);
    }

    const circuitBreaker = this.circuitBreakerFactory.create(
      this.primaryProvider.name,
      {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 30000,
      }
    );

    try {
      // Try primary provider with circuit breaker
      return await circuitBreaker.execute(() =>
        retryAsync(
          () => this.primaryProvider!.generateSchema(prompt),
          {
            maxRetries: 2,
            timeoutMs: 30000,
            initialDelayMs: 500,
          }
        )
      );
    } catch (error: any) {
      this.logger.warn(
        `Primary provider ${this.primaryProvider.name} failed: ${error.message}. Attempting fallback.`
      );

      // Try fallback providers
      for (const fallbackProvider of this.providers) {
        if (fallbackProvider.name === this.primaryProvider.name) {
          continue; // Skip primary provider
        }

        try {
          const available = await fallbackProvider.isAvailable();
          if (available) {
            this.logger.log(`Using fallback provider: ${fallbackProvider.name}`);
            return await retryAsync(
              () => fallbackProvider.generateSchema(prompt),
              {
                maxRetries: 1,
                timeoutMs: 20000,
                initialDelayMs: 200,
              }
            );
          }
        } catch (fallbackError: any) {
          this.logger.warn(`Fallback provider ${fallbackProvider.name} also failed: ${fallbackError.message}`);
        }
      }

      throw new AiProviderException(
        'All AI providers failed',
        this.primaryProvider.name,
        true,
        { originalError: error.message }
      );
    }
  }

  /**
   * Check if any provider is available
   */
  async isHealthy(): Promise<boolean> {
    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable();
        if (available) {
          return true;
        }
      } catch (error) {
        this.logger.debug(`Provider ${provider.name} health check failed`);
      }
    }
    return false;
  }

  /**
   * Get provider circuit breaker status
   */
  getProviderStatus(providerName: string): string {
    const breaker = this.circuitBreakerFactory.get(providerName);
    return breaker ? breaker.getState() : 'UNKNOWN';
  }
}
