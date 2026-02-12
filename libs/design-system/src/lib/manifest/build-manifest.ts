#!/usr/bin/env ts-node
/**
 * Build script: generates manifest outputs from COMPONENT_METADATA.
 *
 * This script imports only `component-metadata.ts` (pure data, zero Angular
 * imports) so it can execute in plain Node / ts-node without triggering
 * Angular decorator compilation.
 *
 * Usage:  npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *           libs/design-system/src/lib/manifest/build-manifest.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { COMPONENT_METADATA } from '../component-metadata';
import {
  buildManifest,
  manifestToJsonSchema,
  manifestToSystemPrompt,
} from './manifest-generator';

const ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const OUT_DIR = resolve(ROOT, 'libs', 'design-system', 'src', 'lib', 'manifest', 'dist');
const BACKEND_PROMPTS = resolve(ROOT, 'apps', 'backend', 'src', 'ai', 'prompts');

// 1. Build manifest
const manifest = buildManifest(COMPONENT_METADATA, '1.0.0');

// 2. Ensure output dirs
mkdirSync(OUT_DIR, { recursive: true });

// 3. Write manifest JSON
const manifestPath = resolve(OUT_DIR, 'genui-manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`✓ Manifest written to ${manifestPath}`);
console.log(`  Version: ${manifest.manifestVersion}`);
console.log(`  Components: ${manifest.components.length}`);

// 4. Write generated renderer schema
const schema = manifestToJsonSchema(manifest);
const schemaPath = resolve(OUT_DIR, 'renderer-schema.generated.json');
writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
console.log(`✓ JSON Schema written to ${schemaPath}`);

// Also write to backend prompts dir (replaces hand-maintained file)
const backendSchemaPath = resolve(BACKEND_PROMPTS, 'renderer-schema.json');
writeFileSync(backendSchemaPath, JSON.stringify(schema, null, 2));
console.log(`✓ Backend renderer-schema.json updated`);

// 5. Write generated system prompt
const prompt = manifestToSystemPrompt(manifest);
const promptPath = resolve(OUT_DIR, 'system-prompt.generated.md');
writeFileSync(promptPath, prompt);
console.log(`✓ System prompt written to ${promptPath}`);

// Also write to backend prompts dir (replaces hand-maintained file)
const backendPromptPath = resolve(BACKEND_PROMPTS, 'ui-schema.md');
writeFileSync(backendPromptPath, prompt);
console.log(`✓ Backend ui-schema.md updated`);

console.log('\n✓ Manifest build complete. One source of truth → all outputs generated.');
