/**
 * Manifest Generator — Single Source of Truth
 *
 * Reads COMPONENT_LIBRARY metadata from the design-system and produces:
 *   1. genui-manifest.json   — versioned component manifest
 *   2. renderer-schema.json  — JSON Schema for validation (auto-generated)
 *   3. system-prompt.md      — LLM instruction text   (auto-generated)
 *
 * Run:  npx ts-node libs/design-system/src/lib/manifest/generate-manifest.ts
 */

import { createHash } from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ManifestComponent {
  type: string;
  category: string;
  description: string;
  propsSchema: Record<string, any>;
  childrenRules: {
    isContainer: boolean;
    contentHost?: string;
  };
  defaults: Record<string, any>;
  constraints: {
    density?: {
      compact: Record<string, any>;
    };
    iconFormat?: 'lucide';
  };
  deprecated?: boolean;
}

export interface ComponentManifest {
  manifestVersion: string;
  generatedAt: string;
  rendererVersion: string;
  components: ManifestComponent[];
  density: {
    defaultMode: 'compact' | 'normal';
    tokens: Record<string, string>;
  };
  iconPolicy: {
    provider: 'lucide';
    format: 'kebab-case';
    fallback: string[];
    emojiAllowed: boolean;
  };
  interactionSafety: {
    forbiddenPatterns: string[];
    allowedInteractions: string[];
  };
}

// ── Container info (which components support children) ─────────────────────

const CONTAINER_MAP: Record<string, string> = {
  container: 'containerHost',
  grid: 'gridHost',
  card: 'cardContent',
  tabs: 'tabsHost',
  flexbox: 'flexHost',
  accordion: 'accordionHost',
  toolbar: 'toolbarHost',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function extractDefaults(propsSchema: Record<string, any>): Record<string, any> {
  const defaults: Record<string, any> = {};
  for (const [key, schema] of Object.entries(propsSchema)) {
    if (schema.default !== undefined) {
      defaults[key] = schema.default;
    }
  }
  return defaults;
}

function compactOverrides(propsSchema: Record<string, any>): Record<string, any> {
  const overrides: Record<string, any> = {};
  // For components that accept size, density, gap, padding — provide compact defaults
  if (propsSchema.size) overrides.size = 'small';
  if (propsSchema.gap) overrides.gap = 8;
  if (propsSchema.padding) overrides.padding = 8;
  return overrides;
}

export function buildManifest(
  componentLibrary: Array<{
    name: string;
    category: string;
    description: string;
    propsSchema: Record<string, any>;
  }>,
  rendererVersion = '1.0.0',
): ComponentManifest {
  const components: ManifestComponent[] = componentLibrary.map((lib) => ({
    type: lib.name,
    category: lib.category,
    description: lib.description,
    propsSchema: lib.propsSchema,
    childrenRules: {
      isContainer: !!CONTAINER_MAP[lib.name],
      ...(CONTAINER_MAP[lib.name] ? { contentHost: CONTAINER_MAP[lib.name] } : {}),
    },
    defaults: extractDefaults(lib.propsSchema),
    constraints: {
      density: {
        compact: compactOverrides(lib.propsSchema),
      },
      iconFormat: 'lucide' as const,
    },
  }));

  const manifest: ComponentManifest = {
    manifestVersion: '', // computed below
    generatedAt: new Date().toISOString(),
    rendererVersion,
    components,
    density: {
      defaultMode: 'compact',
      tokens: {
        '--ds-density-gap': '0.5rem',
        '--ds-density-padding': '0.75rem',
        '--ds-density-font-size': '0.8rem',
        '--ds-density-line-height': '1.4',
        '--ds-density-heading-scale': '0.85',
      },
    },
    iconPolicy: {
      provider: 'lucide',
      format: 'kebab-case',
      fallback: ['circle', 'info', 'alert-circle', 'check-circle'],
      emojiAllowed: true,
    },
    interactionSafety: {
      forbiddenPatterns: [
        'form[action]',
        'submit to URL',
        'POST request from form',
        'window.location redirect',
        'external API call from UI',
      ],
      allowedInteractions: [
        'filter-locally',
        'open-details',
        'paginate',
        'select-compare',
        'copy-to-clipboard',
        'toggle-expand',
        'sort-column',
        'switch-tab',
        'step-navigation',
      ],
    },
  };

  // Generate version hash from content
  const hash = createHash('sha256')
    .update(JSON.stringify(manifest.components))
    .digest('hex')
    .slice(0, 12);
  manifest.manifestVersion = `${rendererVersion}-${hash}`;

  return manifest;
}

// ── JSON Schema generation from manifest ──────────────────────────────────

export function manifestToJsonSchema(manifest: ComponentManifest): any {
  const definitions: Record<string, any> = {};
  const refs: any[] = [];

  // Events definition (shared)
  definitions['events'] = {
    type: 'object',
    additionalProperties: true,
  };

  // Node reference (all component types)
  const nodeRefs: any[] = [];

  for (const comp of manifest.components) {
    const defName = comp.type.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const propsDef: Record<string, any> = {};

    for (const [key, schema] of Object.entries(comp.propsSchema)) {
      propsDef[key] = propsSchemaToJsonSchema(schema);
    }

    const componentDef: any = {
      type: 'object',
      required: ['type'],
      properties: {
        type: { const: comp.type },
        props: {
          type: 'object',
          properties: propsDef,
          additionalProperties: false,
        },
        events: { $ref: '#/definitions/events' },
      },
      additionalProperties: false,
    };

    // If container, add children property
    if (comp.childrenRules.isContainer) {
      componentDef.properties.children = {
        type: 'array',
        items: { $ref: '#/definitions/node' },
      };
    }

    definitions[defName] = componentDef;
    refs.push({ $ref: `#/definitions/${defName}` });
    nodeRefs.push({ $ref: `#/definitions/${defName}` });
  }

  definitions['node'] = { oneOf: nodeRefs };

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Gen-UI Renderer Schema',
    description: `Auto-generated from manifest ${manifest.manifestVersion}`,
    type: 'object',
    oneOf: refs,
    definitions,
  };
}

