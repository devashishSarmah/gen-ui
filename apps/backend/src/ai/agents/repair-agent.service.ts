import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManifestLoaderService } from '../manifest-loader.service';
import {
  AIGenerationContext,
  AIUsageMetrics,
  ModelTier,
} from '../providers/ai-provider.interface';
import { LayerLLMService } from '../layer-llm.service';

/**
 * Repair Agent
 *
 * If the Validator Agent fails, the Repair Agent tries to fix the schema:
 *   1. Deterministic sanitizer (fast, no LLM)
 *   2. LLM-based repair (configurable tier escalation)
 */
@Injectable()
export class RepairAgentService {
  private readonly logger = new Logger(RepairAgentService.name);

  constructor(
    private configService: ConfigService,
    private manifestLoader: ManifestLoaderService,
    private layerLLMService: LayerLLMService,
  ) {}

  /**
   * Two-pass repair:
   * 1. Deterministic sanitize (always runs, no cost)
   * 2. LLM repair with tier escalation (fast -> quality when enabled)
   */
  async repair(
    schema: any,
    validationErrors: string[],
    context?: AIGenerationContext,
  ): Promise<RepairResult> {
    const trace = context?.traceId || 'no-trace';
    const usage: AIUsageMetrics[] = [];
    this.logger.log(
      `[${trace}] repair_start validationErrors=${validationErrors.length}`,
    );

    // Pass 1: deterministic sanitizer
    const sanitized = this.manifestLoader.sanitizeSchema(schema);
    const postSanitize = this.manifestLoader.validateSchema(sanitized);
    const mergedErrors = [...new Set([...postSanitize.errors, ...validationErrors])];

    if (postSanitize.valid) {
      this.logger.log(`[${trace}] repair_sanitizer_success`);
      return { schema: sanitized, method: 'sanitizer', success: true, usage };
    }

    const escalateToQuality =
      String(this.configService.get('AI_REPAIR_ESCALATE_TO_QUALITY') ?? 'true') ===
      'true';
    const tiers: ModelTier[] = escalateToQuality ? ['fast', 'quality'] : ['fast'];

    let lastCandidate: any = sanitized;
    let lastErrors = mergedErrors;

    for (const tier of tiers) {
      this.logger.log(
        `[${trace}] repair_llm_attempt_start tier=${tier} errors=${lastErrors.length}`,
      );
      try {
        const llmAttempt = await this.tryLlmRepair(
          lastCandidate,
          lastErrors,
          context,
          tier,
        );

        if (llmAttempt.usage) {
          usage.push(llmAttempt.usage);
        }

        if (!llmAttempt.schema) {
          continue;
        }

        const finalValidation = this.manifestLoader.validateSchema(llmAttempt.schema);
        if (finalValidation.valid) {
          this.logger.log(`[${trace}] repair_llm_success tier=${tier}`);
          return {
            schema: llmAttempt.schema,
            method: `llm-${tier}`,
            success: true,
            usage,
          };
        }

        lastCandidate = llmAttempt.schema;
        lastErrors = finalValidation.errors;
      } catch (error) {
        this.logger.warn(`[${trace}] repair_llm_failed tier=${tier}`, error as any);
      }
    }

    this.logger.warn(
      `[${trace}] repair_partial_remaining errors=${lastErrors.length}`,
      lastErrors,
    );

    return {
      schema: lastCandidate,
      method: 'llm-partial',
      success: false,
      remainingErrors: lastErrors,
      usage,
    };
  }

  private async tryLlmRepair(
    schema: any,
    errors: string[],
    context: AIGenerationContext | undefined,
    tier: ModelTier,
  ): Promise<{ schema: any | null; usage?: AIUsageMetrics }> {
    const manifest = this.manifestLoader.getManifest();
    const allowedTypes = manifest?.components.map((c) => c.type) || [];
    const modeHint = context?.routingDecision?.mode
      ? `Requested output mode: ${context.routingDecision.mode}`
      : 'Requested output mode: replace';

    const repairPrompt = `You are a schema repair agent. Fix the following UI schema to pass validation.

ERRORS to fix:
${errors.join('\n')}

RULES:
- Only use these component types: ${allowedTypes.join(', ')}
- All icon values must be Lucide icon names in kebab-case (no emojis)
- No button type="submit" — use type="button"
- No form actions, href, formAction, actionUrl, target, or external URL submits
- Allowed interaction action types only: ui.patch, tool.call, state.update, copyToClipboard
- Keep the UI structure and intent as close to original as possible
- Make MINIMAL changes to fix the errors
- ${modeHint}

Return ONLY the fixed JSON UI schema, no explanation.`;

    const response = await this.layerLLMService.complete({
      layer: 'repair',
      traceId: context?.traceId,
      modelTier: tier,
      responseType: 'json',
      temperature: 0,
      messages: [
        { role: 'system', content: repairPrompt },
        {
          role: 'user',
          content: JSON.stringify({
            schema,
            contextSummary: context?.contextSummary,
            uiStateDigest: context?.uiStateDigest,
          }),
        },
      ],
    });

    if (!response?.json) {
      return { schema: null, usage: response?.usage };
    }

    return {
      schema: response.json,
      usage: response.usage,
    };
  }
}

export interface RepairResult {
  schema: any;
  method: string;
  success: boolean;
  remainingErrors?: string[];
  usage?: AIUsageMetrics[];
}
