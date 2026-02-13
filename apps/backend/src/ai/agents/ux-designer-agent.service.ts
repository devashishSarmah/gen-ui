import { Injectable, Logger } from '@nestjs/common';
import { ManifestLoaderService } from '../manifest-loader.service';
import {
  AIGenerationContext,
  AIUsageMetrics,
  ModelTier,
} from '../providers/ai-provider.interface';
import { LayerLLMService } from '../layer-llm.service';

/**
 * UX Designer Agent
 *
 * Chooses the best layout, information architecture, and interaction model
 * based on user intent and design system constraints.
 * Outputs a "UX plan" — not the final schema, but a structural recommendation.
 */
@Injectable()
export class UXDesignerAgentService {
  private readonly logger = new Logger(UXDesignerAgentService.name);

  constructor(
    private manifestLoader: ManifestLoaderService,
    private layerLLMService: LayerLLMService,
  ) {}

  async planUX(context: AIGenerationContext): Promise<UXPlanResult> {
    const trace = context.traceId || 'no-trace';
    const manifest = this.manifestLoader.getManifest();
    if (!manifest) {
      this.logger.warn(`[${trace}] ux_plan_skipped reason=no_manifest`);
      return { plan: null };
    }

    const availableLayouts = manifest.components
      .filter((c) => c.childrenRules.isContainer)
      .map((c) => c.type);

    const availableComponents = manifest.components
      .map((c) => `${c.type} (${c.category}): ${c.description}`)
      .join('\n');

    const systemPrompt = `You are a UX Designer Agent for a Gen-UI system.

Your constraints:
- Design for COMPACT, information-dense UIs
- Available layouts: ${availableLayouts.join(', ')}
- Available components:\n${availableComponents}
- Icons: Lucide only (kebab-case), NEVER emojis
- NO form submits to URLs — prefer local filtering, details panels, copy-to-clipboard
- Density: use smallest gaps, paddings, and font sizes that remain readable

You MUST output ONLY valid JSON in this shape:
{
  "layout": "grid|flexbox|tabs|accordion|card|split-layout",
  "sections": [
    {
      "purpose": "string describing what this section does",
      "componentType": "string - primary component type",
      "density": "compact",
      "children": ["component-type-1", "component-type-2"]
    }
  ],
  "interactionModel": "filter-locally|details-on-demand|paginate|tabbed-navigation|wizard-flow",
  "densityNotes": "specific density choices for this layout",
  "iconSuggestions": { "sectionName": "lucide-icon-name" },
  "patchStrategy": {
    "preferPatch": true,
    "targetAreas": ["section-or-component-id"],
    "operations": ["add|replace|remove|update"]
  }
}

Do NOT produce the final UI schema. Only recommend structure.`;

    const tier: ModelTier = context.routingDecision?.modelTier === 'quality' ? 'quality' : 'balanced';
    this.logger.log(
      `[${trace}] ux_plan_start tier=${tier} hasCurrentUiState=${!!context.currentUiState}`,
    );

    try {
      const response = await this.layerLLMService.complete({
        layer: 'ux',
        traceId: context.traceId,
        modelTier: tier,
        responseType: 'json',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `User request: "${context.userPrompt}"\n\nCurrent UI state: ${
              context.currentUiState
                ? JSON.stringify(context.currentUiState).slice(0, 3000)
                : 'none'
            }`,
          },
        ],
      });

      if (!response?.json) {
        this.logger.warn(`[${trace}] ux_plan_empty_response`);
        return { plan: null };
      }

      const plan = response.json as UXPlan;
      this.logger.log(
        `[${trace}] ux_plan_success layout=${plan.layout} sections=${plan.sections?.length || 0}`,
      );

      return {
        plan,
        usage: response.usage,
      };
    } catch (error) {
      this.logger.warn(`[${trace}] ux_plan_failed`, error as any);
      return { plan: null };
    }
  }
}

export interface UXPlanResult {
  plan: UXPlan | null;
  usage?: AIUsageMetrics;
}

export interface UXPlan {
  layout: string;
  sections: Array<{
    purpose: string;
    componentType: string;
    density: string;
    children: string[];
  }>;
  interactionModel: string;
  densityNotes: string;
  iconSuggestions: Record<string, string>;
  patchStrategy?: {
    preferPatch: boolean;
    targetAreas: string[];
    operations: string[];
  };
}