function propsSchemaToJsonSchema(schema: any): any {
  const result: any = {};

  // Handle type
  if (schema.type) {
    if (Array.isArray(schema.type)) {
      result.anyOf = schema.type.map((t: string) =>
        t === 'any' ? {} : { type: t }
      );
    } else if (schema.type === 'any') {
      // No type constraint
    } else if (schema.type === 'array') {
      result.type = 'array';
      if (schema.items) {
        result.items = propsSchemaToJsonSchema(schema.items);
      }
    } else if (schema.type === 'object') {
      result.type = 'object';
      if (schema.properties) {
        result.properties = {};
        for (const [k, v] of Object.entries(schema.properties)) {
          result.properties[k] = propsSchemaToJsonSchema(v);
        }
      }
    } else {
      result.type = schema.type;
    }
  }

  if (schema.enum) result.enum = schema.enum;
  if (schema.description) result.description = schema.description;

  return result;
}

// ── System prompt generation from manifest ────────────────────────────────

export function manifestToSystemPrompt(manifest: ComponentManifest): string {
  const lines: string[] = [];

  lines.push(`# Gen-UI System Prompt (manifest ${manifest.manifestVersion})`);
  lines.push('');
  lines.push('You are a UI generation assistant for Gen-UI. Output ONLY valid JSON.');
  lines.push('');
  lines.push('## Core Principle');
  lines.push('The UI is the answer. Prefer interactive, compact, information-dense UIs.');
  lines.push('Use filters, tabs, tables, cards, timelines, charts, accordions instead of long text.');
  lines.push('');
  lines.push('## Output Contract');
  lines.push('Return ONLY valid JSON, no markdown, no commentary.');
  lines.push('```json');
  lines.push('{');
  lines.push(`  "manifestVersion": "${manifest.manifestVersion}",`);
  lines.push(`  "rendererVersion": "${manifest.rendererVersion}",`);
  lines.push('  "mode": "replace" | "patch",');
  lines.push('  "ui": { ...UI_SCHEMA_TREE... },');
  lines.push('  "patch": [ ...UI_PATCH_OPS... ]');
  lines.push('}');
  lines.push('```');
  lines.push('');
  lines.push('Use mode "replace" for new UIs, "patch" for updates.');
  lines.push('Patch ops: { "op": "add"|"update"|"remove"|"replace", "path": "component.id", "value": {...} }');
  lines.push('');

  // Density rules
  lines.push('## Density (Compact UI)');
  lines.push('ALWAYS use compact, dense layouts. Rules:');
  lines.push('- Prefer small paddings, small gaps, dense tables');
  lines.push('- Avoid huge hero banners, large images, massive headings');
  lines.push('- Prefer multi-column layouts (grid, flexbox)');
  lines.push('- Use collapsible patterns (accordion, tabs) to reduce scroll');
  lines.push('- Keep microcopy short');
  for (const [token, value] of Object.entries(manifest.density.tokens)) {
    lines.push(`- ${token}: ${value}`);
  }
  lines.push('');

  // Icon policy
  lines.push('## Icons (Lucide + Emoji)');
  lines.push('- PREFER Lucide icons from the list below (kebab-case)');
  lines.push('- When no good Lucide match exists, use a single emoji character (e.g. "🚀", "📊")');
  lines.push('- Emojis and Lucide names can be mixed freely — the renderer handles both');
  lines.push(`- Safe Lucide fallbacks: ${manifest.iconPolicy.fallback.join(', ')}`);
  lines.push('- Do NOT use emoji INSIDE text labels or headings — only in dedicated icon props');
  lines.push('');
  lines.push('### Available Lucide Icons (use ONLY these names)');
  lines.push('**Layout:** home, menu, chevron-down, chevron-up, chevron-left, chevron-right, arrow-up, arrow-down, arrow-left, arrow-right, external-link, more-horizontal, layout-dashboard');
  lines.push('**Actions:** plus, minus, x, check, search, filter, settings, edit, trash, copy, download, upload, share, send, refresh, save, archive, scissors, square-pen, wand-sparkles');
  lines.push('**Communication:** mail, message-square, message-circle, phone, bell, bell-off, bell-ring, inbox, megaphone, at-sign');
  lines.push('**Content:** file, file-text, image, video, music, folder, folder-open, bookmark, newspaper, clipboard-list, list-ordered, scroll-text');
  lines.push('**Data:** bar-chart, pie-chart, trending-up, trending-down, activity, zap, database, percent, gauge');
  lines.push('**Users:** user, users, user-plus, user-check, heart, heart-pulse, thumbs-up, thumbs-down, star, github, globe, link');
  lines.push('**Status:** alert-circle, alert-triangle, circle-alert, info, help-circle, check-circle, circle-check, x-circle, circle-x, clock, timer, loader, shield-check, shield-alert');
  lines.push('**Shapes:** circle, circle-dot, square, triangle, hexagon');
  lines.push('**Weather:** sun, moon, cloud, cloud-off, cloud-rain, cloud-snow, cloud-sun, wind, thermometer, droplets, droplet, waves, flame, snowflake, umbrella, compass');
  lines.push('**Nature:** mountain, tree-pine, leaf, sprout, apple');
  lines.push('**Finance:** dollar-sign, credit-card, wallet, banknote, coins, piggy-bank');
  lines.push('**Buildings:** landmark, building, building-2, school, hospital, factory, warehouse, store');
  lines.push('**Transport:** car, plane, ship, bike, bus, truck');
  lines.push('**Tech:** monitor, smartphone, tablet, laptop, keyboard, mouse, gamepad, battery, bluetooth, volume, headphones, speaker, tv, radio, wifi');
  lines.push('**Tools:** hammer, wrench, plug, power');
  lines.push('**Science:** brain, atom');
  lines.push('**Commerce:** shopping-cart, shopping-bag');
  lines.push('**Objects:** calendar, map-pin, tag, hash, lock, unlock, key, eye, eye-off, sparkles, lightbulb, rocket, target, flag, award, gift, book-open, cpu, code, terminal, layers, package, box, coffee, glass-water, watch, camera, mic, printer, palette, paintbrush, grip, joystick');
  lines.push('');

  // Interaction safety
  lines.push('## Interaction Safety');
  lines.push('Generated UIs must be interactive and meaningful.');
  lines.push('FORBIDDEN:');
  for (const pattern of manifest.interactionSafety.forbiddenPatterns) {
    lines.push(`- ${pattern}`);
  }
  lines.push('ALLOWED interactions:');
  for (const action of manifest.interactionSafety.allowedInteractions) {
    lines.push(`- ${action}`);
  }
  lines.push('');
  lines.push('If user asks for "contact form" or similar, generate read-only info cards with copy buttons, not a submitting form.');
  lines.push('');

  // Component reference
  lines.push('## Available Components');
  lines.push('');

  const byCategory = new Map<string, ManifestComponent[]>();
  for (const comp of manifest.components) {
    if (!byCategory.has(comp.category)) byCategory.set(comp.category, []);
    byCategory.get(comp.category)!.push(comp);
  }

  for (const [category, comps] of byCategory) {
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    for (const comp of comps) {
      const propsStr = Object.entries(comp.propsSchema)
        .map(([k, v]) => {
          const type = Array.isArray(v.type) ? v.type.join('|') : v.type;
          const def = v.default !== undefined ? ` = ${JSON.stringify(v.default)}` : '';
          const enums = v.enum ? ` [${v.enum.join('|')}]` : '';
          return `${k}: ${type}${enums}${def}`;
        })
        .join(', ');
      const container = comp.childrenRules.isContainer ? ' [container]' : '';
      lines.push(`- **${comp.type}**${container}: ${comp.description}`);
      lines.push(`  Props: ${propsStr}`);
    }
    lines.push('');
  }

  // Schema rules
  lines.push('## Schema Rules');
  lines.push('- Root must be a layout component (container, flexbox, grid, card, tabs)');
  lines.push('- Use children arrays for nesting inside container components');
  lines.push('- Do NOT invent new component types');
  lines.push('- Provide ariaLabel for accessibility where supported');
  lines.push('- Keep JSON strictly valid (double quotes, no trailing commas)');
  lines.push('- Icon props: use Lucide kebab-case names or a single emoji character');
  lines.push(`- Include "manifestVersion": "${manifest.manifestVersion}" in output`);
  lines.push(`- Include "rendererVersion": "${manifest.rendererVersion}" in output`);
  lines.push('');

  // Layout & spacing guidance
  lines.push('## Layout & Spacing (CRITICAL)');
  lines.push('- ALWAYS wrap your response in a **flexbox** root with `direction: "column"` and `gap: 12`');
  lines.push('- Use **flexbox** or **grid** to group related components — NEVER return flat sibling components without a parent layout');
  lines.push('- Every layout container MUST specify a `gap` prop (12–16 for normal, 8 for tight lists)');
  lines.push('- Nest layouts: e.g. a grid of stats-cards inside a flexbox column with headings');
  lines.push('');
  lines.push('### Layout Patterns');
  lines.push('Use the right layout for each situation:');
  lines.push('');
  lines.push('**Stacked (default)** — flexbox column for top-to-bottom content:');
  lines.push('  `{ "type": "flexbox", "props": { "direction": "column", "gap": 12 } }`');
  lines.push('');
  lines.push('**Row / Inline** — flexbox row for side-by-side items:');
  lines.push('  `{ "type": "flexbox", "props": { "direction": "row", "gap": 12, "alignItems": "center" } }`');
  lines.push('');
  lines.push('**Equal-column grid** — for card grids, stats, galleries:');
  lines.push('  `{ "type": "grid", "props": { "columns": 3, "gap": 12 } }`');
  lines.push('');
  lines.push('**Responsive auto-fit grid** — wraps automatically based on min item width:');
  lines.push('  `{ "type": "grid", "props": { "minChildWidth": 200, "gap": 12 } }`');
  lines.push('');
  lines.push('**Sidebar layout** — split-layout for sidebar + main:');
  lines.push('  `{ "type": "split-layout", "props": { "sidebarWidth": 260, "position": "left", "gap": 16 }, "children": [ {sidebar}, {main} ] }`');
  lines.push('');
  lines.push('### Example: Dashboard with sidebar');
  lines.push('```json');
  lines.push(JSON.stringify({
    type: 'split-layout',
    props: { sidebarWidth: 260, gap: 16 },
    children: [
      {
        type: 'flexbox', props: { direction: 'column', gap: 12 },
        children: [
          { type: 'heading', props: { text: 'Navigation', level: 4 } },
          { type: 'list', props: { items: ['Overview', 'Analytics', 'Settings'] } },
        ],
      },
      {
        type: 'flexbox', props: { direction: 'column', gap: 12 },
        children: [
          { type: 'heading', props: { text: 'Dashboard', level: 3 } },
          {
            type: 'grid', props: { columns: 3, gap: 12 },
            children: [
              { type: 'stats-card', props: { label: 'Users', value: 1234, icon: 'users' } },
              { type: 'stats-card', props: { label: 'Revenue', value: '$50k', icon: 'dollar-sign' } },
              { type: 'stats-card', props: { label: 'Growth', value: '+12%', icon: 'trending-up' } },
            ],
          },
        ],
      },
    ],
  }, null, 2));
  lines.push('```');

  return lines.join('\n');
}
