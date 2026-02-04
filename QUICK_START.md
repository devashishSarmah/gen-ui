# Dynamic UI System - Quick Start Guide

## Installation & Setup (Already Complete)

The Dynamic UI System has been fully implemented. All components and services are ready to use.

## 5-Minute Integration

### Step 1: Import DynamicUIService

```typescript
import { DynamicUIService } from './core/services/dynamic-ui.service';

export class MyComponent {
  constructor(private dynamicUI: DynamicUIService) {}
}
```

### Step 2: Load a Schema

```typescript
const schema = {
  type: 'input',
  props: { label: 'Username' }
};

this.dynamicUI.loadSchema(schema);
```

### Step 3: Access Current Schema

```typescript
const currentSchema = this.dynamicUI.getCurrentSchema();
console.log(currentSchema);
```

### Step 4: React to State Changes

```typescript
// Watch for schema changes
effect(() => {
  const state = this.dynamicUI.uiState();
  if (state.currentSchema) {
    console.log('Schema updated:', state.currentSchema);
  }
  if (state.error) {
    console.error('Error:', state.error);
  }
});
```

## Common Use Cases

### Generate a Form from AI

```typescript
// Receive schema from WebSocket
this.websocket.on('ui:schema', (data) => {
  this.dynamicUI.loadSchema(data.schema);
});
```

### Apply Incremental Updates

```typescript
// Receive patches from WebSocket stream
this.websocket.on('ui:patch', (data) => {
  this.dynamicUI.applyPatchUpdates(data.patches);
});
```

### Handle Errors

```typescript
effect(() => {
  const error = this.dynamicUI.uiState().error;
  if (error) {
    // Show error to user
    this.showErrorModal(error);
  }
});
```

### List Available Components

```typescript
const types = this.dynamicUI.getAvailableComponentTypes();
// Returns: ['input', 'select', 'button', ...]

// Send to AI model for context
this.aiModel.setContext({ components: types });
```

## Component Reference (15 Total)

### Form (6)
```
input      - Text field with multiple types
select     - Dropdown with options
checkbox   - Boolean checkbox
radio      - Radio button group
textarea   - Multi-line text
button     - Interactive button
```

### Layout (4)
```
container  - Max-width wrapper
grid       - CSS Grid layout
card       - Card with header/footer
tabs       - Tabbed interface
```

### Data (3)
```
table      - Data table
list       - List with items
basic-chart - Bar/line/pie charts
```

### Navigation (1)
```
wizard-stepper - Multi-step wizard
```

### Error (1)
```
error      - Error display modal
```

## Schema Format (Quick Reference)

```json
{
  "type": "component-name",
  "props": {
    "prop1": "value",
    "prop2": 123
  },
  "children": [
    { "type": "...", "props": {...} }
  ]
}
```

## Common Patterns

### Simple Form
```json
{
  "type": "card",
  "props": { "title": "Contact" },
  "children": [
    { "type": "input", "props": { "label": "Name" } },
    { "type": "button", "props": { "label": "Submit" } }
  ]
}
```

### Two-Column Layout
```json
{
  "type": "grid",
  "props": { "columns": 2, "gap": 16 },
  "children": [
    { "type": "card", "props": { "title": "Left" } },
    { "type": "card", "props": { "title": "Right" } }
  ]
}
```

### Add Validation Error
```json
[
  {
    "op": "add",
    "path": "/children/0/props/error",
    "value": "This field is required"
  }
]
```

## Debugging

### Check Registered Components
```typescript
console.log(this.dynamicUI.getAvailableComponentTypes());
```

### Validate Schema
```typescript
import { SchemaRendererService } from './core/services/schema-renderer.service';

constructor(private renderer: SchemaRendererService) {}

const { valid, errors } = this.renderer.validateSchema(schema);
if (!valid) {
  console.error('Schema errors:', errors);
}
```

