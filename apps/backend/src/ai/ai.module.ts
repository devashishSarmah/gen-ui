import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { SchemaValidationService } from './schema-validation.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { WebSearchService } from './tools/web-search.service';
import { ManifestLoaderService } from './manifest-loader.service';
import { UXDesignerAgentService } from './agents/ux-designer-agent.service';
import { ValidatorAgentService } from './agents/validator-agent.service';
import { RepairAgentService } from './agents/repair-agent.service';

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
    ManifestLoaderService,
    UXDesignerAgentService,
    ValidatorAgentService,
    RepairAgentService,
  ],
  exports: [AIService, ManifestLoaderService],
})
export class AIModule {}
