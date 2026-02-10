import { Injectable, Injector, ViewContainerRef } from '@angular/core';
import { SchemaRendererService, UISchema, RenderResult } from './schema-renderer.service';
import { ComponentRegistryService } from './component-registry.service';
import { signal } from '@angular/core';

export interface DynamicUIState {
  currentSchema: UISchema | null;
  loading: boolean;
  error: string | null;
  schemaHistory: UISchema[];
}

@Injectable({
  providedIn: 'root',
})
export class DynamicUIService {
  uiState = signal<DynamicUIState>({
    currentSchema: null,
    loading: false,
    error: null,
    schemaHistory: [],
  });

  constructor(
    private schemaRenderer: SchemaRendererService,
    private componentRegistry: ComponentRegistryService,
    private injector: Injector
  ) {}

  /**
   * Load and render a UI schema
   * Used when AI generates a complete new UI layout
   */
  loadSchema(schema: UISchema): void {
    try {
      const normalizedSchema = this.normalizeSchema(schema);
      // Validate schema first
      const validation = this.schemaRenderer.validateSchema(normalizedSchema);
      if (!validation.valid) {
        const errorMsg = `Schema validation failed: ${validation.errors.join(', ')}`;
        this.setError(errorMsg);
        return;
      }

      // Update state
      this.uiState.update((state) => ({
        ...state,
        currentSchema: normalizedSchema,
        schemaHistory: [...state.schemaHistory, normalizedSchema],
        error: null,
      }));
    } catch (error) {
      this.setError(`Failed to load schema: ${error}`);
    }
  }

  /**
   * Apply JSON Patch updates to current schema
   * Used for incremental AI updates via WebSocket streaming
   */
  applyPatchUpdates(patches: any[]): void {
    try {
      const currentSchema = this.uiState().currentSchema;
      if (!currentSchema) {
        throw new Error('No current schema to patch');
      }

      const updatedSchema = this.schemaRenderer.applyJsonPatch(currentSchema, patches);

      // Validate updated schema
      const validation = this.schemaRenderer.validateSchema(updatedSchema);
      if (!validation.valid) {
        const errorMsg = `Patched schema validation failed: ${validation.errors.join(', ')}`;
        this.setError(errorMsg);
        return;
      }

      // Update state
      this.uiState.update((state) => ({
        ...state,
        currentSchema: updatedSchema,
        schemaHistory: [...state.schemaHistory, updatedSchema],
      }));
    } catch (error) {
      this.setError(`Failed to apply patches: ${error}`);
    }
  }

  /**
   * Get the current schema
   */
  getCurrentSchema(): UISchema | null {
    return this.uiState().currentSchema;
  }

  /**
   * Clear current schema
   */
  clearSchema(): void {
    this.uiState.update((state) => ({
      ...state,
      currentSchema: null,
      error: null,
    }));
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.uiState.update((state) => ({
      ...state,
      loading,
    }));
  }

  /**
   * Set error state
   */
  private setError(error: string): void {
    this.uiState.update((state) => ({
      ...state,
      error,
      loading: false,
    }));
  }

  normalizeExternalSchema(schema: UISchema): UISchema {
    return this.normalizeSchema(schema);
  }

  private normalizeSchema(schema: UISchema): UISchema {
    const maybeAiSchema = schema as unknown as {
      schemaVersion?: string;
      components?: any[];
      layout?: any;
    };

    if (maybeAiSchema.schemaVersion && Array.isArray(maybeAiSchema.components)) {
      return this.adaptAiSchema(maybeAiSchema);
    }

    return schema;
  }

  private adaptAiSchema(aiSchema: {
    components?: any[];
    layout?: any;
  }): UISchema {
    const layout = aiSchema.layout || {};
    const rootType = this.mapLayoutType(layout.type);

    return {
      type: rootType,
      props: this.mapLayoutProps(layout, rootType),
      children: (aiSchema.components ?? []).map((component) => this.mapComponent(component)),
    };
  }

