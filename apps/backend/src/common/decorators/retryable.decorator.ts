/**
 * Retry configuration with exponential backoff
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

/**
 * Default retry configuration for external service calls
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
};

/**
 * Exponential backoff retry decorator
 * Retries failed async operations with exponential backoff
 */
export function Retryable(config: Partial<RetryConfig> = {}) {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: any;
      let delayMs = mergedConfig.initialDelayMs;

      for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
        try {
          return await Promise.race([
            originalMethod.apply(this, args),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Operation timeout')), mergedConfig.timeoutMs)
            ),
          ]);
        } catch (error) {
          lastError = error;

          if (attempt < mergedConfig.maxRetries) {
            console.log(`Retry ${attempt + 1}/${mergedConfig.maxRetries} for ${propertyKey} after ${delayMs}ms`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs = Math.min(delayMs * mergedConfig.backoffMultiplier, mergedConfig.maxDelayMs);
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Utility function to retry any async operation
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  let delayMs = mergedConfig.initialDelayMs;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), mergedConfig.timeoutMs)
        ),
      ]);
    } catch (error) {
      lastError = error;

      if (attempt < mergedConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs * mergedConfig.backoffMultiplier, mergedConfig.maxDelayMs);
      }
    }
  }

  throw lastError;
}
