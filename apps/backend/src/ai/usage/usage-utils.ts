import { ConfigService } from '@nestjs/config';
import { AIUsageMetrics } from '../providers/ai-provider.interface';

export interface UsageNumbers {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function normalizeUsage(
  rawUsage: any,
  promptText: string,
  completionText: string,
): UsageNumbers {
  const promptTokens =
    Number(rawUsage?.prompt_tokens ?? rawUsage?.input_tokens ?? rawUsage?.inputTokens) ||
    estimateTokens(promptText);

  const completionTokens =
    Number(
      rawUsage?.completion_tokens ??
        rawUsage?.output_tokens ??
        rawUsage?.completionTokens ??
        rawUsage?.outputTokens,
    ) || estimateTokens(completionText);

  const totalTokens =
    Number(rawUsage?.total_tokens ?? rawUsage?.totalTokens) ||
    promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

export function buildUsageMetrics(params: {
  layer: string;
  provider: string;
  model: string;
  promptText: string;
  completionText: string;
  rawUsage?: any;
  configService: ConfigService;
  requests?: number;
}): AIUsageMetrics {
  const usage = normalizeUsage(params.rawUsage, params.promptText, params.completionText);

  const providerKey = params.provider.toUpperCase();
  const inputPer1k =
    Number(params.configService.get(`AI_COST_${providerKey}_INPUT_PER_1K`)) || 0;
  const outputPer1k =
    Number(params.configService.get(`AI_COST_${providerKey}_OUTPUT_PER_1K`)) || 0;

  const estimatedCostUsd =
    (usage.promptTokens / 1000) * inputPer1k +
    (usage.completionTokens / 1000) * outputPer1k;

  return {
    layer: params.layer,
    provider: params.provider,
    model: params.model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    requests: params.requests ?? 1,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(8)),
  };
}

export function summarizeUsage(byLayer: AIUsageMetrics[]): {
  totalTokens: number;
  totalRequests: number;
  estimatedCostUsd: number;
} {
  const totals = byLayer.reduce(
    (acc, usage) => {
      acc.totalTokens += usage.totalTokens || 0;
      acc.totalRequests += usage.requests || 0;
      acc.estimatedCostUsd += usage.estimatedCostUsd || 0;
      return acc;
    },
    { totalTokens: 0, totalRequests: 0, estimatedCostUsd: 0 },
  );

  totals.estimatedCostUsd = Number(totals.estimatedCostUsd.toFixed(8));
  return totals;
}
