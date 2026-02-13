import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIGenerationContext,
  AIUsageMetrics,
} from '../providers/ai-provider.interface';
import { LayerLLMService } from '../layer-llm.service';

export interface SummarizerResult {
  context: AIGenerationContext;
  usage?: AIUsageMetrics;
}

/**
 * Deterministic context compressor.
 * Keeps recent turns verbatim and summarizes older context to reduce token usage.
 */
@Injectable()
export class SummarizerAgentService {
  private readonly logger = new Logger(SummarizerAgentService.name);
  private readonly MAX_RECENT_MESSAGES = 8;
  private readonly MAX_SUMMARY_CHARS = 1800;
  private readonly MAX_MESSAGE_CHARS = 220;
  private readonly MAX_UI_DIGEST_CHARS = 700;

  constructor(
    private configService: ConfigService,
    private layerLLMService: LayerLLMService,
  ) {}

  async compress(context: AIGenerationContext): Promise<SummarizerResult> {
    const trace = context.traceId || 'no-trace';
    const history = Array.isArray(context.conversationHistory)
      ? context.conversationHistory
      : [];

    this.logger.log(
      `[${trace}] summarizer_start historyCount=${history.length}`,
    );

    if (history.length === 0) {
      this.logger.log(`[${trace}] summarizer_skip reason=no_history`);
      return {
        context: {
          ...context,
          uiStateDigest: this.buildUiStateDigest(context.currentUiState),
        },
      };
    }

    const recentHistory = history.slice(-this.MAX_RECENT_MESSAGES);
    const olderHistory = history.slice(0, -this.MAX_RECENT_MESSAGES);

    let contextSummary: string | undefined;
    if (olderHistory.length > 0) {
      const summaryLines = olderHistory.map((message, index) => {
        const role = String(message?.role || 'unknown');
        const content = this.extractMessageContent(message);
        return `${index + 1}. ${role}: ${this.truncate(content, this.MAX_MESSAGE_CHARS)}`;
      });

      contextSummary = this.truncate(
        `Earlier conversation summary:\n${summaryLines.join('\n')}`,
        this.MAX_SUMMARY_CHARS,
      );
    }

    const deterministicContext: AIGenerationContext = {
      ...context,
      conversationHistory: recentHistory,
      contextSummary,
      uiStateDigest: this.buildUiStateDigest(context.currentUiState),
    };

    const shouldUseLlmFallback =
      String(this.configService.get('AI_SUMMARIZER_FALLBACK_LLM') ?? 'false') === 'true';

    if (!shouldUseLlmFallback || !contextSummary) {
      this.logger.log(
        `[${trace}] summarizer_deterministic_only fallback=${shouldUseLlmFallback} hasContextSummary=${!!contextSummary}`,
      );
      return { context: deterministicContext };
    }

    try {
      this.logger.log(`[${trace}] summarizer_llm_fallback_start`);
      const llm = await this.layerLLMService.complete({
        layer: 'summarizer',
        traceId: context.traceId,
        modelTier: 'fast',
        responseType: 'json',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'You compress chat context. Return ONLY JSON with keys: contextSummary(string <= 400 tokens) and keyPreferences(string[]). Keep it factual and compact.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              deterministicSummary: contextSummary,
              uiStateDigest: deterministicContext.uiStateDigest,
              userPrompt: context.userPrompt,
            }),
          },
        ],
      });

      if (!llm?.json) {
        this.logger.warn(`[${trace}] summarizer_llm_fallback_empty`);
        return { context: deterministicContext };
      }

      const betterSummary = this.truncate(
        String(llm.json.contextSummary || contextSummary),
        this.MAX_SUMMARY_CHARS,
      );

      const keyPreferences = Array.isArray(llm.json.keyPreferences)
        ? llm.json.keyPreferences.map((v: any) => String(v)).slice(0, 8)
        : [];

      return {
        context: {
          ...deterministicContext,
          contextSummary:
            keyPreferences.length > 0
              ? `${betterSummary}\n\nKey preferences: ${keyPreferences.join(', ')}`
              : betterSummary,
        },
        usage: llm.usage,
      };
    } catch {
      this.logger.warn(`[${trace}] summarizer_llm_fallback_failed`);
      return { context: deterministicContext };
    }
  }

  private extractMessageContent(message: any): string {
    if (!message) return '';

    if (typeof message.content === 'string' && message.content.trim()) {
      return message.content.trim();
    }

    if (message.uiSchema) {
      return `uiSchema=${this.safeStringify(message.uiSchema)}`;
    }

    return this.safeStringify(message);
  }

  private buildUiStateDigest(uiState: any): string | undefined {
    if (!uiState || typeof uiState !== 'object') {
      return undefined;
    }

    const entries = Object.entries(uiState);
    const topEntries = entries.slice(0, 20).map(([key, value]) => {
      return `${key}: ${this.describeValue(value)}`;
    });

    const extraCount = Math.max(0, entries.length - topEntries.length);
    const extraSuffix = extraCount > 0 ? `; +${extraCount} more keys` : '';

    return this.truncate(
      `UI state digest (${entries.length} keys): ${topEntries.join('; ')}${extraSuffix}`,
      this.MAX_UI_DIGEST_CHARS,
    );
  }

  private describeValue(value: any): string {
    if (value === null || value === undefined) return 'null';

    if (Array.isArray(value)) {
      return `array(len=${value.length})`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const preview = keys.slice(0, 5).join(', ');
      const suffix = keys.length > 5 ? ', ...' : '';
      return `object(keys=${keys.length}${preview ? `: ${preview}${suffix}` : ''})`;
    }

    if (typeof value === 'string') {
      return `"${this.truncate(value, 60)}"`;
    }

    return String(value);
  }

  private safeStringify(value: any): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }

  private truncate(value: string, maxChars: number): string {
    if (!value) return '';
    if (value.length <= maxChars) return value;
    return `${value.slice(0, maxChars - 3)}...`;
  }
}
