import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { SchemaValidationService } from './schema-validation.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { WebSearchService } from './tools/web-search.service';
import { ManifestLoaderService } from './manifest-loader.service';
import { UXDesignerAgentService } from './agents/ux-designer-agent.service';
import { ValidatorAgentService } from './agents/validator-agent.service';
import { RepairAgentService } from './agents/repair-agent.service';
import { RouterAgentService } from './agents/router-agent.service';
import { SummarizerAgentService } from './agents/summarizer-agent.service';
import { EthicsGateService } from './agents/ethics-gate.service';
import { LayerLLMService } from './layer-llm.service';
import { CopyAgentService } from './agents/copy-agent.service';
import { ModelResolverService } from './model-resolver.service';
import { ProviderHealthService } from './provider-health.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AIService,
    OpenAIProvider,
    AnthropicProvider,
    OpenRouterProvider,
    GeminiProvider,
    GroqProvider,
    SchemaValidationService,
    AgentOrchestratorService,
    WebSearchService,
    ManifestLoaderService,
    ModelResolverService,
    ProviderHealthService,
    LayerLLMService,
    EthicsGateService,
    CopyAgentService,
    RouterAgentService,
    SummarizerAgentService,
    UXDesignerAgentService,
    ValidatorAgentService,
    RepairAgentService,
  ],
  exports: [AIService, ManifestLoaderService],
})
export class AIModule {}
