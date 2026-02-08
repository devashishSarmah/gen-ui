import {
  Injectable,
  EnvironmentInjector,
  Type,
  ComponentRef,
  ViewContainerRef,
  createComponent,
} from '@angular/core';
import { ComponentRegistryService } from './component-registry.service';

export interface UISchema {
  id?: string;
  type: string;
  props?: Record<string, any>;
  children?: UISchema[];
  events?: Record<string, any>;
}

export interface RenderResult {
  component: ComponentRef<any> | null;
  schema: UISchema;
  error?: string;
  childComponents?: ComponentRef<any>[];
}

@Injectable({
  providedIn: 'root',
})
export class SchemaRendererService {
  constructor(
    private injector: EnvironmentInjector,
    private componentRegistry: ComponentRegistryService
  ) {}

  /**
   * Render a schema to a component
   */
  renderComponent(schema: UISchema, viewContainer?: ViewContainerRef): ComponentRef<any> | null {
    if (!schema || !schema.type) {
      console.error('Invalid schema: missing type', schema);
      return null;
    }

    const registered = this.componentRegistry.get(schema.type);
    if (!registered) {
      console.error(`Component type '${schema.type}' not registered`);
      return null;
    }

    try {
      return this.createComponentInstance(registered.component, schema, viewContainer);
    } catch (error) {
      console.error(`Failed to render component '${schema.type}':`, error);
      return null;
    }
  }

  /**
   * Create component instance with props and events
   */
  private createComponentInstance(
    component: Type<any>,
    schema: UISchema,
    viewContainer?: ViewContainerRef
  ): ComponentRef<any> {
    const componentRef = viewContainer
      ? viewContainer.createComponent(component, { environmentInjector: this.injector })
      : createComponent(component, { environmentInjector: this.injector });

    this.applySchemaProps(componentRef, schema);
    this.wireSchemaEvents(componentRef, schema);

    return componentRef;
  }

  private applySchemaProps(componentRef: ComponentRef<any>, schema: UISchema): void {
    if (schema.props) {
      Object.entries(schema.props).forEach(([key, value]) => {
        const setInput = (componentRef as any).setInput;
        if (typeof setInput === 'function') {
          setInput.call(componentRef, key, value);
        } else {
          (componentRef.instance as any)[key] = value;
        }
      });
    }
  }

  private wireSchemaEvents(componentRef: ComponentRef<any>, schema: UISchema): void {
    if (!schema.events) {
      return;
    }

    Object.entries(schema.events).forEach(([eventName, handler]) => {
      const eventOutput = (componentRef.instance as any)[eventName];
      if (eventOutput && typeof eventOutput.subscribe === 'function') {
        eventOutput.subscribe((eventData: any) => {
          if (typeof handler === 'function') {
            handler(eventData);
            return;
          }

          if (handler && typeof handler.next === 'function') {
            handler.next(eventData);
            return;
          }

          if (handler && typeof handler.emit === 'function') {
            handler.emit(eventData);
          }
        });
      }
    });
  }

  /**
   * Validate schema against component capability
   */
  validateSchema(schema: UISchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema.type) {
      errors.push('Schema missing type property');
      return { valid: false, errors };
    }

    const capability = this.componentRegistry.getCapability(schema.type);
    if (!capability) {
      errors.push(`Component type '${schema.type}' not registered`);
      return { valid: false, errors };
    }

    // Validate props against props schema
    if (capability.propsSchema && schema.props) {
      const propErrors = this.validateProps(schema.props, capability.propsSchema);
      errors.push(...propErrors);
    }

