import { Test, TestingModule } from '@nestjs/testing';
import { FaultTolerantAiService, IAiProvider } from '../../common/ai/fault-tolerant-ai.service';
import { AiProviderException } from '../../common/exceptions/custom-exceptions';

/**
 * Mock AI Provider for testing
 */
class MockAiProvider implements IAiProvider {
  name = 'MockProvider';
  private shouldFail = false;

  async generateSchema(prompt: string): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure');
    }
    return { type: 'object', properties: { test: { type: 'string' } } };
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail;
  }

  setFailure(fail: boolean) {
    this.shouldFail = fail;
  }
}

describe('FaultTolerantAiService', () => {
  let service: FaultTolerantAiService;
  let primaryProvider: MockAiProvider;
  let fallbackProvider: MockAiProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaultTolerantAiService],
    }).compile();

    service = module.get<FaultTolerantAiService>(FaultTolerantAiService);

    primaryProvider = new MockAiProvider();
    primaryProvider.name = 'PrimaryProvider';

    fallbackProvider = new MockAiProvider();
    fallbackProvider.name = 'FallbackProvider';

    service.registerProvider(primaryProvider, true);
    service.registerProvider(fallbackProvider, false);
  });

  it('should use primary provider when available', async () => {
    const schema = await service.generateSchemaWithFallback('test prompt');
    expect(schema).toBeDefined();
    expect(schema.type).toBe('object');
  });

  it('should fall back to secondary provider when primary fails', async () => {
    primaryProvider.setFailure(true);
    const schema = await service.generateSchemaWithFallback('test prompt');
    expect(schema).toBeDefined();
  });

  it('should throw error when all providers fail', async () => {
    primaryProvider.setFailure(true);
    fallbackProvider.setFailure(true);

    await expect(service.generateSchemaWithFallback('test prompt')).rejects.toThrow(
      AiProviderException
    );
  });

  it('should report health correctly', async () => {
    primaryProvider.setFailure(false);
    expect(await service.isHealthy()).toBe(true);

    primaryProvider.setFailure(true);
    fallbackProvider.setFailure(true);
    expect(await service.isHealthy()).toBe(false);
  });
});
