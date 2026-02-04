import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { SchemaValidationService } from './schema-validation.service';

@Module({
  imports: [ConfigModule],
  providers: [AIService, OpenAIProvider, AnthropicProvider, SchemaValidationService],
  exports: [AIService],
})
export class AIModule {}
