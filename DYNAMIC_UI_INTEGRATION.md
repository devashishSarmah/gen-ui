# Dynamic UI System Integration Guide

## Overview

The Dynamic UI System enables AI-generated component rendering in Angular. It provides:

1. **Component Registry** - Maps component types to Angular components with metadata
2. **Schema Renderer** - Interprets UI schemas and creates component instances
3. **Static Component Library** - Pre-built form, layout, data display, navigation, and error components
4. **Dynamic UI Service** - Orchestrates schema loading and patches

## Architecture

```
┌─────────────────────────────────────────┐
│         WebSocket Connection             │
│    (AI Model → Frontend Streaming)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ UIStateStore   │  (RxJS Store)
        └────────┬───────┘
                 │
    ┌────────────┴───────────┐
    ▼                        ▼
┌──────────────┐      ┌─────────────────┐
│ DynamicUI    │      │ SchemaRenderer  │
│ Service      │◄────►│ Service         │
└──────────────┘      └────────┬────────┘
     │                         │
     │            ┌────────────┴─────────────┐
     │            ▼                         ▼
     │      ┌──────────────────┐    ┌──────────────────┐
     │      │ ComponentRegistry │    │ JSON Patch       │
     │      │ Service          │    │ Operations       │
     │      └────────┬─────────┘    └──────────────────┘
     │              │
     │              ▼
     │      ┌──────────────────┐
     │      │ ComponentLibrary │
     │      │ (15+ Components) │
     │      └──────────────────┘
     │
     ▼
┌──────────────────────────┐
│ Rendered Dynamic UI      │
│ (Angular Components)     │
└──────────────────────────┘
```

## Component Types Available

### Form Components (6)
- **input** - Text input with validation
- **select** - Dropdown with options
- **checkbox** - Boolean checkbox
- **radio** - Radio button group
- **textarea** - Multi-line text
- **button** - Interactive button

### Layout Components (4)
- **container** - Max-width container
- **grid** - CSS Grid layout
- **card** - Card with header/footer
- **tabs** - Tabbed interface

### Data Display Components (3)
- **table** - Data table with sorting
- **list** - List with items and descriptions
- **basic-chart** - Bar/line/pie charts

### Navigation Components (1)
- **wizard-stepper** - Multi-step wizard

### Error Components (1)
- **error** - Error display with actions

## UI Schema Format

A schema is a JSON object describing a component tree:

```json
{
  "type": "container",
  "props": {
    "maxWidth": 1200,
    "variant": "default"
  },
  "children": [
    {
      "type": "card",
      "props": {
        "title": "User Form",
        "elevated": true
      },
      "children": [
        {
          "type": "input",
          "props": {
            "label": "Username",
            "placeholder": "Enter username",
            "required": true
          }
        },
        {
          "type": "button",
          "props": {
            "label": "Submit",
            "variant": "primary"
          }
        }
      ]
    }
  ]
}
```

## Usage Examples

### 1. Load Complete Schema (Full UI Replacement)

```typescript
import { DynamicUIService } from './core/services/dynamic-ui.service';

constructor(private dynamicUI: DynamicUIService) {}

ngOnInit() {
  const schema = {
    type: 'container',
    props: { maxWidth: 1200 },
    children: [
      {
        type: 'card',
        props: { title: 'Welcome' },
        children: [
          {
            type: 'button',
            props: { label: 'Click Me', variant: 'primary' }
          }
        ]
      }
    ]
  };

  this.dynamicUI.loadSchema(schema);
}
```

### 2. Apply JSON Patch Updates (Incremental Updates)

```typescript
// When AI streams incremental updates
const patches = [
  {
    op: 'replace',
    path: '/props/title',
    value: 'Updated Title'
  },
  {
    op: 'add',
    path: '/children/-',
    value: {
      type: 'input',
      props: { label: 'New Field' }
    }
  }
];

this.dynamicUI.applyPatchUpdates(patches);
```

### 3. Render Schema in Template

```typescript
import { DynamicUIService } from './core/services/dynamic-ui.service';
import { SchemaRendererService } from './core/services/schema-renderer.service';

export class DynamicUIComponent {
  currentSchema = this.dynamicUI.uiState.currentSchema;

  constructor(
    private dynamicUI: DynamicUIService,
    private renderer: SchemaRendererService
  ) {}

  renderComponent(schema: UISchema) {
    return this.renderer.renderComponent(schema);
  }
}
```

### 4. Get Available Components (For AI Model Context)

```typescript
const availableTypes = this.dynamicUI.getAvailableComponentTypes();
// Returns: ['input', 'select', 'checkbox', 'radio', 'textarea', 'button', ...]

const inputCapability = this.dynamicUI.getComponentCapability('input');
// Returns: {
//   name: 'input',
//   description: 'Text input field with label, placeholder, and validation',
//   propsSchema: { ... }
// }
```

## WebSocket Integration

The system integrates with WebSocket streaming for AI-generated UI:

```typescript
// In conversation-view.component.ts
this.websocket.on('ui:schema', (data: { schema: UISchema }) => {
  this.dynamicUI.loadSchema(data.schema);
});

this.websocket.on('ui:patch', (data: { patches: any[] }) => {
  this.dynamicUI.applyPatchUpdates(data.patches);
});
```

