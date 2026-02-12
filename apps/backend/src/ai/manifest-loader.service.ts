import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import Ajv, { ValidateFunction } from 'ajv';

export interface ComponentManifest {
  manifestVersion: string;
  generatedAt: string;
  rendererVersion: string;
  components: ManifestComponent[];
  density: {
    defaultMode: string;
    tokens: Record<string, string>;
  };
  iconPolicy: {
    provider: string;
    format: string;
    fallback: string[];
  };
  interactionSafety: {
    forbiddenPatterns: string[];
    allowedInteractions: string[];
  };
}

export interface ManifestComponent {
  type: string;
  category: string;
  description: string;
  propsSchema: Record<string, any>;
  childrenRules: { isContainer: boolean; contentHost?: string };
  defaults: Record<string, any>;
  constraints: any;
  deprecated?: boolean;
}

@Injectable()
export class ManifestLoaderService implements OnModuleInit {
  private readonly logger = new Logger(ManifestLoaderService.name);

  private manifest: ComponentManifest | null = null;
  private jsonSchema: any = null;
  private systemPrompt: string = '';
  private schemaValidator: ValidateFunction | null = null;
  private componentWhitelist: Set<string> = new Set();
  private ajv: Ajv;

  constructor(private configService: ConfigService) {
    this.ajv = new Ajv({ allErrors: true });
  }

  onModuleInit() {
    this.loadManifest();

    // In dev mode, reload on interval
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    if (isDev) {
      const interval = 30_000; // 30s
      setInterval(() => this.loadManifest(), interval);
      this.logger.log(`Dev mode: manifest auto-refresh every ${interval / 1000}s`);
    }
  }

  private loadManifest(): void {
    // Try generated manifest first, then fall back
    const manifestPath = resolve(
      process.cwd(),
      'libs', 'design-system', 'src', 'lib', 'manifest', 'dist',
      'genui-manifest.json',
    );

    const schemaPath = resolve(
      process.cwd(),
      'apps', 'backend', 'src', 'ai', 'prompts',
      'renderer-schema.json',
    );

    const promptPath = resolve(
      process.cwd(),
      'apps', 'backend', 'src', 'ai', 'prompts',
      'ui-schema.md',
    );

    try {
      // Load manifest
      if (existsSync(manifestPath)) {
        const raw = readFileSync(manifestPath, 'utf-8');
        this.manifest = JSON.parse(raw);
        this.componentWhitelist = new Set(
          this.manifest!.components.map((c) => c.type),
        );
        this.logger.log(
          `Manifest loaded: v${this.manifest!.manifestVersion} (${this.manifest!.components.length} components)`,
        );
      } else {
        this.logger.warn(`Manifest not found at ${manifestPath}. Run: npx ts-node libs/design-system/src/lib/manifest/build-manifest.ts`);
      }

      // Load JSON schema
      if (existsSync(schemaPath)) {
        const raw = readFileSync(schemaPath, 'utf-8');
        this.jsonSchema = JSON.parse(raw);
        this.schemaValidator = this.ajv.compile(this.jsonSchema);
      }

      // Load system prompt
      if (existsSync(promptPath)) {
        this.systemPrompt = readFileSync(promptPath, 'utf-8').trim();
      }
    } catch (error) {
      this.logger.error('Failed to load manifest', error);
    }
  }

  getManifest(): ComponentManifest | null {
    return this.manifest;
  }

  getManifestVersion(): string {
    return this.manifest?.manifestVersion || 'unknown';
  }

