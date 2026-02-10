export interface AIProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  jsonMode: boolean;
  maxTokens: number;
  supportsVision: boolean;
}

export interface AIGenerationContext {
  conversationHistory: any[];
  currentUiState?: any;
  userPrompt: string;
  lastInteraction?: any;
  searchResults?: {
    summary: string;
    sources: { url: string; title?: string }[];
  };
}

export interface UISchemaChunk {
  type: 'partial' | 'complete' | 'error';
  data: any;
  done: boolean;
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