## Validation

Schemas are validated against component capabilities:

```typescript
const { valid, errors } = this.renderer.validateSchema(schema);

if (!valid) {
  console.error('Schema validation failed:', errors);
  // errors = [
  //   "Component type 'invalid-type' not registered",
  //   "Property 'label' should be type string, got number"
  // ]
}
```

## JSON Patch Operations

Supported operations for incremental updates:

### replace
```json
{ "op": "replace", "path": "/props/title", "value": "New Title" }
```

### add
```json
{ "op": "add", "path": "/children/-", "value": { "type": "button", ... } }
{ "op": "add", "path": "/props/disabled", "value": true }
```

### remove
```json
{ "op": "remove", "path": "/children/0" }
{ "op": "remove", "path": "/props/disabled" }
```

### copy
```json
{ "op": "copy", "path": "/children/1", "from": "/children/0" }
```

### move
```json
{ "op": "move", "path": "/children/0", "from": "/children/1" }
```

## Schema History

Track schema versions and revert if needed:

```typescript
// Get full history
const history = this.dynamicUI.getSchemaHistory();

// Revert to previous schema
this.dynamicUI.revertToPrevious();
```

## Component Registration

Register custom components:

```typescript
import { ComponentRegistryService } from './core/services/component-registry.service';

constructor(private registry: ComponentRegistryService) {
  this.registry.register('custom-component', MyCustomComponent, {
    name: 'custom-component',
    description: 'A custom component',
    propsSchema: {
      label: { type: 'string' },
      value: { type: 'any' }
    }
  });
}
```

## Performance Considerations

1. **Schema Validation** - Validate before loading to catch errors early
2. **Component Caching** - ComponentRegistry caches component factories
3. **Patch Efficiency** - JSON Patch is more efficient than full replacement for updates
4. **Lazy Loading** - Components are created on-demand by Angular

## Error Handling

The system provides comprehensive error handling:

```typescript
// Schema validation errors
if (!validation.valid) {
  this.dynamicUI.uiState().error
  // Access via: uiState signal with error property
}

// Rendering errors
const component = this.renderer.renderComponent(schema);
if (!component) {
  // Component type not registered or instantiation failed
}

// Patch errors
try {
  this.dynamicUI.applyPatchUpdates(patches);
} catch (error) {
  // Invalid patch operation
}
```

## Example: Complete Form Generation

```typescript
// AI generates this schema for a user signup form
const signupSchema: UISchema = {
  type: 'container',
  props: { maxWidth: 600 },
  children: [
    {
      type: 'card',
      props: { title: 'Sign Up', elevated: true },
      children: [
        {
          type: 'grid',
          props: { columns: 1, gap: 16 },
          children: [
            {
              type: 'input',
              props: {
                label: 'Full Name',
                placeholder: 'John Doe',
                required: true
              }
            },
            {
              type: 'input',
              props: {
                type: 'email',
                label: 'Email',
                placeholder: 'john@example.com',
                required: true
              }
            },
            {
              type: 'input',
              props: {
                type: 'password',
                label: 'Password',
                required: true
              }
            },
            {
              type: 'checkbox',
              props: {
                label: 'I agree to the terms'
              }
            },
            {
              type: 'button',
              props: {
                label: 'Create Account',
                variant: 'primary'
              }
            }
          ]
        }
      ]
    }
  ]
};

// Load the schema
this.dynamicUI.loadSchema(signupSchema);

// Later, AI updates form with validation errors
const patches = [
  {
    op: 'add',
    path: '/children/0/children/0/children/0/props/error',
    value: 'Full name is required'
  }
];
this.dynamicUI.applyPatchUpdates(patches);
```

## Testing

Example unit tests:

```typescript
it('should load and validate schema', () => {
  const schema: UISchema = {
    type: 'button',
    props: { label: 'Test' }
  };

  service.loadSchema(schema);
  expect(service.getCurrentSchema()).toEqual(schema);
});

it('should apply JSON patches', () => {
  service.loadSchema({
    type: 'button',
    props: { label: 'Original' }
  });

  service.applyPatchUpdates([
    { op: 'replace', path: '/props/label', value: 'Updated' }
  ]);

  expect(service.getCurrentSchema()?.props.label).toBe('Updated');
});
```

## Troubleshooting

**Schema not rendering?**
- Check component type is registered: `registry.has('component-type')`
- Validate schema: `renderer.validateSchema(schema)`
- Check browser console for errors

**Props not applied?**
- Verify prop names match component @Input() names
- Check prop types match propsSchema definition
- Use validateSchema to catch type mismatches

**Patches not working?**
- Ensure path syntax is correct (JSON Pointer format)
- Validate patches before applying
- Check previous schema exists for current update

## Future Enhancements

- [ ] Undo/Redo manager for schema history
- [ ] Schema state persistence (localStorage)
- [ ] Component import optimization (code splitting)
- [ ] Live schema editor UI
- [ ] A/B testing support for UI variants
- [ ] Analytics integration for component interactions
- [ ] Custom event binding and handlers
