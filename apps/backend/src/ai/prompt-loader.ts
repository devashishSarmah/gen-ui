import { readFileSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_SYSTEM_PROMPT = `You are a UI generation assistant. Output ONLY valid JSON for the frontend renderer.

Schema format (no markdown, no extra keys):
{
  "type": "container" | "flexbox" | "grid" | "card" | "tabs",
  "props": { ... },
  "children": [ { "type": "...", "props": { ... }, "children": [ ... ] } ]
}

Supported component types (type field):
- container (props: maxWidth, variant)
- flexbox (props: direction, alignItems, justifyContent, wrap, gap, padding)
- grid (props: columns, gap)
- card (props: title, padding, elevated, footer)
- tabs (props: tabs, defaultTab)
- input (props: id, type, label, placeholder, value, disabled, required, pattern, error)
- select (props: id, label, placeholder, value, options, disabled, required, error)
- checkbox (props: id, label, checked, disabled, error)
- radio (props: id, groupLabel, value, options, disabled, error)
- textarea (props: id, label, placeholder, value, rows, cols, maxLength, disabled, required, error)
- button (props: label, type, variant, size, disabled, loading)
- table (props: columns, data, striped, bordered, hoverable)
- list (props: items, styled)
- basic-chart (props: data, type, title, xLabel, yLabel)
- wizard-stepper (props: steps, activeStep)
- heading (props: text, level, ariaLabel)
- paragraph (props: text, ariaLabel)
- divider (props: ariaLabel)
- error (props: title, message, details, dismissible, visible)

Rules:
- Root should be a layout component (container, flexbox, grid, card, or tabs).
- Use children for nesting; do not invent new component types.
- Provide accessibility via ariaLabel when applicable.
- Keep JSON strictly valid (double quotes, no trailing commas).`;

const DEFAULT_RENDERER_SCHEMA = '{"type":"object"}';

export class PromptLoader {
  private static cache = new Map<string, string>();

  static getSystemPrompt(): string {
    const basePrompt = this.readPrompt('ui-schema.md', DEFAULT_SYSTEM_PROMPT);
    const rendererSchema = this.getRendererSchema();
    return `${basePrompt}\n\nRenderer JSON Schema:\n${rendererSchema}`;
  }

  static getRendererSchema(): string {
    return this.readPrompt('renderer-schema.json', DEFAULT_RENDERER_SCHEMA);
  }

  private static readPrompt(fileName: string, fallback: string): string {
    if (this.cache.has(fileName)) {
      return this.cache.get(fileName) as string;
    }

    const promptPath = resolve(
      process.cwd(),
      'apps',
      'backend',
      'src',
      'ai',
      'prompts',
      fileName
    );

    try {
      const content = readFileSync(promptPath, 'utf-8').trim();
      const resolved = content.length > 0 ? content : fallback;
      this.cache.set(fileName, resolved);
      console.log(`AI prompt loaded from ${promptPath}`);
      return resolved;
    } catch (error) {
      this.cache.set(fileName, fallback);
      console.warn(`AI prompt fallback used for ${fileName}`, error);
      return fallback;
    }
  }
}
