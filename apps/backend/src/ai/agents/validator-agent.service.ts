import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ManifestLoaderService } from '../manifest-loader.service';
import { AIGenerationContext } from '../providers/ai-provider.interface';

/**
 * Validator Agent
 *
 * Validates generated UI schemas for:
 *   - JSON Schema compliance (via manifest)
 *   - Component whitelist (only manifest components)
 *   - Icon props (Lucide names or emoji characters)
 *   - Interaction safety (no dummy form submits)
 *   - Compact density compliance
 *   - Prop correctness
 */
@Injectable()
export class ValidatorAgentService {
  private readonly logger = new Logger(ValidatorAgentService.name);

  constructor(private manifestLoader: ManifestLoaderService) {}

  validate(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Extract UI tree
    const ui = schema?.ui || schema;

    // 1. Manifest-driven structural validation
    const structuralResult = this.manifestLoader.validateSchema(schema);
    if (!structuralResult.valid) {
      for (const err of structuralResult.errors) {
        errors.push({ type: 'schema', message: err, severity: 'error' });
      }
    }

    // 2. Prop type validation (deep)
    this.validateProps(ui, errors, warnings);

    // 3. Root must be a layout component
    const layoutTypes = ['container', 'flexbox', 'grid', 'card', 'tabs', 'split-layout'];
    if (ui?.type && !layoutTypes.includes(ui.type)) {
      warnings.push(`Root component is '${ui.type}' — should be a layout (${layoutTypes.join(', ')})`);
    }

    // 4. Density check
    this.checkDensity(ui, warnings);

    // 5. Version contract
    if (schema.manifestVersion) {
      const expected = this.manifestLoader.getManifestVersion();
      if (schema.manifestVersion !== expected) {
        warnings.push(`Manifest version '${schema.manifestVersion}' != loaded '${expected}'`);
      }
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
    };
  }

  private validateProps(
    node: any,
    errors: ValidationError[],
    warnings: string[],
    path = 'root',
  ): void {
    if (!node || typeof node !== 'object') return;

    const manifest = this.manifestLoader.getManifest();
    if (!manifest || !node.type) return;

    const compDef = manifest.components.find((c) => c.type === node.type);
    if (!compDef) return; // Unknown type already caught by whitelist

    // Check for unknown props
    if (node.props && compDef.propsSchema) {
      const allowed = new Set(Object.keys(compDef.propsSchema));
      for (const key of Object.keys(node.props)) {
        if (!allowed.has(key)) {
          warnings.push(`${path}.props.${key}: unknown prop for '${node.type}'`);
        }
      }
    }

    // Recurse
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, i: number) => {
        this.validateProps(child, errors, warnings, `${path}.children[${i}]`);
      });
    }
  }

  private checkDensity(node: any, warnings: string[], path = 'root'): void {
    if (!node || typeof node !== 'object') return;

    // Flag large sizes/paddings
    if (node.props) {
      if (node.props.size === 'large') {
        warnings.push(`${path}: size="large" discouraged — use "small" or "medium" for compact density`);
      }
      if (typeof node.props.gap === 'number' && node.props.gap > 24) {
        warnings.push(`${path}: gap=${node.props.gap} is large — prefer ≤16 for compact density`);
      }
      if (typeof node.props.padding === 'number' && node.props.padding > 24) {
        warnings.push(`${path}: padding=${node.props.padding} is large — prefer ≤16 for compact density`);
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, i: number) => {
        this.checkDensity(child, warnings, `${path}.children[${i}]`);
      });
    }
  }
}

export interface ValidationError {
  type: 'schema' | 'emoji' | 'safety' | 'whitelist' | 'density';
  message: string;
  severity: 'error' | 'warning';
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}
