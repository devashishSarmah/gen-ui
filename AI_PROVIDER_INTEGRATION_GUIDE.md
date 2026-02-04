# AI Provider Integration Guide

## Overview

This guide explains how to integrate AI providers (OpenAI, Anthropic, etc.) with the Conversational UI system for dynamic schema generation.

## Supported AI Providers

The system supports multiple AI providers with automatic fallback:

1. **OpenAI** (GPT-4, GPT-3.5-turbo)
2. **Anthropic** (Claude)
3. **Custom Providers** (implement IAiProvider interface)

## Integration Steps

### 1. Create AI Provider Implementation

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IAiProvider } from '../../common/ai/fault-tolerant-ai.service';
import { AiProviderException } from '../../common/exceptions/custom-exceptions';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  name = 'OpenAI';
  private readonly logger = new Logger(this.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async generateSchema(prompt: string): Promise<any> {
    try {
      const apiKey = this.configService.get('OPENAI_API_KEY');
      const model = this.configService.get('OPENAI_MODEL', 'gpt-4');

      const response = await this.httpService.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a JSON schema generation expert. Generate valid JSON schemas.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      ).toPromise();

      const content = response.data.choices[0].message.content;
      return this.parseJsonSchema(content);
    } catch (error: any) {
      this.logger.error(`Schema generation failed: ${error.message}`);
      throw new AiProviderException(error.message, this.name);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.configService.get('OPENAI_API_KEY');
      if (!apiKey) {
        return false;
      }

      // Quick health check
      await this.httpService.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      ).toPromise();

      return true;
    } catch (error) {
      return false;
    }
  }

  private parseJsonSchema(content: string): any {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error(`Failed to parse JSON schema: ${error}`);
    }
  }
}
```

### 2. Configure Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_TIMEOUT_MS=30000

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus

AI_PRIMARY_PROVIDER=openai
AI_FALLBACK_PROVIDERS=anthropic,custom
```

### 3. Register Provider

```typescript
import { Module } from '@nestjs/common';
import { FaultTolerantAiService } from '../../common/ai/fault-tolerant-ai.service';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';

@Module({
  providers: [
    FaultTolerantAiService,
    OpenAiProvider,
    AnthropicProvider,
    {
      provide: 'AI_SERVICE',
      useFactory: (
        aiService: FaultTolerantAiService,
        openAi: OpenAiProvider,
        anthropic: AnthropicProvider,
        configService: ConfigService
      ) => {
        // Register primary provider
        const primaryProvider = configService.get('AI_PRIMARY_PROVIDER', 'openai');
        if (primaryProvider === 'openai') {
          aiService.registerProvider(openAi, true);
        } else {
          aiService.registerProvider(anthropic, true);
        }

        // Register fallback providers
        aiService.registerProvider(openAi, false);
        aiService.registerProvider(anthropic, false);

        return aiService;
      },
      inject: [
        FaultTolerantAiService,
        OpenAiProvider,
        AnthropicProvider,
        ConfigService,
      ],
    },
  ],
  exports: [FaultTolerantAiService],
})
export class AiModule {}
```

### 4. Use in Service

```typescript
@Injectable()
export class SchemaGenerationService {
  constructor(
    @Inject('AI_SERVICE') private aiService: FaultTolerantAiService
  ) {}

  async generateUiSchema(userRequest: string): Promise<any> {
    const prompt = `
      Based on the user's request: "${userRequest}"
      
      Generate a JSON schema for a dynamic UI form with:
      - Component type (form, table, modal, etc.)
      - Fields with types (text, email, number, select, etc.)
      - Validation rules
      - Default values
      
      Respond with valid JSON only.
    `;

    try {
      const schema = await this.aiService.generateSchemaWithFallback(prompt);
      
      // Validate schema
      this.validateSchema(schema);
      
      return schema;
    } catch (error) {
      console.error('Schema generation failed:', error);
      
      // Provide fallback schema
      return this.getDefaultSchema();
    }
  }

  private validateSchema(schema: any) {
    if (!schema.type) {
      throw new SchemaValidationException('Schema missing required "type" field');
    }

    if (!schema.properties) {
      throw new SchemaValidationException('Schema missing required "properties" field');
    }
  }

  private getDefaultSchema(): any {
    return {
      type: 'form',
      properties: {
        message: {
          type: 'string',
          label: 'Please try again later',
        },
      },
    };
  }
}
```

