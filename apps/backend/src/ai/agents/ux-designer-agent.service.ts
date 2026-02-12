import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ManifestLoaderService } from '../manifest-loader.service';
import { AIGenerationContext } from '../providers/ai-provider.interface';

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
  private client: OpenAI | null = null;
  private model: string;

  constructor(
    private configService: ConfigService,
    private manifestLoader: ManifestLoaderService,
  ) {
    const apiKey = this.configService.get('OPENROUTER_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }
    this.model =
      this.configService.get('OPENROUTER_MODEL') ||
      'arcee-ai/trinity-large-preview:free';
  }

  async planUX(context: AIGenerationContext): Promise<UXPlan | null> {
    if (!this.client) return null;

    const manifest = this.manifestLoader.getManifest();
    if (!manifest) return null;

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
  "layout": "grid|flexbox|tabs|accordion|card",
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
  "iconSuggestions": { "sectionName": "lucide-icon-name" }
}

Do NOT produce the final UI schema. Only recommend structure.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `User request: "${context.userPrompt}"\n\nCurrent UI state: ${
              context.currentUiState ? JSON.stringify(context.currentUiState).slice(0, 2000) : 'none'
            }`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content || '';
      const plan = JSON.parse(content) as UXPlan;
      this.logger.debug(`UX plan: ${plan.layout} with ${plan.sections?.length || 0} sections`);
      return plan;
    } catch (error) {
      this.logger.warn('UX Designer Agent failed, skipping plan', error);
      return null;
    }
  }
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
}
