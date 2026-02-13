import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIGenerationContext,
  AIRoutingDecision,
  GenerationMode,
  ModelTier,
  AIUsageMetrics,
} from '../providers/ai-provider.interface';
import { LayerLLMService } from '../layer-llm.service';

export interface RoutingDecisionResult {
  decision: AIRoutingDecision;
  usage?: AIUsageMetrics;
}

/**
 * Router Agent
 *
 * Deterministic rules by default, with optional LLM override/fallback.
 */
@Injectable()
export class RouterAgentService {
  private readonly logger = new Logger(RouterAgentService.name);

  constructor(
    private configService: ConfigService,
    private layerLLMService: LayerLLMService,
  ) {}

  async decideForGenerate(context: AIGenerationContext): Promise<RoutingDecisionResult> {
    return this.decide(context, 'generate');
  }

  async decideForUpdate(
    context: AIGenerationContext,
    interaction?: unknown,
  ): Promise<RoutingDecisionResult> {
    return this.decide(context, 'update', interaction);
  }

  private async decide(
    context: AIGenerationContext,
    flow: 'generate' | 'update',
    interaction?: unknown,
  ): Promise<RoutingDecisionResult> {
    const trace = context.traceId || 'no-trace';
    const deterministic = this.decideDeterministic(context, flow, interaction);

    const routerMode = String(this.configService.get('AI_ROUTER_MODE') || 'deterministic').toLowerCase();
    const shouldCallLlm =
      routerMode === 'llm' || (routerMode === 'hybrid' && this.isAmbiguous(context.userPrompt));

    this.logger.log(
      `[${trace}] router_start flow=${flow} mode=${routerMode} llm=${shouldCallLlm}`,
    );

    if (!shouldCallLlm) {
      this.logger.log(
        `[${trace}] router_deterministic mode=${deterministic.mode} tier=${deterministic.modelTier}`,
      );
      return { decision: deterministic };
    }

    try {
      const llmResponse = await this.layerLLMService.complete({
        layer: 'router',
        traceId: context.traceId,
        modelTier: 'fast',
        responseType: 'json',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'You are a routing controller for UI generation. Return ONLY JSON with keys: mode(replace|patch), runUxPlan(boolean), runWebSearch(boolean), modelTier(fast|balanced|quality), patchHints(string[]), reasons(string[]).',
          },
          {
            role: 'user',
            content: JSON.stringify({
              flow,
              userPrompt: context.userPrompt,
              hasCurrentUiState: !!context.currentUiState,
              hasInteraction: !!context.lastInteraction || !!interaction,
              deterministic,
            }),
          },
        ],
      });

      if (!llmResponse?.json) {
        this.logger.warn(`[${trace}] router_llm_empty_response_using_deterministic`);
        return { decision: deterministic };
      }

      const merged = this.normalizeDecision(llmResponse.json, deterministic);
      this.logger.log(
        `[${trace}] router_llm_decision mode=${merged.mode} tier=${merged.modelTier} ux=${merged.runUxPlan} search=${merged.runWebSearch}`,
      );
      return {
        decision: merged,
        usage: llmResponse.usage,
      };
    } catch {
      this.logger.warn(`[${trace}] router_llm_failed_using_deterministic`);
      return { decision: deterministic };
    }
  }

  private decideDeterministic(
    context: AIGenerationContext,
    flow: 'generate' | 'update',
    interaction?: unknown,
  ): AIRoutingDecision {
    const prompt = (context.userPrompt || '').trim();
    const lower = prompt.toLowerCase();

    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    const hasCurrentUiState = !!context.currentUiState;
    const hasInteraction = !!context.lastInteraction || !!interaction;

    const explicitReplace =
      /\b(from scratch|start over|new ui|redesign|rebuild|replace all)\b/.test(lower);

    const tinyEditIntent =
      wordCount <= 22 &&
      /\b(change|update|edit|rename|fix|tweak|adjust|set|toggle|open|close|sort|filter|paginate|tab|density|padding|gap|spacing|label|title|icon)\b/.test(
        lower,
      );

    const needsFreshStructure =
      !hasCurrentUiState ||
      explicitReplace ||
      /\b(dashboard|workflow|multi-step|wizard|analytics|layout|information architecture)\b/.test(
        lower,
      );

    const requiresResearch =
      /\b(latest|today|current|news|price|release|version|who is|when was|updated|breaking|search|browse|look up)\b/.test(
        lower,
      );

    let mode: GenerationMode;
    if (flow === 'update' || hasInteraction) {
      mode = 'patch';
    } else {
      mode = 'replace';
    }

    if (needsFreshStructure) {
      mode = 'replace';
    }

    const runUxPlan = mode === 'replace' && !tinyEditIntent;
    const runWebSearch = mode === 'replace' && requiresResearch;

    let modelTier: ModelTier = 'balanced';
    if (mode === 'patch' || tinyEditIntent) {
      modelTier = 'fast';
    } else if (requiresResearch || wordCount > 45) {
      modelTier = 'quality';
    }

    const reasons: string[] = [
      `flow=${flow}`,
      `wordCount=${wordCount}`,
      hasCurrentUiState ? 'has-current-ui-state' : 'no-current-ui-state',
      hasInteraction ? 'has-interaction' : 'no-interaction',
      `mode=${mode}`,
      runUxPlan ? 'run-ux-plan' : 'skip-ux-plan',
      runWebSearch ? 'run-web-search' : 'skip-web-search',
      `model-tier=${modelTier}`,
    ];

    const patchHints =
      mode === 'patch'
        ? [
            'Prefer mode="patch" and minimal JSON Patch operations',
            'Preserve existing structure and IDs where possible',
            'Avoid full schema regeneration for small interaction updates',
          ]
        : [];

    return {
      mode,
      runUxPlan,
      runWebSearch,
      modelTier,
      reasons,
      patchHints,
    };
  }

  private normalizeDecision(
    raw: any,
    fallback: AIRoutingDecision,
  ): AIRoutingDecision {
    const mode = raw?.mode === 'patch' ? 'patch' : 'replace';
    const modelTier: ModelTier =
      raw?.modelTier === 'fast' || raw?.modelTier === 'quality' || raw?.modelTier === 'balanced'
        ? raw.modelTier
        : fallback.modelTier;

    return {
      mode,
      runUxPlan:
        typeof raw?.runUxPlan === 'boolean' ? raw.runUxPlan : fallback.runUxPlan,
      runWebSearch:
        typeof raw?.runWebSearch === 'boolean'
          ? raw.runWebSearch
          : fallback.runWebSearch,
      modelTier,
      patchHints: Array.isArray(raw?.patchHints)
        ? raw.patchHints.map((v: any) => String(v))
        : fallback.patchHints,
      reasons: Array.isArray(raw?.reasons)
        ? raw.reasons.map((v: any) => String(v))
        : fallback.reasons,
    };
  }

  private isAmbiguous(prompt: string): boolean {
    const lower = String(prompt || '').toLowerCase();
    return (
      /\b(update|change|fix|improve|optimize|adjust|modify)\b/.test(lower) &&
      /\b(layout|structure|style|copy|interaction|data|performance)\b/.test(lower)
    );
  }
}