## Prompt Engineering Tips

### For Form Schemas

```
Generate a JSON schema for a form with these requirements:
- Purpose: [describe the form's purpose]
- Fields needed: [list of fields]
- Validations: [any validation rules]

Return ONLY valid JSON matching this structure:
{
  "type": "form",
  "properties": {
    "[fieldName]": {
      "type": "string|number|boolean",
      "label": "Human readable label",
      "required": true|false,
      "validation": { "pattern": "regex", "min": 0 }
    }
  }
}
```

### For Multi-Step Wizards

```
Generate a JSON schema for a multi-step wizard with these steps:
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

Return ONLY valid JSON with steps array containing form schemas.
```

### For Tables

```
Generate a JSON schema for displaying data in a table:
- Data source: [describe data]
- Columns: [list columns needed]
- Actions: [any row actions]

Return ONLY valid JSON with columns array definition.
```

## Handling Provider Failures

### Automatic Fallback

```typescript
// When primary provider fails, system automatically tries fallback providers
try {
  schema = await aiService.generateSchemaWithFallback(prompt);
} catch (error) {
  // All providers failed - use cached schema or default
  schema = getCachedSchema() || getDefaultSchema();
}
```

### Circuit Breaker Status

```typescript
// Check provider health
const status = aiService.getProviderStatus('OpenAI');
console.log(`OpenAI Circuit Breaker: ${status}`);
// Output: OPEN, CLOSED, or HALF_OPEN
```

## Performance Optimization

### Caching Schemas

```typescript
// Cache generated schemas to reduce API calls
private schemaCache = new Map<string, { schema: any; timestamp: number }>();

async generateSchema(prompt: string): Promise<any> {
  const cacheKey = hash(prompt);
  const cached = this.schemaCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.schema; // 1 hour TTL
  }

  const schema = await this.aiService.generateSchemaWithFallback(prompt);
  this.schemaCache.set(cacheKey, { schema, timestamp: Date.now() });
  return schema;
}
```

### Batch Schema Generation

```typescript
// Generate multiple schemas efficiently
async generateSchemasInBatch(prompts: string[]): Promise<any[]> {
  const schemas = await Promise.all(
    prompts.map(prompt => 
      this.aiService.generateSchemaWithFallback(prompt).catch(() => null)
    )
  );

  return schemas.filter(s => s !== null);
}
```

## Monitoring

### Metrics to Track

- Schema generation latency
- Provider success/failure rates
- Circuit breaker state transitions
- Cache hit rate
- Cost per request (if applicable)

### Logging

```typescript
// Monitor provider performance
this.logger.log(`Schema generated in ${Date.now() - startTime}ms using ${provider.name}`);
this.logger.warn(`${provider.name} circuit breaker opened - using fallback`);
this.logger.error(`All providers failed after ${attempts} attempts`);
```

## Cost Optimization

### Token Estimation

```typescript
// Estimate tokens before calling API
const estimatedTokens = prompt.split(' ').length * 1.3; // Rough estimate

if (estimatedTokens > 2000) {
  console.warn('Large prompt may exceed token limits');
}
```

### Rate Limiting

```typescript
// Implement per-user rate limiting
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 3600000, // 1 hour
});

if (!rateLimiter.allowed(userId)) {
  throw new Error('Rate limit exceeded');
}
```

## Testing

```typescript
describe('AI Schema Generation', () => {
  it('should fallback to secondary provider on primary failure', async () => {
    const openAi = new OpenAiProvider(...);
    const anthropic = new AnthropicProvider(...);

    jest.spyOn(openAi, 'generateSchema').mockRejectedValue(new Error('API error'));
    jest.spyOn(anthropic, 'generateSchema').mockResolvedValue({ type: 'form' });

    const service = new FaultTolerantAiService();
    service.registerProvider(openAi, true);
    service.registerProvider(anthropic, false);

    const schema = await service.generateSchemaWithFallback('test');
    expect(schema).toBeDefined();
  });
});
```
