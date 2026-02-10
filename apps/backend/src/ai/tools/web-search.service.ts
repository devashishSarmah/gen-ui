import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface WebSearchSource {
  url: string;
  title?: string;
}

export interface WebSearchResults {
  summary: string;
  sources: WebSearchSource[];
}

@Injectable()
export class WebSearchService {
  private client: OpenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
    this.model = this.configService.get('OPENAI_WEB_SEARCH_MODEL') || 'gpt-5';
  }

  async search(query: string): Promise<WebSearchResults> {
    const response = await this.client.responses.create({
      model: this.model,
      tools: [this.buildWebSearchTool()],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources' as unknown as any],
      input: [
        {
          role: 'system',
          content:
            'You are a web research tool. Search the web and return JSON only. ' +
            'Return a JSON object with keys: summary (string) and sources (array of {url,title}).',
        },
        { role: 'user', content: query },
      ],
    });

    const text = this.extractResponseText(response);
    const parsed = this.parseJson(text);
    const sources = this.extractSources(response);

    return {
      summary: parsed.summary || text,
      sources: parsed.sources?.length ? parsed.sources : sources,
    };
  }

  private buildWebSearchTool(): any {
    const allowlistRaw = this.configService.get('OPENAI_WEB_SEARCH_ALLOWLIST') || '';
    const allowlist = allowlistRaw
      .split(',')
      .map((domain: string) => domain.trim())
      .filter((domain: string) => domain.length > 0);

    const external = this.configService.get('OPENAI_WEB_SEARCH_EXTERNAL');

    const tool: any = { type: 'web_search' };
    if (allowlist.length > 0) {
      tool.filters = { allowed_domains: allowlist };
    }
    if (external === 'false') {
      tool.external_web_access = false;
    }

    return tool;
  }

  private extractResponseText(response: any): string {
    if (response?.output_text) {
      return response.output_text;
    }

    const output = response?.output || [];
    for (const item of output) {
      if (item?.type === 'message') {
        const content = item.content || [];
        const outputText = content.find((entry: any) => entry.type === 'output_text');
        if (outputText?.text) {
          return outputText.text;
        }
      }
    }

    return '';
  }

  private parseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  private extractSources(response: any): WebSearchSource[] {
    const sources: WebSearchSource[] = [];
    const output = response?.output || [];

    for (const item of output) {
      if (item?.type === 'web_search_call' && item?.action?.sources) {
        for (const source of item.action.sources) {
          if (source?.url) {
            sources.push({ url: source.url, title: source.title });
          }
        }
      }
    }

    return sources;
  }
}
