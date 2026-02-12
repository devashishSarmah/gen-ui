import { Injectable, Type } from '@angular/core';
import { COMPONENT_LIBRARY } from '@gen-ui/design-system/component-library';

export interface ComponentCapability {
  name: string;
  description?: string;
  propsSchema: Record<string, any>;
  eventsSchema?: Record<string, any>;
  validation?: Record<string, any>;
  isContainer?: boolean;
  contentHost?: string;
}

export interface RegisteredComponent {
  type: string;
  component: Type<any>;
  capability: ComponentCapability;
}

@Injectable({
  providedIn: 'root',
})
export class ComponentRegistryService {
  private registry = new Map<string, RegisteredComponent>();

  constructor() {
    this.registerLibraryComponents();
  }

  /**
   * Register all library components on initialization
   */
  private registerLibraryComponents(): void {
    const containerCapabilities: Record<string, { isContainer: boolean; contentHost: string }> = {
      container: { isContainer: true, contentHost: 'containerHost' },
      grid: { isContainer: true, contentHost: 'gridHost' },
      card: { isContainer: true, contentHost: 'cardContent' },
      tabs: { isContainer: true, contentHost: 'tabsHost' },
      flexbox: { isContainer: true, contentHost: 'flexHost' },
      accordion: { isContainer: true, contentHost: 'accordionHost' },
      toolbar: { isContainer: true, contentHost: 'toolbarHost' },
    };

    COMPONENT_LIBRARY.forEach((libComponent) => {
      const containerCapability = containerCapabilities[libComponent.name];
      this.register(libComponent.name, libComponent.component, {
        name: libComponent.name,
        description: libComponent.description,
        propsSchema: libComponent.propsSchema,
        ...(containerCapability ?? {}),
      });
    });
  }

  /**
   * Register a component in the registry
   */
  register(
    type: string,
    component: Type<any>,
    capability: ComponentCapability
  ): void {
    if (this.registry.has(type)) {
      console.warn(`Component type '${type}' already registered, replacing`);
    }
    this.registry.set(type, { type, component, capability });
  }

  /**
   * Register multiple components at once
   */
  registerBatch(components: RegisteredComponent[]): void {
    components.forEach((item) => {
      this.register(item.type, item.component, item.capability);
    });
  }

  /**
   * Get registered component by type
   */
  get(type: string): RegisteredComponent | undefined {
    return this.registry.get(type);
  }

  /**
   * Check if component type is registered
   */
  has(type: string): boolean {
    return this.registry.has(type);
  }

  /**
   * Get all registered component types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get all registered components
   */
  getAll(): RegisteredComponent[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get component capability by type
   */
  getCapability(type: string): ComponentCapability | undefined {
    return this.registry.get(type)?.capability;
  }

  /**
   * Unregister a component
   */
  unregister(type: string): boolean {
    return this.registry.delete(type);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registry.clear();
  }
}