### Check Current State
```typescript
const state = this.dynamicUI.uiState();
console.log('Schema:', state.currentSchema);
console.log('Error:', state.error);
console.log('Loading:', state.loading);
console.log('History:', state.schemaHistory);
```

## Performance Tips

1. **Use JSON Patch for Streaming**
   - Smaller payloads than full schemas
   - Faster rendering

2. **Validate Before Loading**
   - Catch errors early
   - Better error messages

3. **Leverage Schema History**
   - Undo/redo support
   - Revert problematic updates

## Common Errors & Solutions

### "Component type 'xyz' not registered"
**Solution:** Check component name spelling, verify it's in COMPONENT_LIBRARY

### "Property 'abc' should be type string"
**Solution:** Check propsSchema, ensure prop types match definitions

### "Invalid JSON Pointer path"
**Solution:** Verify path syntax (e.g., `/children/0/props/label`)

### "No current schema to patch"
**Solution:** Load a schema with `loadSchema()` before applying patches

## Testing Examples

```typescript
// Test schema loading
it('should load schema', () => {
  const schema = { type: 'button', props: { label: 'Test' } };
  service.loadSchema(schema);
  expect(service.getCurrentSchema()).toEqual(schema);
});

// Test schema validation
it('should validate schema', () => {
  const schema = { type: 'button', props: { label: 'Test' } };
  const { valid } = renderer.validateSchema(schema);
  expect(valid).toBe(true);
});

// Test JSON Patch
it('should apply patches', () => {
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

## API Reference (Cheat Sheet)

```typescript
// DynamicUIService
dynamicUI.loadSchema(schema)          // Load full schema
dynamicUI.applyPatchUpdates(patches)  // Apply JSON Patch
dynamicUI.getCurrentSchema()           // Get current schema
dynamicUI.clearSchema()                // Clear schema
dynamicUI.getSchemaHistory()           // Get previous schemas
dynamicUI.revertToPrevious()           // Undo
dynamicUI.getAvailableComponentTypes() // List components
dynamicUI.getComponentCapability(type) // Get props schema
dynamicUI.setLoading(bool)             // Set loading state
dynamicUI.uiState()                    // Get full state Signal

// SchemaRendererService
renderer.renderComponent(schema)       // Create component instance
renderer.validateSchema(schema)        // Validate schema
renderer.applyJsonPatch(schema, patches) // Apply patches
renderer.schemaToJson(schema)          // Serialize
renderer.jsonToSchema(json)            // Deserialize

// ComponentRegistryService
registry.register(type, component, capability)
registry.get(type)                     // Get registered component
registry.has(type)                     // Check if registered
registry.getRegisteredTypes()          // List all types
registry.getAll()                      // Get all components
registry.getCapability(type)           // Get metadata
```

## Next: Connect to WebSocket

```typescript
// In conversation-view.component.ts

this.websocket.connect().then(() => {
  // Listen for UI schemas
  this.websocket.on('ui:schema', (data) => {
    this.dynamicUI.setLoading(false);
    this.dynamicUI.loadSchema(data.schema);
  });

  // Listen for incremental updates
  this.websocket.on('ui:patch', (data) => {
    this.dynamicUI.applyPatchUpdates(data.patches);
  });

  // Listen for errors
  this.websocket.on('ui:error', (data) => {
    this.dynamicUI.setError(data.message);
  });

  // Send prompts for UI generation
  this.onUserMessage = (message) => {
    this.dynamicUI.setLoading(true);
    this.websocket.sendPrompt(message);
  };
});
```

## Resources

- **Complete Guide:** DYNAMIC_UI_INTEGRATION.md
- **Architecture:** SYSTEM_ARCHITECTURE.md
- **Examples:** SCHEMA_EXAMPLES.md
- **Checklist:** IMPLEMENTATION_CHECKLIST.md
- **Summary:** DYNAMIC_UI_SUMMARY.md

---

**Status:** ✅ Ready for Production Use

The system is fully implemented, type-safe, documented, and ready for integration with your AI model and WebSocket gateway.
