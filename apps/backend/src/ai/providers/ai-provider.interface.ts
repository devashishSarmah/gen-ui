export interface AIProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  jsonMode: boolean;
  maxTokens: number;
  supportsVision: boolean;
}

export type GenerationMode = 'replace' | 'patch';
export type ModelTier = 'fast' | 'balanced' | 'quality';

export type LayerProvider = 'openai' | 'openrouter' | 'anthropic' | 'gemini' | 'groq';

export interface AIUsageMetrics {
  layer: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
  estimatedCostUsd: number;
}

export interface AITelemetry {
  byLayer: AIUsageMetrics[];
  totalTokens: number;
  totalRequests: number;
  estimatedCostUsd: number;
}

export interface AISafetyDecision {
  allowed: boolean;
  category: 'ok' | 'prompt_injection' | 'illegal' | 'unsafe';
  reason?: string;
  matchedSignals: string[];
}

export interface AIRoutingDecision {
  mode: GenerationMode;
  runUxPlan: boolean;
  runWebSearch: boolean;
  modelTier: ModelTier;
  reasons: string[];
  patchHints?: string[];
}

export interface AIGenerationContext {
  conversationHistory: any[];
  currentUiState?: any;
  userPrompt: string;
  /** Correlation id for end-to-end request tracing in logs */
  traceId?: string;
  lastInteraction?: any;
  searchResults?: {
    summary: string;
    sources: { url: string; title?: string }[];
  };
  /** Structured UX plan from the UX Designer agent */
  uxPlan?: string;
  /** Router decision to steer patch/replace, model tier, and tool usage */
  routingDecision?: AIRoutingDecision;
  /** Deterministic compressed summary of older conversation turns */
  contextSummary?: string;
  /** Compact digest of UI state keys for cheaper context carry-over */
  uiStateDigest?: string;
}

export interface UISchemaChunk {
  type: 'partial' | 'complete' | 'error';
  data: any;
  done: boolean;
  meta?: {
    usage?: AIUsageMetrics;
    telemetry?: AITelemetry;
    routingDecision?: AIRoutingDecision;
    safety?: AISafetyDecision;
    warnings?: string[];
  };
}

export abstract class AIProvider {
  abstract readonly name: string;
  abstract readonly capabilities: AIProviderCapabilities;

  /**
   * Generate UI schema from user prompt
   */
  abstract generateUI(
    context: AIGenerationContext
  ): AsyncIterableIterator<UISchemaChunk>;

  /**
   * Update existing UI based on interaction
   */
  abstract updateUI(
    currentSchema: any,
    interaction: any,
    context: AIGenerationContext
  ): AsyncIterableIterator<UISchemaChunk>;

  /**
   * Check if provider is available and configured
   */
  abstract isAvailable(): Promise<boolean>;
}
