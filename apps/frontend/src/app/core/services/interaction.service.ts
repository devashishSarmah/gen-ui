import { Injectable, inject, ComponentRef, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ClientDataEngine } from './client-data-engine.service';

/**
 * Client-side interaction service.
 *
 * Listens to @Output events from dynamically rendered components and routes
 * them entirely client-side:
 *
 *  - Form "state" events (input/select/checkbox changes) → update form state
 *    store AND push filter updates to ClientDataEngine
 *  - "action" events (button clicks, tab switches, etc.) → handled locally
 *    (no backend roundtrip)
 *
 * The AI is ONLY called when the user types a new chat message.
 */

export type EventKind = 'action' | 'state';

interface EventMapping {
  kind: EventKind;
  describe: (componentId: string | undefined, componentType: string, value: any) => string;
}

/** Registry of known @Output names → how to handle them */
const EVENT_REGISTRY: Record<string, EventMapping> = {
  // Form state events — update local store + data engine filters
  valueChange: {
    kind: 'state',
    describe: (id, type, val) => `${type}${id ? ` "${id}"` : ''} value changed to "${val}"`,
  },
  change: {
    kind: 'state',
    describe: (id, type, val) => `${type}${id ? ` "${id}"` : ''} changed to "${val}"`,
  },
  checkedChange: {
    kind: 'state',
    describe: (id, _type, val) => `checkbox${id ? ` "${id}"` : ''} ${val ? 'checked' : 'unchecked'}`,
  },

  // Action events — handled locally (no backend dispatch)
  btnClick: {
    kind: 'action',
    describe: (id, _type, _val) => `Button${id ? ` "${id}"` : ''} clicked`,
  },
  actionSelected: {
    kind: 'action',
    describe: (id, _type, val) =>
      `Menu action "${val?.label || val?.id || val}" selected${id ? ` from "${id}"` : ''}`,
  },
  stepChange: {
    kind: 'action',
    describe: (id, _type, val) => `Wizard step changed to ${val}${id ? ` in "${id}"` : ''}`,
  },
  tabChange: {
    kind: 'action',
    describe: (id, _type, val) => `Tab "${val}" selected${id ? ` in "${id}"` : ''}`,
  },
  itemClick: {
    kind: 'action',
    describe: (id, _type, val) =>
      `Timeline item "${val?.item?.title || val}" clicked${id ? ` in "${id}"` : ''}`,
  },
  panelToggle: {
    kind: 'action',
    describe: (id, _type, val) =>
      `Accordion panel "${val?.title || val}" toggled${id ? ` in "${id}"` : ''}`,
  },
  pageChange: {
    kind: 'action',
    describe: (id, _type, val) => `Page changed to ${val}${id ? ` in "${id}"` : ''}`,
  },

  // Blur — ignored
  blur: {
    kind: 'state',
    describe: () => '',
  },
};

/**
 * Filter binding metadata attached to a form component via schema props.
 * Example schema: { type: "input", props: { id: "search", filterTarget: "jobTable", filterField: "title" } }
 */
interface FilterBinding {
  /** Data source id to filter (e.g. "jobTable") */
  target: string;
  /** Data field to filter on (e.g. "title", "location") */
  field: string;
  /** Filter operator (default: "contains") */
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
}

@Injectable({ providedIn: 'root' })
export class InteractionService {
  private dataEngine = inject(ClientDataEngine);

  /** Live form-field values keyed by component id. */
  private formState = new Map<string, any>();

  /**
   * Filter bindings: componentId → FilterBinding.
   * Populated when a form component has `filterTarget` + `filterField` props.
   */
  private filterBindings = new Map<string, FilterBinding>();

  /**
   * Data component refs: sourceId → ComponentRef.
   * Lets us push filtered data back to the component.
   */
  private dataComponentRefs = new Map<string, ComponentRef<any>>();

  /**
   * General component refs: componentId → ComponentRef.
   * Used for content-target linking (e.g., timeline itemClick → update card).
   */
  private allComponentRefs = new Map<string, ComponentRef<any>>();

  /**
   * Content-target bindings: sourceComponentId → targetComponentId.
   * When a source emits itemClick/stepChange, the target component's
   * props get updated from the clicked item's metadata.
   */
  private contentTargetBindings = new Map<string, string>();

  /**
   * Component types: componentId → schema type string (e.g. 'card', 'flexbox').
   * Needed by SchemaRendererService to resolve the correct child ViewContainerRef.
   */
  private componentTypes = new Map<string, string>();

  /**
   * Emitted when metadata.children needs to be rendered into a target container.
   * SchemaRendererService subscribes to this to avoid circular dependency.
   */
  readonly contentChildrenUpdate$ = new Subject<{
    targetId: string;
    targetRef: ComponentRef<any>;
    targetType: string;
    children: any[];
    targetProps?: Record<string, any>;
  }>();

