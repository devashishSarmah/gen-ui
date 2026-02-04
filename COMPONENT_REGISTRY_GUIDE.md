# Component Registry & Integration Guide

## Overview

This guide explains how to add custom components to the Conversational UI system and integrate them with the AI schema generation.

## Component Registry Architecture

The system uses a component registry pattern that allows:
- Dynamic component registration
- Schema-driven component instantiation
- AI-guided component generation
- Type-safe component properties

## Adding Custom Components

### Step 1: Create Component

Create a new Angular component:

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-form',
  standalone: true,
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="formData.name" name="name" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class CustomFormComponent {
  @Input() schema: any;
  @Input() initialData: any;
  @Output() dataChanged = new EventEmitter<any>();

  formData = { name: '' };

  onSubmit() {
    this.dataChanged.emit(this.formData);
  }
}
```

### Step 2: Define Component Schema

Define the schema that describes your component:

```typescript
export const CUSTOM_FORM_SCHEMA = {
  name: 'CustomForm',
  type: 'custom-form',
  description: 'A custom form component',
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          label: { type: 'string' },
          required: { type: 'boolean' },
          type: { type: 'string', enum: ['text', 'email', 'number'] },
        },
      },
    },
  },
};
```

### Step 3: Register Component

Register the component in the component registry:

```typescript
import { COMPONENT_REGISTRY } from './component-registry';
import { CustomFormComponent } from './custom-form.component';
import { CUSTOM_FORM_SCHEMA } from './custom-form.schema';

COMPONENT_REGISTRY.register({
  name: 'CustomForm',
  schema: CUSTOM_FORM_SCHEMA,
  component: CustomFormComponent,
  lazy: true, // Load only when needed
});
```

### Step 4: Use in Templates

The system automatically instantiates registered components:

```typescript
// Template automatically resolves component based on schema
<app-dynamic-component 
  [schema]="schema"
  [data]="data"
  (onDataChange)="handleChange($event)">
</app-dynamic-component>
```

## Component Schema Specification

Components are defined by their schema:

```typescript
{
  name: string;              // Component name
  type: string;              // Component type (used for AI generation)
  description: string;       // Human-readable description
  properties: {              // JSON Schema properties
    [key: string]: {
      type: string;
      description?: string;
      default?: any;
      enum?: any[];
      items?: any;           // For arrays
    }
  };
  required?: string[];       // Required properties
  examples?: any[];          // Example configurations
}
```

## Integrating with AI Provider

AI providers need to understand component types to generate appropriate schemas.

### 1. Define AI Prompts

```typescript
export const COMPONENT_GENERATION_PROMPTS = {
  'CustomForm': `
    Generate a form component schema with the following structure:
    - fields: array of form fields
    - Each field has: name, label, required, type
    - Types can be: text, email, number, select, checkbox
  `,
  'Table': `
    Generate a table component schema with:
    - columns: array of column definitions
    - Each column: name, label, dataType, sortable
  `,
};
```

### 2. Add to AI Provider

```typescript
// In your AI provider implementation
class OpenAiProvider implements IAiProvider {
  async generateSchema(prompt: string): Promise<any> {
    // Include component registry in context
    const registeredComponents = COMPONENT_REGISTRY.list();
    const enhancedPrompt = `
      ${prompt}
      
      Available components: ${registeredComponents.map(c => c.name).join(', ')}
      
      Component schemas:
      ${registeredComponents.map(c => JSON.stringify(c.schema, null, 2)).join('\n')}
    `;

    return await this.openai.createCompletion(enhancedPrompt);
  }
}
```

## Common Component Patterns

### Input Component

```typescript
@Component({
  selector: 'app-input',
  standalone: true,
  template: `
    <div class="form-group">
      <label>{{ schema.label }}</label>
      <input 
        [type]="schema.type" 
        [(ngModel)]="value"
        (change)="onChange()"
      />
    </div>
  `,
})
export class InputComponent {
  @Input() schema: { label: string; type: string };
  @Input() initialValue: any;
  @Output() dataChanged = new EventEmitter<any>();

  value: any;

  ngOnInit() {
    this.value = this.initialValue;
  }

  onChange() {
    this.dataChanged.emit(this.value);
  }
}
```

### Select Component

```typescript
@Component({
  selector: 'app-select',
  standalone: true,
  template: `
    <div class="form-group">
      <label>{{ schema.label }}</label>
      <select [(ngModel)]="value" (change)="onChange()">
        <option *ngFor="let opt of schema.options" [value]="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
  `,
})
export class SelectComponent {
  @Input() schema: any;
  @Input() initialValue: any;
  @Output() dataChanged = new EventEmitter<any>();

  value: any;

  ngOnInit() {
    this.value = this.initialValue;
  }

  onChange() {
    this.dataChanged.emit(this.value);
  }
}
```

## Component Lifecycle

1. **Schema Generation**: AI provider generates schema for component
2. **Registration**: Component registers in component registry
3. **Instantiation**: DynamicComponentService creates component instance
4. **Data Binding**: Component receives input data and schema
5. **User Interaction**: Component emits data changes
6. **State Update**: Parent updates conversation state
7. **Snapshot**: State manager captures component state

## Performance Considerations

- **Lazy Loading**: Use `lazy: true` for heavy components
- **Change Detection**: Components use OnPush strategy when possible
- **Virtual Scrolling**: For lists, use `appVirtualScroll` directive
- **Debouncing**: Input components debounce changes by default

## Testing Components

```typescript
describe('CustomFormComponent', () => {
  let component: CustomFormComponent;
  let fixture: ComponentFixture<CustomFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit data on submit', () => {
    spyOn(component.dataChanged, 'emit');
    component.formData.name = 'Test';
    component.onSubmit();
    expect(component.dataChanged.emit).toHaveBeenCalledWith({ name: 'Test' });
  });
});
```

## Troubleshooting

**Component not rendering:**
- Check if component is registered in COMPONENT_REGISTRY
- Verify schema matches generated schema structure
- Check browser console for errors

**Data not updating:**
- Verify dataChanged Output is emitted correctly
- Check if parent component is listening to events
- Verify OnPush change detection isn't blocking updates

**Performance issues:**
- Enable lazy loading for heavy components
- Use virtual scrolling for large lists
- Check for unnecessary change detection cycles