  getRendererVersion(): string {
    return this.manifest?.rendererVersion || '1.0.0';
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  getJsonSchema(): any {
    return this.jsonSchema;
  }

  getComponentWhitelist(): Set<string> {
    return this.componentWhitelist;
  }

  /**
   * Validate a UI schema tree against the manifest-generated JSON schema
   * and the component whitelist
   */
  validateSchema(schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Check manifestVersion in output
    if (this.manifest && schema.manifestVersion && schema.manifestVersion !== this.manifest.manifestVersion) {
      errors.push(
        `Manifest version mismatch: expected ${this.manifest.manifestVersion}, got ${schema.manifestVersion}`,
      );
    }

    // 2. Extract the actual UI tree (handle both wrapped and unwrapped formats)
    const uiTree = schema.ui || schema;

    // 3. JSON Schema validation
    if (this.schemaValidator) {
      const valid = this.schemaValidator(uiTree);
      if (!valid && this.schemaValidator.errors) {
        for (const err of this.schemaValidator.errors) {
          errors.push(`${err.instancePath || '/'}: ${err.message}`);
        }
      }
    }

    // 4. Component whitelist check
    const whitelistErrors = this.validateWhitelist(uiTree);
    errors.push(...whitelistErrors);

    // 5. Emoji check — skipped: icon policy now allows emojis alongside Lucide
    // const emojiErrors = this.validateNoEmojis(uiTree);
    // errors.push(...emojiErrors);

    // 6. Interaction safety check
    const safetyErrors = this.validateInteractionSafety(uiTree);
    errors.push(...safetyErrors);

    // 7. Size check (1MB max)
    const size = JSON.stringify(schema).length;
    if (size > 1024 * 1024) {
      errors.push(`Schema size ${size} bytes exceeds 1MB limit`);
    }

    return { valid: errors.length === 0, errors };
  }

  private validateWhitelist(node: any, path = 'root'): string[] {
    const errors: string[] = [];
    if (!node || typeof node !== 'object') return errors;

    if (node.type && !this.componentWhitelist.has(node.type)) {
      errors.push(`Unknown component '${node.type}' at ${path}`);
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, i: number) => {
        errors.push(...this.validateWhitelist(child, `${path}.children[${i}]`));
      });
    }

    // Also handle legacy `components` array
    if (Array.isArray(node.components)) {
      node.components.forEach((child: any, i: number) => {
        errors.push(...this.validateWhitelist(child, `${path}.components[${i}]`));
      });
    }

    return errors;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private validateNoEmojis(node: any, path = 'root'): string[] {
    const errors: string[] = [];
    // Broad emoji regex: flags, pictographics, emoticons, symbols, dingbats
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;

    const checkValue = (val: any, p: string) => {
      if (typeof val === 'string' && emojiRegex.test(val)) {
        errors.push(`Emoji found in "${p}": "${val.slice(0, 50)}". Use Lucide icon names instead.`);
      }
      if (Array.isArray(val)) {
        val.forEach((item, i) => checkValue(item, `${p}[${i}]`));
      }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        for (const [k, v] of Object.entries(val)) {
          checkValue(v, `${p}.${k}`);
        }
      }
    };

