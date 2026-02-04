import { CircuitBreaker, CircuitBreakerState, CircuitBreakerFactory } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('should be closed initially', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });

    expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
  });

  it('should open after failure threshold', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 1000,
    });

    // Simulate two failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('Test error')));
      } catch (e) {
        // Expected
      }
    }

    expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
  });

  it('should reject requests when open', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 10000,
    });

    try {
      await breaker.execute(() => Promise.reject(new Error('Test error')));
    } catch (e) {
      // Expected
    }

    await expect(breaker.execute(() => Promise.resolve())).rejects.toThrow(
      'Circuit breaker is OPEN'
    );
  });

  it('should transition to half-open after timeout', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 100,
    });

    try {
      await breaker.execute(() => Promise.reject(new Error('Test error')));
    } catch (e) {
      // Expected
    }

    expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should now be half-open when attempting next request
    await breaker.execute(() => Promise.resolve('success'));
    expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});

describe('CircuitBreakerFactory', () => {
  it('should create and cache breakers', () => {
    const factory = new CircuitBreakerFactory();
    const breaker1 = factory.create('test-service');
    const breaker2 = factory.create('test-service');

    expect(breaker1).toBe(breaker2);
  });

  it('should reset breaker state', () => {
    const factory = new CircuitBreakerFactory();
    const breaker = factory.create('test-service', { failureThreshold: 1, successThreshold: 1, timeout: 1000 });

    try {
      breaker.execute(() => Promise.reject(new Error('Test')));
    } catch (e) {
      // Expected
    }

    expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

    factory.reset('test-service');
    expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});
