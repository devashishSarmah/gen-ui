import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIGenerationContext,
  UISchemaChunk,
  AIProvider,
} from './providers/ai-provider.interface';
import { WebSearchService, WebSearchResults } from './tools/web-search.service';
import { ManifestLoaderService } from './manifest-loader.service';
import { UXDesignerAgentService } from './agents/ux-designer-agent.service';
import { ValidatorAgentService as ManifestValidatorService } from './agents/validator-agent.service';
import { RepairAgentService } from './agents/repair-agent.service';

/**
 * Agent Orchestrator
 *
 * Full pipeline:
 *   1. Web search enrichment (optional)
 *   2. UX Designer -> structural UX plan
 *   3. UI Provider -> raw schema (streamed)
 *   4. Validator -> manifest-driven validation
 *   5. Repair -> deterministic sanitize + LLM fallback (up to MAX_REPAIR_ROUNDS)
 *   6. Return validated schema or error
 */
@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  private readonly MAX_REPAIR_ROUNDS = 2;

  constructor(
    private configService: ConfigService,
    private webSearchService: WebSearchService,
    private manifestLoader: ManifestLoaderService,
    private uxDesigner: UXDesignerAgentService,
    private validator: ManifestValidatorService,
    private repairAgent: RepairAgentService,
  ) {}

  // -- Public API -----------------------------------------------------------

  /**
   * Full generation pipeline: enrich -> plan -> generate -> validate -> repair
   */
  async *generateUI(
    context: AIGenerationContext,
    provider: AIProvider,
  ): AsyncIterableIterator<UISchemaChunk> {
    // Step 1: web search enrichment
    const enriched = await this.enrichContext(context);

    // Step 2: UX Designer plan (non-blocking -- failures are OK)
    let uxPlanText = '';
    try {
      const uxPlan = await this.uxDesigner.planUX(enriched);
      if (uxPlan) {
        uxPlanText = this.formatUXPlan(uxPlan);
        this.logger.debug('UX plan generated');
      }
    } catch (err) {
      this.logger.warn('UX Designer agent failed, continuing without plan', err);
    }

    // Step 3: UI Provider generates raw schema (streamed)
    const contextWithPlan: AIGenerationContext = {
      ...enriched,
      uxPlan: uxPlanText || undefined,
    };

    let rawSchema: any = null;

    for await (const chunk of provider.generateUI(contextWithPlan)) {
      if (chunk.type === 'complete') {
        rawSchema = chunk.data;
      } else {
        yield chunk;
      }
    }

    if (!rawSchema) {
      yield { type: 'error', data: { error: 'Provider returned no schema' }, done: true };
      return;
    }

    // Step 4+5: Validate & repair loop
    yield* this.validateAndRepair(rawSchema, enriched);
  }

  /**
   * Update pipeline: enrich -> provider update -> validate -> repair
   */
  async *updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext,
    provider: AIProvider,
  ): AsyncIterableIterator<UISchemaChunk> {
    const enriched = await this.enrichContext(context);

    let rawSchema: any = null;

    for await (const chunk of provider.updateUI(currentSchema, interaction, enriched)) {
      if (chunk.type === 'complete') {
        rawSchema = chunk.data;
      } else {
        yield chunk;
      }
    }

    if (!rawSchema) {
      yield { type: 'error', data: { error: 'Provider returned no schema' }, done: true };
      return;
    }

    yield* this.validateAndRepair(rawSchema, enriched);
  }

  // -- Validation & Repair --------------------------------------------------

  private async *validateAndRepair(
    schema: any,
    context: AIGenerationContext,
  ): AsyncIterableIterator<UISchemaChunk> {
    let current = schema;

    for (let round = 0; round <= this.MAX_REPAIR_ROUNDS; round++) {
      const result = this.validator.validate(current);

      if (result.valid) {
        current = this.stampVersion(current);

        if (result.warnings.length > 0) {
          this.logger.debug('Validation warnings:', result.warnings);
        }

        yield { type: 'complete', data: current, done: true };
        return;
      }

      this.logger.debug(
        `Validation failed (round ${round + 1}/${this.MAX_REPAIR_ROUNDS + 1}):`,
        result.errors.map((e: any) => e.message),
      );

      if (round < this.MAX_REPAIR_ROUNDS) {
        const repairResult = await this.repairAgent.repair(
          current,
          result.errors.map((e: any) => e.message),
          context,
        );
        current = repairResult.schema;

        if (repairResult.success) {
          current = this.stampVersion(current);
          yield { type: 'complete', data: current, done: true };
          return;
        }
      }
    }

    // All repair rounds exhausted -- return best-effort with warning
    this.logger.warn('All repair rounds exhausted, returning best-effort schema');
    current = this.stampVersion(current);
    yield { type: 'complete', data: current, done: true };
  }

  private stampVersion(schema: any): any {
    const manifest = this.manifestLoader.getManifest();
    if (manifest && !schema.manifestVersion) {
      schema.manifestVersion = manifest.manifestVersion;
      schema.rendererVersion = manifest.rendererVersion;
    }
    return schema;
  }

  // -- Web Search Enrichment ------------------------------------------------

  async enrichContext(context: AIGenerationContext): Promise<AIGenerationContext> {
    if (!this.isWebSearchEnabled()) {
      return context;
    }

    const mode = (this.configService.get('AI_WEB_SEARCH_MODE') || 'auto').toLowerCase();
    if (mode === 'never') {
      return context;
    }

    const shouldSearch =
      mode === 'always' ? true : this.shouldSearch(context.userPrompt || '');

    if (!shouldSearch) {
      return context;
    }

    const results = await this.webSearchService.search(context.userPrompt);
    return {
      ...context,
      searchResults: results,
    };
  }

  private isWebSearchEnabled(): boolean {
    return this.configService.get('OPENAI_WEB_SEARCH') === 'true';
  }

  private shouldSearch(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    if (lower.includes('search') || lower.includes('browse')) {
      return true;
    }

    const keywordsRaw = this.configService.get('AI_WEB_SEARCH_KEYWORDS');
    if (keywordsRaw) {
      const keywords = keywordsRaw
        .split(',')
        .map((item: string) => item.trim().toLowerCase())
        .filter(Boolean);
      if (keywords.some((keyword: string) => lower.includes(keyword))) {
        return true;
      }
    }

    return /(latest|today|current|news|price|release|version|who is|when was|updated|breaking)/.test(
      lower,
    );
  }

  formatSearchResults(results?: WebSearchResults): string | null {
    if (!results || !results.summary) {
      return null;
    }

    const sources = results.sources
      .slice(0, 6)
      .map((source: any) => `- ${source.title ? source.title + ' ' : ''}(${source.url})`)
      .join('\n');

    return `Web search summary:\n${results.summary}\n\nSources:\n${sources}`;
  }

  // -- Helpers --------------------------------------------------------------

  private formatUXPlan(plan: any): string {
    return [
      `Layout: ${plan.layout}`,
      `Density: ${plan.densityNotes || 'compact'}`,
      `Interaction: ${plan.interactionModel || 'read-only'}`,
      '',
      'Sections:',
      ...(plan.sections || []).map(
        (s: any) =>
          `- ${s.purpose}: ${s.componentType}${s.density ? ` (${s.density})` : ''}`,
      ),
      '',
      plan.iconSuggestions?.length
        ? `Icon suggestions: ${plan.iconSuggestions.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
}