    checkValue(node, path);
    return errors;
  }

  private validateInteractionSafety(node: any, path = 'root'): string[] {
    const errors: string[] = [];
    if (!node || typeof node !== 'object') return errors;

    // Check for form submit patterns
    if (node.type === 'button' && node.props?.type === 'submit') {
      errors.push(`${path}: Button type="submit" is forbidden. Use type="button" with explicit actions.`);
    }

    // Check events for dangerous patterns
    if (node.events) {
      for (const [eventName, handler] of Object.entries(node.events)) {
        if (typeof handler === 'string') {
          const lower = handler.toLowerCase();
          if (lower.includes('submit') || lower.includes('post ') || lower.includes('window.location')) {
            errors.push(`${path}.events.${eventName}: Forbidden interaction pattern detected.`);
          }
        }
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, i: number) => {
        errors.push(...this.validateInteractionSafety(child, `${path}.children[${i}]`));
      });
    }

    return errors;
  }

  /**
   * Deterministic schema sanitizer (repair pass).
   * Cleans up common issues before validation fails hard.
   */
  sanitizeSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema;

    const ui = schema.ui || schema;
    const sanitized = this.sanitizeNode(ui);

    if (schema.ui) {
      return {
        ...schema,
        manifestVersion: this.manifest?.manifestVersion || schema.manifestVersion,
        rendererVersion: this.manifest?.rendererVersion || schema.rendererVersion,
        ui: sanitized,
      };
    }

    return sanitized;
  }

  private sanitizeNode(node: any): any {
    if (!node || typeof node !== 'object') return node;

    // Remove unknown component types (replace with container)
    if (node.type && !this.componentWhitelist.has(node.type)) {
      this.logger.warn(`Sanitizer: replacing unknown type '${node.type}' with container`);
      node.type = 'container';
      node.props = node.props || {};
    }

    // Strip unknown props
    if (node.type && node.props) {
      const comp = this.manifest?.components.find((c) => c.type === node.type);
      if (comp) {
        const allowedProps = new Set(Object.keys(comp.propsSchema));
        const cleanedProps: any = {};
        for (const [k, v] of Object.entries(node.props)) {
          if (allowedProps.has(k)) {
            cleanedProps[k] = v;
          }
        }
        node.props = cleanedProps;

        // Fill required defaults that are missing
        for (const [k, schema] of Object.entries(comp.propsSchema)) {
          if (schema.default !== undefined && node.props[k] === undefined) {
            // Don't force defaults, they're optional
          }
        }
      }
    }

    // Force button type to "button" (never "submit")
    if (node.type === 'button' && node.props?.type === 'submit') {
      node.props.type = 'button';
    }

    // Replace emojis in string props with safe Lucide icon names
    if (node.props) {
      for (const [key, value] of Object.entries(node.props)) {
        if (key === 'icon' && typeof value === 'string') {
          node.props[key] = this.emojiToLucide(value);
        }
      }
    }

    // Recurse into children
    if (Array.isArray(node.children)) {
      node.children = node.children.map((child: any) => this.sanitizeNode(child));
    }

    return node;
  }

  private emojiToLucide(value: string): string {
    // If it's already a valid lucide name (kebab-case alphanumeric), keep it
    if (/^[a-z][a-z0-9-]*$/.test(value)) return value;

    // Common emoji → lucide mappings
    const map: Record<string, string> = {
      '📊': 'bar-chart-3',
      '📈': 'trending-up',
      '📉': 'trending-down',
      '✅': 'check-circle',
      '❌': 'x-circle',
      '⚠️': 'alert-triangle',
      '🔔': 'bell',
      '🔍': 'search',
      '⚙️': 'settings',
      '👤': 'user',
      '👥': 'users',
      '📁': 'folder',
      '📄': 'file-text',
      '📌': 'pin',
      '📎': 'paperclip',
      '📍': 'map-pin',
      '📨': 'mail',
      '🔐': 'lock',
      '🔑': 'key',
      '🏠': 'home',
      '🌟': 'star',
      '🌈': 'rainbow',
      '🎯': 'target',
      '🏁': 'flag',
      '▶️': 'play',
      '⏸️': 'pause',
      '⏹️': 'square',
      '✨': 'sparkles',
      '💡': 'lightbulb',
      '🔥': 'flame',
      '❤️': 'heart',
      '📱': 'smartphone',
      '💻': 'laptop',
      '🖥️': 'monitor',
      '🔒': 'lock',
      '🔓': 'unlock',
      '📝': 'edit',
      '🗑️': 'trash-2',
      '➕': 'plus',
      '➖': 'minus',
      '✏️': 'pencil',
      '📋': 'clipboard',
      '📆': 'calendar',
      '⏰': 'clock',
      '💬': 'message-circle',
      '🔗': 'link',
      '🌐': 'globe',
      '☁️': 'cloud',
      '1️⃣': 'circle-1',
      '2️⃣': 'circle-2',
      '3️⃣': 'circle-3',
      '4️⃣': 'circle-4',
      '5️⃣': 'circle-5',
    };

    return map[value] || 'circle';
  }
}
