import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIGenerationContext,
  UISchemaChunk,
  AIProvider,
  AIUsageMetrics,
  AITelemetry,
  AISafetyDecision,
} from './providers/ai-provider.interface';
import { WebSearchService, WebSearchResults } from './tools/web-search.service';
import { ManifestLoaderService } from './manifest-loader.service';
import { UXDesignerAgentService } from './agents/ux-designer-agent.service';
import { ValidatorAgentService as ManifestValidatorService } from './agents/validator-agent.service';
import { RepairAgentService } from './agents/repair-agent.service';
import { RouterAgentService } from './agents/router-agent.service';
import { SummarizerAgentService } from './agents/summarizer-agent.service';
import { EthicsGateService } from './agents/ethics-gate.service';
import { summarizeUsage } from './usage/usage-utils';

/**
 * Agent Orchestrator
 *
 * Full pipeline:
 *   0. Ethics gate
 *   1. Route decision (patch/replace, UX plan, search, model tier)
 *   2. Web search enrichment (optional)
 *   3. Context compression
 *   4. UX Designer plan (optional)
 *   5. UI Provider generation (streamed)
 *   6. Validator + repair loop
 */
@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  private readonly MAX_REPAIR_ROUNDS = 2;

  constructor(
    private configService: ConfigService,
    private webSearchService: WebSearchService,
    private manifestLoader: ManifestLoaderService,
    private ethicsGate: EthicsGateService,
    private routerAgent: RouterAgentService,
    private summarizerAgent: SummarizerAgentService,
    private uxDesigner: UXDesignerAgentService,
    private validator: ManifestValidatorService,
    private repairAgent: RepairAgentService,
  ) {}

  // -- Public API -----------------------------------------------------------

  async *generateUI(
    context: AIGenerationContext,
    provider: AIProvider,
  ): AsyncIterableIterator<UISchemaChunk> {
    const trace = this.traceId(context);
    const startedAt = Date.now();
    const usageByLayer: AIUsageMetrics[] = [];
    this.logger.log(
      `[${trace}] orchestrator_generate_start provider=${provider.name} promptLen=${(context.userPrompt || '').length} historyCount=${context.conversationHistory?.length || 0}`,
    );

    const safetyResult = await this.ethicsGate.evaluate(context);
    this.pushUsage(usageByLayer, safetyResult.usage);
    this.logger.log(
      `[${trace}] safety_decision allowed=${safetyResult.decision.allowed} category=${safetyResult.decision.category}`,
    );

    if (!safetyResult.decision.allowed) {
      yield {
        type: 'error',
        data: {
          error:
            safetyResult.decision.reason ||
            'Request blocked by ethics policy gate.',
          code: 'ETHICS_GATE_BLOCKED',
        },
        done: true,
        meta: {
          safety: safetyResult.decision,
          telemetry: this.buildTelemetry(usageByLayer),
        },
      };
      return;
    }

    const routingResult = await this.routerAgent.decideForGenerate(context);
    const routingDecision = routingResult.decision;
    this.pushUsage(usageByLayer, routingResult.usage);
    this.logger.log(
      `[${trace}] routing_generate mode=${routingDecision.mode} tier=${routingDecision.modelTier} ux=${routingDecision.runUxPlan} search=${routingDecision.runWebSearch}`,
    );

    let routedContext: AIGenerationContext = {
      ...context,
      routingDecision,
    };

    if (routingDecision.runWebSearch) {
      this.logger.log(`[${trace}] web_search_enrichment_start`);
      routedContext = await this.enrichContext(routedContext);
      this.logger.log(
        `[${trace}] web_search_enrichment_done hasResults=${!!routedContext.searchResults?.summary}`,
      );
    }

    this.logger.log(`[${trace}] summarizer_start`);
    const summarized = await this.summarizerAgent.compress(routedContext);
    routedContext = summarized.context;
    this.pushUsage(usageByLayer, summarized.usage);
    this.logger.log(
      `[${trace}] summarizer_done summaryChars=${(routedContext.contextSummary || '').length} hasDigest=${!!routedContext.uiStateDigest}`,
    );

    let uxPlanText = '';
    if (routingDecision.runUxPlan) {
      this.logger.log(`[${trace}] ux_plan_start`);
      const uxPlanResult = await this.uxDesigner.planUX(routedContext);
      this.pushUsage(usageByLayer, uxPlanResult.usage);

      if (uxPlanResult.plan) {
        uxPlanText = this.formatUXPlan(uxPlanResult.plan);
        this.logger.log(
          `[${trace}] ux_plan_done sections=${uxPlanResult.plan.sections?.length || 0}`,
        );
      } else {
        this.logger.warn(`[${trace}] ux_plan_empty`);
      }
    }

    const contextWithPlan: AIGenerationContext = {
      ...routedContext,
      uxPlan: uxPlanText || undefined,
      routingDecision,
    };

    let rawSchema: any = null;
    let partialChunks = 0;
    this.logger.log(`[${trace}] provider_generate_start provider=${provider.name}`);

    for await (const chunk of provider.generateUI(contextWithPlan)) {
      if (chunk.type === 'complete') {
        rawSchema = chunk.data;
        this.pushUsage(usageByLayer, chunk.meta?.usage);
        this.logger.log(
          `[${trace}] provider_generate_complete partialChunks=${partialChunks}`,
        );
      } else {
        if (chunk.type === 'partial') {
          partialChunks += 1;
          if (partialChunks === 1 || partialChunks % 25 === 0) {
            this.logger.log(
              `[${trace}] provider_generate_partial count=${partialChunks}`,
            );
          }
        } else if (chunk.type === 'error') {
          this.logger.error(
            `[${trace}] provider_generate_error error=${String(chunk.data?.error || 'unknown')}`,
          );
        }
        yield chunk;
      }
    }

    if (!rawSchema) {
      this.logger.warn(
        `[${trace}] provider_generate_no_schema durationMs=${Date.now() - startedAt}`,
      );
      yield {
        type: 'error',
        data: { error: 'Provider returned no schema' },
        done: true,
        meta: {
          safety: safetyResult.decision,
          telemetry: this.buildTelemetry(usageByLayer),
          routingDecision,
        },
      };
      return;
    }

    for await (const chunk of this.validateAndRepair(
      rawSchema,
      contextWithPlan,
      undefined,
      usageByLayer,
      safetyResult.decision,
    )) {
      if (chunk.type === 'complete') {
        this.logger.log(
          `[${trace}] orchestrator_generate_done durationMs=${Date.now() - startedAt} telemetryTokens=${chunk.meta?.telemetry?.totalTokens || 0} telemetryRequests=${chunk.meta?.telemetry?.totalRequests || 0}`,
        );
      } else if (chunk.type === 'error') {
        this.logger.error(
          `[${trace}] orchestrator_generate_error error=${String(chunk.data?.error || 'unknown')}`,
        );
      }
      yield chunk;
    }
  }

  async *updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext,
    provider: AIProvider,
  ): AsyncIterableIterator<UISchemaChunk> {
    const trace = this.traceId(context);
    const startedAt = Date.now();
    const usageByLayer: AIUsageMetrics[] = [];
    this.logger.log(
      `[${trace}] orchestrator_update_start provider=${provider.name} promptLen=${(context.userPrompt || '').length} hasCurrentSchema=${!!currentSchema}`,
    );

    const contextWithInteraction: AIGenerationContext = {
      ...context,
      lastInteraction: context.lastInteraction || interaction,
    };

    const safetyResult = await this.ethicsGate.evaluate(contextWithInteraction);
    this.pushUsage(usageByLayer, safetyResult.usage);
    this.logger.log(
      `[${trace}] safety_decision allowed=${safetyResult.decision.allowed} category=${safetyResult.decision.category}`,
    );

    if (!safetyResult.decision.allowed) {
      yield {
        type: 'error',
        data: {
          error:
            safetyResult.decision.reason ||
            'Request blocked by ethics policy gate.',
          code: 'ETHICS_GATE_BLOCKED',
        },
        done: true,
        meta: {
          safety: safetyResult.decision,
          telemetry: this.buildTelemetry(usageByLayer),
        },
      };
      return;
    }

    const routingResult = await this.routerAgent.decideForUpdate(
      contextWithInteraction,
      interaction,
    );
    const routingDecision = routingResult.decision;
    this.pushUsage(usageByLayer, routingResult.usage);
    this.logger.log(
      `[${trace}] routing_update mode=${routingDecision.mode} tier=${routingDecision.modelTier} ux=${routingDecision.runUxPlan} search=${routingDecision.runWebSearch}`,
    );

    let routedContext: AIGenerationContext = {
      ...contextWithInteraction,
      routingDecision,
    };

    if (routingDecision.runWebSearch) {
      this.logger.log(`[${trace}] web_search_enrichment_start`);
      routedContext = await this.enrichContext(routedContext);
      this.logger.log(
        `[${trace}] web_search_enrichment_done hasResults=${!!routedContext.searchResults?.summary}`,
      );
    }

    this.logger.log(`[${trace}] summarizer_start`);
    const summarized = await this.summarizerAgent.compress(routedContext);
    routedContext = summarized.context;
    this.pushUsage(usageByLayer, summarized.usage);
    this.logger.log(
      `[${trace}] summarizer_done summaryChars=${(routedContext.contextSummary || '').length} hasDigest=${!!routedContext.uiStateDigest}`,
    );

    let uxPlanText = '';
    if (routingDecision.runUxPlan) {
      this.logger.log(`[${trace}] ux_plan_start`);
      const uxPlanResult = await this.uxDesigner.planUX(routedContext);
      this.pushUsage(usageByLayer, uxPlanResult.usage);

      if (uxPlanResult.plan) {
        uxPlanText = this.formatUXPlan(uxPlanResult.plan);
        this.logger.log(
          `[${trace}] ux_plan_done sections=${uxPlanResult.plan.sections?.length || 0}`,
        );
      } else {
        this.logger.warn(`[${trace}] ux_plan_empty`);
      }
    }

    const contextWithPlan: AIGenerationContext = {
      ...routedContext,
      uxPlan: uxPlanText || undefined,
      routingDecision,
    };

    let rawSchema: any = null;
    let partialChunks = 0;
    this.logger.log(`[${trace}] provider_update_start provider=${provider.name}`);

    for await (const chunk of provider.updateUI(
      currentSchema,
      interaction,
      contextWithPlan,
    )) {
      if (chunk.type === 'complete') {
        rawSchema = chunk.data;
        this.pushUsage(usageByLayer, chunk.meta?.usage);
        this.logger.log(
          `[${trace}] provider_update_complete partialChunks=${partialChunks}`,
        );
      } else {
        if (chunk.type === 'partial') {
          partialChunks += 1;
          if (partialChunks === 1 || partialChunks % 25 === 0) {
            this.logger.log(
              `[${trace}] provider_update_partial count=${partialChunks}`,
            );
          }
        } else if (chunk.type === 'error') {
          this.logger.error(
            `[${trace}] provider_update_error error=${String(chunk.data?.error || 'unknown')}`,
          );
        }
        yield chunk;
      }
    }

    if (!rawSchema) {
      this.logger.warn(
        `[${trace}] provider_update_no_schema durationMs=${Date.now() - startedAt}`,
      );
      yield {
        type: 'error',
        data: { error: 'Provider returned no schema' },
        done: true,
        meta: {
          safety: safetyResult.decision,
          telemetry: this.buildTelemetry(usageByLayer),
          routingDecision,
        },
      };
      return;
    }

    for await (const chunk of this.validateAndRepair(
      rawSchema,
      contextWithPlan,
      currentSchema,
      usageByLayer,
      safetyResult.decision,
    )) {
      if (chunk.type === 'complete') {
        this.logger.log(
          `[${trace}] orchestrator_update_done durationMs=${Date.now() - startedAt} telemetryTokens=${chunk.meta?.telemetry?.totalTokens || 0} telemetryRequests=${chunk.meta?.telemetry?.totalRequests || 0}`,
        );
      } else if (chunk.type === 'error') {
        this.logger.error(
          `[${trace}] orchestrator_update_error error=${String(chunk.data?.error || 'unknown')}`,
        );
      }
      yield chunk;
    }
  }

  // -- Validation & Repair --------------------------------------------------

  private async *validateAndRepair(
    schema: any,
    context: AIGenerationContext,
    baseSchema: any,
    usageByLayer: AIUsageMetrics[],
    safetyDecision?: AISafetyDecision,
  ): AsyncIterableIterator<UISchemaChunk> {
    const trace = this.traceId(context);
    let current = this.normalizePatchPayload(schema, baseSchema);
    let lastValidationErrors: string[] = [];
    let lastValidationWarnings: string[] = [];

    for (let round = 0; round <= this.MAX_REPAIR_ROUNDS; round++) {
      this.logger.log(
        `[${trace}] validate_round_start round=${round + 1}/${this.MAX_REPAIR_ROUNDS + 1}`,
      );
      const result = this.validator.validate(current);
      lastValidationErrors = result.errors.map((error: any) => error.message);
      lastValidationWarnings = result.warnings;

      if (result.valid) {
        current = this.stampVersion(current);

        if (result.warnings.length > 0) {
          this.logger.warn(
            `[${trace}] validation_warnings count=${result.warnings.length}`,
          );
        }

        yield {
          type: 'complete',
          data: current,
          done: true,
          meta: {
            safety: safetyDecision,
            routingDecision: context.routingDecision,
            warnings: result.warnings,
            telemetry: this.buildTelemetry(usageByLayer),
          },
        };
        return;
      }

      this.logger.warn(
        `[${trace}] validation_failed round=${round + 1}/${this.MAX_REPAIR_ROUNDS + 1} errors=${result.errors.length}`,
      );

      if (round < this.MAX_REPAIR_ROUNDS) {
        const repairResult = await this.repairAgent.repair(
          current,
          result.errors.map((e: any) => e.message),
          context,
        );

        if (Array.isArray(repairResult.usage)) {
          repairResult.usage.forEach((usage) => this.pushUsage(usageByLayer, usage));
        }

        current = this.normalizePatchPayload(repairResult.schema, baseSchema);

        if (repairResult.success) {
          this.logger.log(
            `[${trace}] repair_success method=${repairResult.method}`,
          );
          current = this.stampVersion(current);
          yield {
            type: 'complete',
            data: current,
            done: true,
            meta: {
              safety: safetyDecision,
              routingDecision: context.routingDecision,
              warnings: result.warnings,
              telemetry: this.buildTelemetry(usageByLayer),
            },
          };
          return;
        }
      }
    }

    this.logger.error(
      `[${trace}] validation_exhausted rounds=${this.MAX_REPAIR_ROUNDS + 1} errors=${lastValidationErrors.length}`,
    );

    yield {
      type: 'error',
      data: {
        error: 'Generated schema failed renderer validation after repair attempts.',
        code: 'SCHEMA_VALIDATION_FAILED',
        details: lastValidationErrors,
      },
      done: true,
      meta: {
        safety: safetyDecision,
        routingDecision: context.routingDecision,
        warnings: lastValidationWarnings,
        telemetry: this.buildTelemetry(usageByLayer),
      },
    };
  }

  private stampVersion(schema: any): any {
    const manifest = this.manifestLoader.getManifest();
    if (manifest && !schema.manifestVersion) {
      schema.manifestVersion = manifest.manifestVersion;
      schema.rendererVersion = manifest.rendererVersion;
    }
    return schema;
  }

  // -- Telemetry ------------------------------------------------------------

  private pushUsage(target: AIUsageMetrics[], usage?: AIUsageMetrics): void {
    if (!usage) return;
    target.push(usage);
  }

  private buildTelemetry(byLayer: AIUsageMetrics[]): AITelemetry {
    const totals = summarizeUsage(byLayer);
    return {
      byLayer,
      totalTokens: totals.totalTokens,
      totalRequests: totals.totalRequests,
      estimatedCostUsd: totals.estimatedCostUsd,
    };
  }

  // -- Patch Normalization --------------------------------------------------

  private normalizePatchPayload(schema: any, baseSchema?: any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    if (schema.mode !== 'patch' || !Array.isArray(schema.patch)) {
      return schema;
    }

    if (schema.ui && typeof schema.ui === 'object') {
      return schema;
    }

    if (!baseSchema || typeof baseSchema !== 'object') {
      this.logger.warn('Received mode="patch" payload without base schema; skipping patch apply');
      return schema;
    }

    const baseUi = this.extractUiTree(baseSchema);
    if (!baseUi || typeof baseUi !== 'object') {
      this.logger.warn('Patch apply skipped: base schema has no valid UI tree');
      return schema;
    }

    const patchedUi = this.applyPatchOps(baseUi, schema.patch);

    return {
      ...schema,
      mode: 'replace',
      ui: patchedUi,
    };
  }

  private extractUiTree(schema: any): any {
    if (schema?.ui && typeof schema.ui === 'object') {
      return schema.ui;
    }
    return schema;
  }

  private applyPatchOps(baseUi: any, patchOps: any[]): any {
    const current = this.deepClone(baseUi);

    for (const patch of patchOps) {
      if (!patch || typeof patch !== 'object') {
        continue;
      }

      const op = String(patch.op || '').toLowerCase();
      const path = String(patch.path || '');

      try {
        switch (op) {
          case 'add':
            this.applyAdd(current, path, patch.value);
            break;
          case 'remove':
            this.applyRemove(current, path);
            break;
          case 'replace':
          case 'update':
            this.applyReplace(current, path, patch.value);
            break;
          case 'copy':
            this.applyCopy(current, path, patch.from);
            break;
          case 'move':
            this.applyMove(current, path, patch.from);
            break;
          default:
            this.logger.debug(`Unsupported patch operation '${op}' ignored`);
        }
      } catch (error) {
        this.logger.warn(`Patch operation failed (${op} ${path})`, error as any);
      }
    }

    return current;
  }

  private applyAdd(root: any, path: string, value: any): void {
    const target = this.resolveParent(root, path, true);
    if (!target) return;

    const clonedValue = this.deepClone(value);

    if (Array.isArray(target.parent)) {
      if (target.key === '-') {
        target.parent.push(clonedValue);
        return;
      }

      const index = this.asArrayIndex(target.key);
      if (index === null) return;
      target.parent.splice(index, 0, clonedValue);
      return;
    }

    target.parent[target.key] = clonedValue;
  }

  private applyReplace(root: any, path: string, value: any): void {
    const target = this.resolveParent(root, path, true);
    if (!target) return;

    const clonedValue = this.deepClone(value);

    if (Array.isArray(target.parent)) {
      const index = this.asArrayIndex(target.key);
      if (index === null) return;
      target.parent[index] = clonedValue;
      return;
    }

    target.parent[target.key] = clonedValue;
  }

  private applyRemove(root: any, path: string): void {
    const target = this.resolveParent(root, path, false);
    if (!target) return;

    if (Array.isArray(target.parent)) {
      const index = this.asArrayIndex(target.key);
      if (index === null) return;
      target.parent.splice(index, 1);
      return;
    }

    delete target.parent[target.key];
  }

  private applyCopy(root: any, path: string, from: string): void {
    const source = this.readPath(root, from);
    if (source === undefined) return;
    this.applyAdd(root, path, source);
  }

  private applyMove(root: any, path: string, from: string): void {
    const source = this.readPath(root, from);
    if (source === undefined) return;
    this.applyRemove(root, from);
    this.applyAdd(root, path, source);
  }

  private resolveParent(
    root: any,
    path: string,
    createMissing: boolean,
  ): { parent: any; key: string } | null {
    const parts = this.parsePatchPath(path);
    if (parts.length === 0) {
      return null;
    }

    let parent = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const nextKey = parts[i + 1];

      if (Array.isArray(parent)) {
        const index = this.asArrayIndex(key);
        if (index === null) return null;

        if (parent[index] === undefined) {
          if (!createMissing) return null;
          parent[index] = this.shouldCreateArray(nextKey) ? [] : {};
        }

        parent = parent[index];
      } else {
        if (parent[key] === undefined) {
          if (!createMissing) return null;
          parent[key] = this.shouldCreateArray(nextKey) ? [] : {};
        }

        parent = parent[key];
      }

      if (!parent || typeof parent !== 'object') {
        return null;
      }
    }

    return { parent, key: parts[parts.length - 1] };
  }

  private readPath(root: any, path: string): any {
    const parts = this.parsePatchPath(path);
    if (parts.length === 0) return undefined;

    let current = root;
    for (const key of parts) {
      if (Array.isArray(current)) {
        const index = this.asArrayIndex(key);
        if (index === null) return undefined;
        current = current[index];
      } else if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return this.deepClone(current);
  }

  private parsePatchPath(path: string): string[] {
    if (!path) return [];

    const rawParts = path.startsWith('/')
      ? path
          .split('/')
          .slice(1)
          .map((part) => this.unescapeJsonPointer(part))
      : path.split('.');

    const normalized = rawParts.filter(Boolean);

    if (normalized[0] === 'ui' || normalized[0] === 'root') {
      return normalized.slice(1);
    }

    return normalized;
  }

  private unescapeJsonPointer(value: string): string {
    return value.replace(/~1/g, '/').replace(/~0/g, '~');
  }

  private shouldCreateArray(nextKey: string): boolean {
    return nextKey === '-' || /^[0-9]+$/.test(nextKey);
  }

  private asArrayIndex(key: string): number | null {
    if (!/^[0-9]+$/.test(key)) {
      return null;
    }
    return Number.parseInt(key, 10);
  }

  private deepClone(value: any): any {
    if (value === undefined) {
      return undefined;
    }

    try {
      return structuredClone(value);
    } catch {
      return value;
    }
  }

  // -- Web Search Enrichment ------------------------------------------------

  async enrichContext(context: AIGenerationContext): Promise<AIGenerationContext> {
    const trace = this.traceId(context);
    if (!this.isWebSearchEnabled()) {
      this.logger.log(`[${trace}] web_search_skipped reason=disabled`);
      return context;
    }

    const mode = (this.configService.get('AI_WEB_SEARCH_MODE') || 'auto').toLowerCase();
    if (mode === 'never') {
      this.logger.log(`[${trace}] web_search_skipped reason=mode_never`);
      return context;
    }

    const shouldSearch =
      mode === 'always' ? true : this.shouldSearch(context.userPrompt || '');

    if (!shouldSearch) {
      this.logger.log(`[${trace}] web_search_skipped reason=no_keyword_match`);
      return context;
    }

    this.logger.log(`[${trace}] web_search_run mode=${mode}`);
    const results = await this.webSearchService.search(context.userPrompt);
    this.logger.log(
      `[${trace}] web_search_results sources=${results.sources?.length || 0} summaryChars=${(results.summary || '').length}`,
    );
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
    const iconSuggestions = plan.iconSuggestions
      ? Object.entries(plan.iconSuggestions)
          .map(([section, icon]) => `${section}: ${String(icon)}`)
          .join(', ')
      : '';

    const patchStrategy = plan.patchStrategy
      ? `Patch strategy: preferPatch=${plan.patchStrategy.preferPatch ? 'yes' : 'no'}; targets=${(plan.patchStrategy.targetAreas || []).join(', ')}`
      : '';

    return [
      `Layout: ${plan.layout}`,
      `Density: ${plan.densityNotes || 'compact'}`,
      `Interaction: ${plan.interactionModel || 'read-only'}`,
      patchStrategy,
      '',
      'Sections:',
      ...(plan.sections || []).map(
        (s: any) =>
          `- ${s.purpose}: ${s.componentType}${s.density ? ` (${s.density})` : ''}`,
      ),
      '',
      iconSuggestions ? `Icon suggestions: ${iconSuggestions}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private traceId(context: AIGenerationContext): string {
    return context.traceId || 'no-trace';
  }
}