  private mapLayoutType(type?: string): string {
    const normalized = (type || '').toLowerCase();
    if (normalized === 'flexbox' || normalized === 'grid' || normalized === 'card') {
      return normalized;
    }
    return 'container';
  }

  private mapLayoutProps(layout: any, rootType: string): Record<string, any> {
    if (rootType === 'flexbox') {
      return {
        direction: layout.direction,
        gap: layout.gap,
        padding: layout.padding,
        alignItems: layout.alignItems,
        justifyContent: layout.justifyContent,
      };
    }

    if (rootType === 'grid') {
      return {
        columns: layout.columns || 1,
        gap: layout.gap ?? 16,
      };
    }

    if (rootType === 'card') {
      return {
        title: layout.title || '',
      };
    }

    return {
      maxWidth: layout.maxWidth || 1200,
      variant: layout.variant || 'default',
    };
  }

  private mapComponent(component: any): UISchema {
    const type = (component?.type || '').toLowerCase();

    if (type === 'heading') {
      return {
        type: 'heading',
        props: {
          text: component.text || '',
          level: component.level || 2,
          ariaLabel: component.ariaLabel || '',
        },
      };
    }

    if (type === 'paragraph') {
      return {
        type: 'paragraph',
        props: {
          text: component.text || '',
          ariaLabel: component.ariaLabel || '',
        },
      };
    }

    if (type === 'divider') {
      return {
        type: 'divider',
        props: {
          ariaLabel: component.ariaLabel || '',
        },
      };
    }

    if (type === 'text-input' || type === 'number-input') {
      return {
        type: 'input',
        props: {
          id: component.id,
          type: type === 'number-input' ? 'number' : 'text',
          label: component.label,
          placeholder: component.placeholder,
          value: component.value,
          disabled: component.disabled,
          required: component.required,
          pattern: component.pattern,
          error: component.error,
        },
      };
    }

    if (['select', 'checkbox', 'radio', 'textarea', 'button', 'card', 'grid', 'list'].includes(type)) {
      return {
        type,
        props: {
          ...component,
          type: undefined,
        },
        children: component.components?.map((child: any) => this.mapComponent(child)),
      };
    }

    return {
      type: 'error',
      props: {
        title: 'Unsupported component',
        message: `Component type '${component?.type}' is not supported yet.`,
        details: JSON.stringify(component),
        dismissible: false,
        visible: true,
      },
    };
  }

  /**
   * Get schema history
   */
  getSchemaHistory(): UISchema[] {
    return this.uiState().schemaHistory;
  }

  /**
   * Revert to previous schema in history
   */
  revertToPrevious(): void {
    const history = this.getSchemaHistory();
    if (history.length > 1) {
      const previousSchema = history[history.length - 2];
      this.uiState.update((state) => ({
        ...state,
        currentSchema: previousSchema,
        schemaHistory: history.slice(0, -1),
      }));
    }
  }

  /**
   * Get list of registered component types
   * Useful for AI model to know what components are available
   */
  getAvailableComponentTypes(): string[] {
    return this.componentRegistry.getRegisteredTypes();
  }

  /**
   * Get component capability information
   * Useful for AI model to know component prop schemas
   */
  getComponentCapability(type: string) {
    return this.componentRegistry.getCapability(type);
  }

  /**
   * Render the current schema into a ViewContainerRef host
   * Clears the container before rendering to prevent memory leaks
   * Returns the rendered root component or null if rendering failed
   */
  renderCurrentSchema(viewContainer: ViewContainerRef): RenderResult | null {
    if (!viewContainer) {
      this.setError('Missing ViewContainerRef for rendering');
      return null;
    }

    const currentSchema = this.getCurrentSchema();
    if (!currentSchema) {
      this.setError('No schema loaded to render');
      return null;
    }

    try {
      viewContainer.clear();

      const result = this.schemaRenderer.renderSchemaTree(currentSchema, viewContainer);

      if (result.error) {
        this.setError(result.error);
        return result;
      }

      return result;
    } catch (error) {
      this.setError(`Failed to render schema: ${error}`);
      return null;
    }
  }
}
