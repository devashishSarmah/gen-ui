import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { SchemaValidationService } from './schema-validation.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { WebSearchService } from './tools/web-search.service';
import { ValidatorAgentService } from './validator-agent.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AIService,
    OpenAIProvider,
    AnthropicProvider,
    OpenRouterProvider,
    SchemaValidationService,
    AgentOrchestratorService,
    WebSearchService,
    ValidatorAgentService,
  ],
  exports: [AIService],
})
export class AIModule {}
