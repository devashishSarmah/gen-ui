import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ManifestLoaderService } from '../manifest-loader.service';
import { AIGenerationContext } from '../providers/ai-provider.interface';

/**
 * Repair Agent
 *
 * If the Validator Agent fails, the Repair Agent tries to fix the schema:
 *   1. Deterministic sanitizer (fast, no LLM) — strips unknown props, replaces
 *      emojis with Lucide names, forces button type=button, etc.
 *   2. LLM-based repair (slower, fallback) — asks the model to fix remaining issues.
 */
@Injectable()
export class RepairAgentService {
  private readonly logger = new Logger(RepairAgentService.name);
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
      this.configService.get('OPENROUTER_VALIDATOR_MODEL') ||
      this.configService.get('OPENROUTER_MODEL') ||
      'arcee-ai/trinity-large-preview:free';
  }

  /**
   * Two-pass repair:
   * 1. Deterministic sanitize (always runs, no cost)
   * 2. LLM repair (only if sanitized schema still fails validation)
   */
  async repair(
    schema: any,
    validationErrors: string[],
    context?: AIGenerationContext,
  ): Promise<RepairResult> {
    // Pass 1: deterministic sanitizer
    const sanitized = this.manifestLoader.sanitizeSchema(schema);
    const postSanitize = this.manifestLoader.validateSchema(sanitized);

    if (postSanitize.valid) {
      this.logger.debug('Repair: deterministic sanitizer fixed all issues');
      return { schema: sanitized, method: 'sanitizer', success: true };
    }

    // Pass 2: LLM-based repair
    if (!this.client) {
      this.logger.warn('Repair: LLM not available, returning sanitized schema');
      return { schema: sanitized, method: 'sanitizer-partial', success: false };
    }

    try {
      const manifest = this.manifestLoader.getManifest();
      const allowedTypes = manifest?.components.map((c) => c.type) || [];

      const repairPrompt = `You are a schema repair agent. Fix the following UI schema to pass validation.

ERRORS to fix:
${postSanitize.errors.join('\n')}

RULES:
- Only use these component types: ${allowedTypes.join(', ')}
- All icon values must be Lucide icon names in kebab-case (no emojis)
- No button type="submit" — use type="button"
- No form actions or URL submits
- Keep the UI structure and intent as close to original as possible
- Make MINIMAL changes to fix the errors

Return ONLY the fixed JSON UI schema, no explanation.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: repairPrompt },
          { role: 'user', content: JSON.stringify(sanitized) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const content = response.choices[0]?.message?.content || '';
      const repaired = JSON.parse(content);

      // Validate the LLM repair output
      const finalValidation = this.manifestLoader.validateSchema(repaired);
      if (finalValidation.valid) {
        this.logger.debug('Repair: LLM repair successful');
        return { schema: repaired, method: 'llm', success: true };
      }

      // LLM repair also failed — return best effort
      this.logger.warn('Repair: LLM repair still has errors', finalValidation.errors);
      return {
        schema: repaired,
        method: 'llm-partial',
        success: false,
        remainingErrors: finalValidation.errors,
      };
    } catch (error) {
      this.logger.error('Repair: LLM repair failed', error);
      return { schema: sanitized, method: 'sanitizer-partial', success: false };
    }
  }
}

export interface RepairResult {
  schema: any;
  method: 'sanitizer' | 'llm' | 'sanitizer-partial' | 'llm-partial';
  success: boolean;
  remainingErrors?: string[];
}