  /** Signal: true when an interaction is in progress (kept for API compat). */
  readonly interacting = signal(false);

  // ── Context (kept for renderer compat, no-op for backend) ──────────

  setContext(_conversationId: string, _messageId: string): void {
    // No-op — we don't dispatch to backend anymore
  }

  clearContext(): void {
    this.formState.clear();
    this.filterBindings.clear();
    this.dataComponentRefs.clear();
    this.allComponentRefs.clear();
    this.contentTargetBindings.clear();
    this.componentTypes.clear();
    this.dataEngine.clearAll();
  }

  // ── Event wiring ───────────────────────────────────────────────────

  /**
   * Called by SchemaRendererService after creating a component.
   * Subscribes to known @Outputs and routes them client-side.
   */
  wireComponentEvents(
    componentRef: ComponentRef<any>,
    componentType: string,
    componentId?: string,
    schemaProps?: Record<string, any>,
  ): void {
    // Seed initial form state
    this.seedInitialState(componentRef, componentType, componentId);

    // Store all component refs by ID for content-target linking
    if (componentId) {
      this.allComponentRefs.set(componentId, componentRef);
      this.componentTypes.set(componentId, componentType);
    }

    // Register content-target binding (e.g., timeline → card linking)
    if (componentId && schemaProps?.['contentTarget']) {
      this.contentTargetBindings.set(componentId, schemaProps['contentTarget']);
    }

    // Register filter binding if the component has filterTarget
    if (componentId && schemaProps?.['filterTarget'] && schemaProps?.['filterField']) {
      this.filterBindings.set(componentId, {
        target: schemaProps['filterTarget'],
        field: schemaProps['filterField'],
        operator: schemaProps['filterOperator'] || 'contains',
      });
    }

    // Register data source if it's a data component with an id
    if (componentId && this.isDataComponent(componentType)) {
      const instance = componentRef.instance;
      const data = instance.data ?? instance.items ?? instance.options ?? [];
      const pageSize = schemaProps?.['pageSize'] ?? 0;
      this.dataEngine.registerSource(componentId, data, pageSize);
      this.dataComponentRefs.set(componentId, componentRef);
    }

    // Subscribe to all known @Outputs
    for (const [eventName, mapping] of Object.entries(EVENT_REGISTRY)) {
      const output = (componentRef.instance as any)[eventName];
      if (!output || typeof output.subscribe !== 'function') continue;

      output.subscribe((eventValue: any) => {
        this.handleEvent(mapping, eventName, eventValue, componentType, componentId);
      });
    }
  }

  /**
   * Seed form state with initial values.
   */
  private seedInitialState(
    componentRef: ComponentRef<any>,
    componentType: string,
    componentId?: string,
  ): void {
    if (!componentId) return;

    const instance = componentRef.instance;
    const formTypes = ['input', 'select', 'textarea', 'checkbox'];
    if (!formTypes.includes(componentType)) return;

    if (componentType === 'checkbox') {
      this.formState.set(componentId, instance.checked ?? false);
    } else {
      this.formState.set(componentId, instance.value ?? '');
    }
  }

  private isDataComponent(type: string): boolean {
    return ['table', 'list', 'listbox'].includes(type);
  }

  // ── Event handling (client-side only) ──────────────────────────────

  private handleEvent(
    mapping: EventMapping,
    eventName: string,
    eventValue: any,
    componentType: string,
    componentId?: string,
  ): void {
    if (eventName === 'blur') return;

    if (mapping.kind === 'state') {
      // Update local form state
      if (componentId) {
        this.formState.set(componentId, eventValue);
      }

      // Push to data engine if there's a filter binding
      if (componentId) {
        const binding = this.filterBindings.get(componentId);
        if (binding) {
          this.dataEngine.applyFilter(
            binding.target,
            componentId,
            eventValue === '' || eventValue == null
              ? null
              : { field: binding.field, operator: binding.operator, value: eventValue },
          );
          // Push filtered data back to the data component
          this.refreshDataComponent(binding.target);
        }
      }
      return;
    }

    // Action events — handle locally
    if (eventName === 'btnClick' && componentId) {
      this.handleButtonAction(componentId);
    }

    // Content-target actions: itemClick / stepChange update linked component
    if ((eventName === 'itemClick' || eventName === 'stepChange') && componentId) {
      this.handleContentTargetAction(componentId, eventName, eventValue);
    }
  }

