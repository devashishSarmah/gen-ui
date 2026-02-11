import { Injectable } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class SchemaValidationService {
  private ajv: Ajv;
  private uiSchemaValidator: ValidateFunction;
  private uiSchemaTreeValidator: ValidateFunction;
  private componentWhitelist: Set<string>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.componentWhitelist = new Set([
      // Frontend supported components (renderer schema)
      'container',
      'flexbox',
      'grid',
      'card',
      'tabs',
      'accordion',
      'input',
      'select',
      'checkbox',
      'radio',
      'textarea',
      'button',
      'table',
      'list',
      'listbox',
      'basic-chart',
      'wizard-stepper',
      'step-indicator',
      'wizard-navigation',
      'menu',
      'toolbar',
      'heading',
      'paragraph',
      'divider',
      'error',
      // Data display components
      'timeline',
      'carousel',
      'stats-card',
      'flow-diagram',
      'chart-bar',
      'progress-ring',
      // Feedback components
      'badge',
      'alert',
      'progress-bar',
      // Navigation components
      'stepper',
      // Legacy types (still accepted)
      'text-input',
      'number-input',
      'email-input',
      'password-input',
      'link',
      'panel',
    ]);

    this.uiSchemaValidator = this.ajv.compile(this.getUISchemaDefinition());
    this.uiSchemaTreeValidator = this.ajv.compile(this.getRendererSchemaDefinition());
  }

  /**
   * Validate UI schema against JSON Schema and component whitelist
   */
  validate(schema: any): { valid: boolean; errors?: string[] } {
    const usesLegacySchema = schema?.schemaVersion === '1.0';
    const valid = usesLegacySchema
      ? this.uiSchemaValidator(schema)
      : this.uiSchemaTreeValidator(schema);

    if (!valid) {
      return {
        valid: false,
        errors: this.ajv.errorsText(this.uiSchemaValidator.errors).split(', '),
      };
    }

    // Validate component whitelist
    const whitelistErrors = this.validateComponentWhitelist(schema);

    if (whitelistErrors.length > 0) {
      return {
        valid: false,
        errors: whitelistErrors,
      };
    }

    // Validate schema size
    const sizeError = this.validateSize(schema);
    if (sizeError) {
      return {
        valid: false,
        errors: [sizeError],
      };
    }

    return { valid: true };
  }

  private validateComponentWhitelist(schema: any): string[] {
    const errors: string[] = [];

    const validateComponents = (components: any[], path: string = 'root') => {
      if (!Array.isArray(components)) return;

      components.forEach((component, index) => {
        if (!this.componentWhitelist.has(component.type)) {
          errors.push(`Component type '${component.type}' at ${path}[${index}] is not whitelisted`);
        }

        // Recursively validate nested components
        if (component.children) {
          validateComponents(component.children, `${path}[${index}].children`);
        }
      });
    };

    const validateTree = (node: any, path: string = 'root') => {
      if (!node || typeof node !== 'object') return;
      if (node.type && !this.componentWhitelist.has(node.type)) {
        errors.push(`Component type '${node.type}' at ${path} is not whitelisted`);
      }
      if (Array.isArray(node.children)) {
        node.children.forEach((child: any, index: number) =>
          validateTree(child, `${path}.children[${index}]`)
        );
      }
    };

    if (schema?.schemaVersion === '1.0' && schema.components) {
      validateComponents(schema.components);
    } else if (schema?.type) {
      validateTree(schema);
    }

    return errors;
  }

  private validateSize(schema: any): string | null {
    const sizeInBytes = JSON.stringify(schema).length;
    const maxSize = 1024 * 1024; // 1MB

    if (sizeInBytes > maxSize) {
      return `Schema size ${sizeInBytes} bytes exceeds maximum of ${maxSize} bytes`;
    }

    return null;
  }

  private getUISchemaDefinition() {
    return {
      type: 'object',
      required: ['schemaVersion', 'type', 'components'],
      properties: {
        schemaVersion: {
          type: 'string',
          enum: ['1.0'],
        },
        type: {
          type: 'string',
          enum: ['form', 'dashboard', 'wizard', 'list', 'detail', 'error'],
        },
        title: {
          type: 'string',
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type'],
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              props: { type: 'object' },
              children: { type: 'array' },
              events: { type: 'object' },
            },
          },
        },
        layout: {
          type: 'object',
        },
        validation: {
          type: 'object',
        },
        events: {
          type: 'object',
        },
      },
    };
  }

  private getRendererSchemaDefinition() {
    const schemaPath = resolve(
      process.cwd(),
      'apps',
      'backend',
      'src',
      'ai',
      'prompts',
      'renderer-schema.json'
    );

    try {
      const raw = readFileSync(schemaPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return { type: 'object' };
    }
  }
}
