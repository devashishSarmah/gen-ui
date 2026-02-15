import {
  Injectable,
  EnvironmentInjector,
  Type,
  ComponentRef,
  ViewContainerRef,
  createComponent,
  inject,
} from '@angular/core';
import { ComponentRegistryService } from './component-registry.service';
import { InteractionService } from './interaction.service';

export interface UISchema {
  id?: string;
  type: string;
  props?: Record<string, any>;
  children?: UISchema[];
  events?: Record<string, any>;
  /** Manifest version hash — set by the backend orchestrator */
  manifestVersion?: string;
  /** Renderer version — semantic version of the design-system */
  rendererVersion?: string;
}

/** Current renderer version. Keep in sync with libs/design-system/package.json. */
export const RENDERER_VERSION = '0.1.0';

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
  private interactionService = inject(InteractionService);

  constructor(
    private injector: EnvironmentInjector,
    private componentRegistry: ComponentRegistryService
  ) {
    // Subscribe to content-target children updates.
    // When InteractionService detects metadata.children, it emits here
    // so we can re-render the target container's child tree.
    this.interactionService.contentChildrenUpdate$.subscribe((event) => {
      this.replaceTargetChildren(event.targetRef, event.targetType, event.children);
    });
  }

  /**
   * Render a schema to a component.
   * Logs a version-mismatch warning if the schema's rendererVersion differs
   * from the current RENDERER_VERSION (non-blocking).
   */
  renderComponent(schema: UISchema, viewContainer?: ViewContainerRef): ComponentRef<any> | null {
    if (!schema || !schema.type) {
      console.error('Invalid schema: missing type', schema);
      return null;
    }

    // Version compatibility check (warning-only, never blocks rendering)
    this.checkVersionCompat(schema);

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

    // Derive a stable componentId: explicit id, or auto-generate when
    // the component participates in content-target linking.
    let componentId = schema.props?.['id'] as string | undefined;
    if (!componentId && schema.props?.['contentTarget']) {
      componentId = `__auto_${schema.type}_${this.autoIdCounter++}`;
    }

    // Wire interaction bridge — auto-subscribes to all known @Outputs
    this.interactionService.wireComponentEvents(
      componentRef,
      schema.type,
      componentId,
      schema.props,
    );

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

  private autoIdCounter = 0;

  /**
   * Non-blocking version compatibility check.
   * Warns if the schema was generated for a different renderer version.
   */
  private versionWarned = false;
  private checkVersionCompat(schema: UISchema): void {
    if (this.versionWarned || !schema.rendererVersion) {
      return;
    }
    if (schema.rendererVersion !== RENDERER_VERSION) {
      console.warn(
        `[GenUI] Schema rendererVersion "${schema.rendererVersion}" ` +
        `differs from current RENDERER_VERSION "${RENDERER_VERSION}". ` +
        `Some components may render unexpectedly.`
      );
      this.versionWarned = true; // warn once per session
    }
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
        const allowedTypes = Array.isArray(propSchema.type)
          ? propSchema.type
          : [propSchema.type];
        if (!allowedTypes.includes(actualType)) {
          errors.push(
            `Property '${propName}' should be type ${allowedTypes.join(' | ')}, got ${actualType}`
          );
        }
      }

      // Check enum values
      if (value !== undefined && value !== null && propSchema.enum && !propSchema.enum.includes(value)) {
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
   * Replace a container component's children with new schema children.
   * Used by contentTarget linking when metadata contains a `children` array.
   */
  private replaceTargetChildren(
    targetRef: ComponentRef<any>,
    targetType: string,
    children: UISchema[],
  ): void {
    // Resolve the target's child ViewContainerRef
    const capability = this.componentRegistry.getCapability(targetType);
    if (!capability?.isContainer) {
      console.warn(
        `[SchemaRenderer] contentTarget type "${targetType}" is not a container; cannot replace children.`
      );
      return;
    }

    const hostProperty = capability.contentHost || 'contentHost';
    const vcr = (targetRef.instance as any)[hostProperty] as ViewContainerRef | undefined;
    if (!vcr || typeof vcr.clear !== 'function') {
      console.warn(
        `[SchemaRenderer] contentTarget "${targetType}" has no accessible ViewContainerRef ("${hostProperty}").`
      );
      return;
    }

    // Clear existing children
    vcr.clear();

    // Render new children into the container
    for (const childSchema of children) {
      this.renderSchemaTree(childSchema, vcr, false);
    }

    targetRef.changeDetectorRef.markForCheck();
  }

  // ── Schema pre-processing ──────────────────────────────────────────

  /**
   * Walk the entire schema tree and auto-assign missing `id` props for
   * components that are referenced by some other node's `contentTarget`.
   *
   * Two-pass approach:
   *   Pass 1 — collect every `contentTarget` value and every existing `id`.
   *   Pass 2 — for each unresolved target (contentTarget with no matching
   *            id), find a suitable component in the tree and assign the id.
   *            Also auto-assign ids to source components that lack one.
   *
   * "Suitable component" heuristic: any container-type component (card,
   * flexbox, container, grid, etc.) without an existing `id` that isn't
   * itself a source (has contentTarget).
   */
  private patchContentTargetIds(schema: UISchema): void {
    if (!schema) return;

    // ── Pass 1: collect ──────────────────────────────────────────────
    const contentTargets = new Set<string>(); // all contentTarget values
    const existingIds = new Set<string>();    // all explicit id props
    const allNodes: UISchema[] = [];          // flat list of every node

    const walk = (node: UISchema) => {
      if (!node) return;
      allNodes.push(node);
      if (node.props?.['id']) existingIds.add(node.props['id']);
      if (node.props?.['contentTarget']) contentTargets.add(node.props['contentTarget']);
      node.children?.forEach(walk);
    };
    walk(schema);

    // ── Pass 2: resolve missing IDs ──────────────────────────────────
    const unresolvedTargets = new Set<string>();
    for (const ct of contentTargets) {
      if (!existingIds.has(ct)) unresolvedTargets.add(ct);
    }

    if (unresolvedTargets.size > 0) {
      // Container-ish types that can receive children / act as targets
      const containerTypes = new Set([
        'card', 'flexbox', 'container', 'grid', 'split-layout',
        'accordion', 'tabs', 'toolbar',
      ]);

      // Build set of source nodes (nodes with contentTarget) so we can
      // skip them AND skip their ancestor containers
      const sourceNodes = new Set<UISchema>(
        allNodes.filter((n) => n.props?.['contentTarget']),
      );

      // Check if a node is an ancestor of any source node
      const isAncestorOfSource = (node: UISchema): boolean => {
        if (!node.children) return false;
        for (const child of node.children) {
          if (sourceNodes.has(child) || isAncestorOfSource(child)) return true;
        }
        return false;
      };

      for (const targetId of unresolvedTargets) {
        // Search from the END of allNodes (deeper/later nodes first)
        // so we prefer leaf containers like card over wrapper containers.
        // Skip: root node (allNodes[0]), nodes with ids, source nodes,
        // and ancestors that contain the source.
        let candidate: UISchema | null = null;

        for (let i = allNodes.length - 1; i >= 1; i--) {
          const node = allNodes[i];
          if (node.props?.['id']) continue;           // already has id
          if (node.props?.['contentTarget']) continue; // is a source
          if (isAncestorOfSource(node)) continue;      // contains the source

          if (containerTypes.has(node.type)) {
            candidate = node;
            break;
          }
        }

        // Fallback: any non-source, non-root node without an id
        if (!candidate) {
          for (let i = allNodes.length - 1; i >= 1; i--) {
            const node = allNodes[i];
            if (node.props?.['id'] || node.props?.['contentTarget']) continue;
            candidate = node;
            break;
          }
        }

        if (candidate) {
          if (!candidate.props) candidate.props = {};
          candidate.props['id'] = targetId;
          existingIds.add(targetId);
        }
      }
    }

    // Auto-assign ids to source components that lack one
    for (const node of allNodes) {
      if (node.props?.['contentTarget'] && !node.props['id']) {
        node.props['id'] = `__auto_${node.type}_${this.autoIdCounter++}`;
      }
    }
  }

  /**
   * Resolve multiple child containers for components that distribute
   * children across separate hosts (e.g., tabs → one VCR per panel).
   * Components opt-in by exposing a `getChildContainers()` method.
   */
  private resolveMultiChildContainers(
    componentRef: ComponentRef<any>,
  ): ViewContainerRef[] | null {
    const instance = componentRef.instance;
    if (typeof instance.getChildContainers === 'function') {
      const containers = instance.getChildContainers();
      if (Array.isArray(containers) && containers.length > 0) {
        return containers;
      }
    }
    return null;
  }

  /**
   * Recursively render a schema tree into a ViewContainerRef
   * Creates component instances and wires inputs/outputs
   * Handles children rendering and projection
   *
   * @param isRoot - internal flag, true only for the top-level call.
   *   When true a pre-processing pass auto-assigns missing `id` props
   *   for components referenced by contentTarget.
   */
  renderSchemaTree(
    schema: UISchema,
    viewContainer: ViewContainerRef,
    isRoot = true,
  ): RenderResult {
    // On root entry, fix up missing contentTarget IDs across the whole tree
    if (isRoot) {
      this.patchContentTargetIds(schema);
    }

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
        // Try multi-container distribution first (e.g., tabs → one VCR per panel)
        let multiContainers = this.resolveMultiChildContainers(componentRef);
        // @ViewChildren populated by *ngFor may need a second CD cycle
        if (!multiContainers && typeof componentRef.instance.getChildContainers === 'function') {
          componentRef.changeDetectorRef.detectChanges();
          multiContainers = this.resolveMultiChildContainers(componentRef);
        }
        if (multiContainers) {
          schema.children.forEach((childSchema, index) => {
            if (index < multiContainers.length) {
              const childResult = this.renderSchemaTree(childSchema, multiContainers[index], false);
              if (childResult.component) {
                childComponents.push(childResult.component);
              }
            }
          });
        } else {
          // Single-container fallback
          const childContainer = this.resolveChildContainer(componentRef, schema);
          if (!childContainer) {
            console.warn(
              `Component '${schema.type}' does not expose a child ViewContainerRef for rendering children`
            );
          } else {
            schema.children.forEach((childSchema) => {
              const childResult = this.renderSchemaTree(childSchema, childContainer, false);
              if (childResult.component) {
                childComponents.push(childResult.component);
              }
            });
          }
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