  /**
   * Handle button clicks client-side.
   * For buttons with special roles like "clearFilters", "nextPage", etc.
   */
  private handleButtonAction(componentId: string): void {
    // Convention: button ids like "clearFilters_<sourceId>" clear all filters
    if (componentId.startsWith('clearFilters_')) {
      const sourceId = componentId.replace('clearFilters_', '');
      for (const [filterId, binding] of this.filterBindings.entries()) {
        if (binding.target === sourceId) {
          this.dataEngine.applyFilter(sourceId, filterId, null);
        }
      }
      this.refreshDataComponent(sourceId);
    }

    // Convention: "nextPage_<sourceId>" / "prevPage_<sourceId>"
    if (componentId.startsWith('nextPage_')) {
      const sourceId = componentId.replace('nextPage_', '');
      const current = this.dataEngine.getCurrentPage(sourceId);
      this.dataEngine.setPage(sourceId, current + 1);
      this.refreshDataComponent(sourceId);
    }
    if (componentId.startsWith('prevPage_')) {
      const sourceId = componentId.replace('prevPage_', '');
      const current = this.dataEngine.getCurrentPage(sourceId);
      this.dataEngine.setPage(sourceId, current - 1);
      this.refreshDataComponent(sourceId);
    }
  }

  /**
   * Handle content-target linking for itemClick / stepChange.
   *
   * When a timeline or stepper with `contentTarget` prop emits an event,
   * find the linked component and update its props from the clicked item's
   * metadata (for timeline) or step metadata (for stepper).
   */
  private handleContentTargetAction(
    componentId: string,
    eventName: string,
    eventValue: any,
  ): void {
    const targetId = this.contentTargetBindings.get(componentId);
    if (!targetId) return;

    const targetRef = this.allComponentRefs.get(targetId);
    if (!targetRef) {
      console.warn(
        `[InteractionService] contentTarget "${targetId}" not found. ` +
        `Make sure the target component has id="${targetId}" in its props.`
      );
      return;
    }

    // Extract metadata from the event value
    let metadata: Record<string, any> | undefined;

    if (eventName === 'itemClick') {
      // eventValue = { index, item: TimelineItem }
      metadata = eventValue?.item?.metadata;
    } else if (eventName === 'stepChange') {
      // eventValue = step index — look up steps from source component
      const sourceRef = this.allComponentRefs.get(componentId);
      if (sourceRef) {
        const steps = sourceRef.instance.steps;
        if (Array.isArray(steps) && steps[eventValue]) {
          metadata = steps[eventValue]?.metadata;
        }
      }
    }

    if (!metadata || typeof metadata !== 'object') return;

    const targetType = this.componentTypes.get(targetId) || 'unknown';

    // If metadata contains a children array, emit for SchemaRendererService
    // to re-render the target's child tree from the new schema.
    if (Array.isArray(metadata['children'])) {
      // Also apply any non-children props (e.g. title)
      const { children, ...propsToApply } = metadata;
      const setInput = (targetRef as any).setInput;
      for (const [key, value] of Object.entries(propsToApply)) {
        if (typeof setInput === 'function') {
          setInput.call(targetRef, key, value);
        } else {
          (targetRef.instance as any)[key] = value;
        }
      }
      targetRef.changeDetectorRef.markForCheck();

      this.contentChildrenUpdate$.next({
        targetId,
        targetRef,
        targetType,
        children: metadata['children'],
        targetProps: propsToApply,
      });
      return;
    }

    // Flat metadata: apply key/values as props on the target component
    const setInput = (targetRef as any).setInput;
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof setInput === 'function') {
        setInput.call(targetRef, key, value);
      } else {
        (targetRef.instance as any)[key] = value;
      }
    }
    targetRef.changeDetectorRef.markForCheck();
  }

  /**
   * Push the current filtered/sorted/paginated data from the engine
   * back to the data component for re-render.
   */
  private refreshDataComponent(sourceId: string): void {
    const ref = this.dataComponentRefs.get(sourceId);
    if (!ref) return;

    const filteredData = this.dataEngine.getData(sourceId);
    const instance = ref.instance;

    // Call updateData() if the component supports it (table, list)
    if (typeof instance.updateData === 'function') {
      instance.updateData(filteredData);
    } else {
      // Fallback: set data/items directly
      if ('data' in instance) {
        instance.data = filteredData;
      } else if ('items' in instance) {
        instance.items = filteredData;
      }
    }

    ref.changeDetectorRef.markForCheck();
  }

  // ── Public accessors ───────────────────────────────────────────────

  /** Get current form state snapshot. */
  getFormSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    this.formState.forEach((val, key) => (snapshot[key] = val));
    return snapshot;
  }

  /** Reset the interacting flag (kept for API compat). */
  completeInteraction(): void {
    this.interacting.set(false);
  }
}