    // Validate children exist if component expects them
    if (capability.propsSchema?.['children'] && !schema.children?.length) {
      // Some components may require children
      const childrenSchema = capability.propsSchema['children'];
      if (childrenSchema.required) {
        errors.push(`Component '${schema.type}' requires children`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate props against schema
   */
  private validateProps(props: Record<string, any>, propsSchema: Record<string, any>): string[] {
    const errors: string[] = [];

    Object.entries(propsSchema).forEach(([propName, propDef]) => {
      const value = props[propName];
      const propSchema = propDef as any;

      // Check required
      if (propSchema.required && (value === undefined || value === null)) {
        errors.push(`Property '${propName}' is required`);
        return;
      }

      // Check type
      if (value !== undefined && value !== null && propSchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== propSchema.type) {
          errors.push(
            `Property '${propName}' should be type ${propSchema.type}, got ${actualType}`
          );
        }
      }

      // Check enum values
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(
          `Property '${propName}' value '${value}' not in allowed values: ${propSchema.enum.join(
            ', '
          )}`
        );
      }
    });

    return errors;
  }

  /**
   * Apply JSON Patch to schema
   * Supports operations: add, remove, replace, copy, move
   */
  applyJsonPatch(schema: UISchema, patches: any[]): UISchema {
    let current = JSON.parse(JSON.stringify(schema)); // Deep clone

    patches.forEach((patch) => {
      const { op, path, value, from } = patch;

      try {
        switch (op) {
          case 'add':
            current = this.addPatch(current, path, value);
            break;
          case 'remove':
            current = this.removePatch(current, path);
            break;
          case 'replace':
            current = this.replacePatch(current, path, value);
            break;
          case 'copy':
            current = this.copyPatch(current, path, from);
            break;
          case 'move':
            current = this.movePatch(current, path, from);
            break;
          default:
            console.warn(`Unknown JSON Patch operation: ${op}`);
        }
      } catch (error) {
        console.error(`Error applying patch operation ${op} at ${path}:`, error);
      }
    });

    return current;
  }

  private addPatch(obj: any, path: string, value: any): any {
    const parts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = Number.isNaN(Number(parts[i + 1])) ? {} : [];
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    if (Array.isArray(current)) {
      if (lastPart === '-') {
        current.push(value);
      } else {
        current.splice(parseInt(lastPart), 0, value);
      }
    } else {
      current[lastPart] = value;
    }

    return obj;
  }

  private removePatch(obj: any, path: string): any {
    const parts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }

    const lastPart = parts[parts.length - 1];
    if (Array.isArray(current)) {
      current.splice(parseInt(lastPart), 1);
    } else {
      delete current[lastPart];
    }

    return obj;
  }

  private replacePatch(obj: any, path: string, value: any): any {
    const parts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;

    return obj;
  }

  private copyPatch(obj: any, path: string, from: string): any {
    const fromParts = this.parsePath(from);
    let source = obj;
    fromParts.forEach((part) => {
      source = source[part];
    });

    return this.addPatch(obj, path, JSON.parse(JSON.stringify(source)));
  }

  private movePatch(obj: any, path: string, from: string): any {
    const fromParts = this.parsePath(from);
    let source = obj;
    fromParts.forEach((part) => {
      source = source[part];
    });

    const value = JSON.parse(JSON.stringify(source));
    obj = this.removePatch(obj, from);
    return this.addPatch(obj, path, value);
  }

  private parsePath(path: string): string[] {
    return path.split('/').filter((part) => part !== '');
  }

  /**
   * Get rendered schema as JSON (for serialization)
   */
  schemaToJson(schema: UISchema): string {
    return JSON.stringify(schema);
  }

  /**
   * Parse JSON to schema
   */
  jsonToSchema(json: string): UISchema {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to parse schema JSON:', error);
      throw error;
    }
  }

  private resolveChildContainer(
    componentRef: ComponentRef<any>,
    schema: UISchema
  ): ViewContainerRef | null {
    const capability = this.componentRegistry.getCapability(schema.type);
    if (!capability?.isContainer) {
      return null;
    }

    const hostProperty = capability.contentHost || 'contentHost';
    const host = (componentRef.instance as any)[hostProperty];

    if (host && typeof host.createComponent === 'function') {
      return host as ViewContainerRef;
    }

    return null;
  }

  /**
   * Recursively render a schema tree into a ViewContainerRef
   * Creates component instances and wires inputs/outputs
   * Handles children rendering and projection
   */
  renderSchemaTree(schema: UISchema, viewContainer: ViewContainerRef): RenderResult {
    if (!schema || !schema.type) {
      return { component: null, schema, error: 'Invalid schema: missing type' };
    }

    if (!viewContainer) {
      return { component: null, schema, error: 'Missing ViewContainerRef' };
    }

    const registered = this.componentRegistry.get(schema.type);
    if (!registered) {
      return {
        component: null,
        schema,
        error: `Component type '${schema.type}' not registered`,
      };
    }

    try {
      const componentRef = this.createComponentInstance(
        registered.component,
        schema,
        viewContainer
      );

      componentRef.changeDetectorRef.detectChanges();

      const childComponents: ComponentRef<any>[] = [];
      if (schema.children && schema.children.length > 0) {
        const childContainer = this.resolveChildContainer(componentRef, schema);
        if (!childContainer) {
          console.warn(
            `Component '${schema.type}' does not expose a child ViewContainerRef for rendering children`
          );
        } else {
          schema.children.forEach((childSchema) => {
            const childResult = this.renderSchemaTree(childSchema, childContainer);
            if (childResult.component) {
              childComponents.push(childResult.component);
            }
          });
        }
      }

      componentRef.changeDetectorRef.markForCheck();

      return {
        component: componentRef,
        schema,
        childComponents: childComponents.length > 0 ? childComponents : undefined,
      };
    } catch (error) {
      console.error(`Failed to render component '${schema.type}':`, error);
      return {
        component: null,
        schema,
        error: `Failed to render component '${schema.type}': ${error}`,
      };
    }
  }
}
