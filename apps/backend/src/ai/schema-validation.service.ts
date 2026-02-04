import { Injectable } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';

@Injectable()
export class SchemaValidationService {
  private ajv: Ajv;
  private uiSchemaValidator: ValidateFunction;
  private componentWhitelist: Set<string>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.componentWhitelist = new Set([
      // Input components
      'text-input',
      'number-input',
      'email-input',
      'password-input',
      'select',
      'checkbox',
      'radio',
      'textarea',
      'date-picker',
      'file-upload',
      
      // Action components
      'button',
      'link',
      'icon-button',
      
      // Layout components
      'card',
      'panel',
      'grid',
      'flexbox',
      'stack',
      'tabs',
      'accordion',
      
      // Display components
      'heading',
      'paragraph',
      'text',
      'divider',
      'image',
      'icon',
      'badge',
      'alert',
      
      // Data components
      'table',
      'list',
      'tree',
      'chart',
      
      // Navigation
      'stepper',
      'breadcrumb',
      'pagination',
    ]);

    this.uiSchemaValidator = this.ajv.compile(this.getUISchemaDefinition());
  }

  /**
   * Validate UI schema against JSON Schema and component whitelist
   */
  validate(schema: any): { valid: boolean; errors?: string[] } {
    // Validate against JSON Schema
    const valid = this.uiSchemaValidator(schema);

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

    if (schema.components) {
      validateComponents(schema.components);
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
}
