import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIGenerationContext } from './providers/ai-provider.interface';
import { WebSearchService, WebSearchResults } from './tools/web-search.service';

@Injectable()
export class AgentOrchestratorService {
  constructor(
    private configService: ConfigService,
    private webSearchService: WebSearchService
  ) {}

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

    return /(latest|today|current|news|price|release|version|who is|when was|updated|breaking)/.test(
      lower
    );
  }

  formatSearchResults(results?: WebSearchResults): string | null {
    if (!results || !results.summary) {
      return null;
    }

    const sources = results.sources
      .slice(0, 6)
      .map((source) => `- ${source.title ? source.title + ' ' : ''}(${source.url})`)
      .join('\n');

    return `Web search summary:\n${results.summary}\n\nSources:\n${sources}`;
  }
}
