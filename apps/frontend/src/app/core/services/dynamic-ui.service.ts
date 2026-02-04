import { Injectable, Injector, ViewContainerRef } from '@angular/core';
import { SchemaRendererService, UISchema } from './schema-renderer.service';
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
      // Validate schema first
      const validation = this.schemaRenderer.validateSchema(schema);
      if (!validation.valid) {
        const errorMsg = `Schema validation failed: ${validation.errors.join(', ')}`;
        this.setError(errorMsg);
        return;
      }

      // Update state
      this.uiState.update((state) => ({
        ...state,
        currentSchema: schema,
        schemaHistory: [...state.schemaHistory, schema],
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
  renderCurrentSchema(viewContainer: ViewContainerRef): any {
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
        return null;
      }

      return result.component;
    } catch (error) {
      this.setError(`Failed to render schema: ${error}`);
      return null;
    }
  }
}
