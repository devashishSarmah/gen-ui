# System Architecture: Dynamic UI in Gen-UI

## Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                              │
│                   (Chat with AI in Conversation)                     │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Angular 21)                            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ConversationViewComponent (Main Container)                   │   │
│  │                                                                │   │
│  │  • Manages conversation display                              │   │
│  │  • Handles user input                                        │   │
│  │  • WebSocket connection                                      │   │
│  │  • Dynamic UI rendering area                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                ┌─────────────┴──────────────┐                         │
│                │                            │                         │
│                ▼                            ▼                         │
│  ┌──────────────────────────┐   ┌──────────────────────────┐         │
│  │ WebSocketService         │   │ DynamicUIService         │         │
│  │                          │   │                          │         │
│  │ • Socket.IO client       │   │ • Schema loading         │         │
│  │ • JWT auth               │   │ • Patch application      │         │
│  │ • Auto-reconnect         │   │ • State management       │         │
│  │ • Room management        │   │ • History tracking       │         │
│  │                          │   │ • Validation             │         │
│  └──────┬───────────────────┘   └──────┬───────────────────┘         │
│         │                              │                              │
│         │        ┌──────────────────────┴────────────────┐            │
│         │        │                                       │            │
│         ▼        ▼                                       ▼            │
│  ┌─────────────────────┐                    ┌───────────────────┐   │
│  │ Events from Backend:│                    │ SchemaRenderer    │   │
│  │                     │                    │                   │   │
│  │ • ui:schema         │◄──────────────────►│ • Render         │   │
│  │ • ui:patch          │                    │ • Validate       │   │
│  │ • ui:error          │                    │ • Patch Apply    │   │
│  └─────────────────────┘                    └───────────────────┘   │
│         │                                            │                 │
│         │                                            ▼                 │
│         │                                   ┌────────────────────┐   │
│         │                                   │ ComponentRegistry  │   │
│         │                                   │                    │   │
│         │                                   │ • Maps type→comp   │   │
│         │                                   │ • Stores metadata  │   │
│         │                                   │ • 15 components    │   │
│         │                                   └────────┬───────────┘   │
│         │                                            │                 │
│         │                    ┌───────────────────────┴──┐             │
│         │                    │                          │             │
│         │                    ▼                          ▼             │
│         │        ┌──────────────────────────────────────────────┐   │
│         │        │     Component Library (15 Components)         │   │
│         │        │                                               │   │
│         │        │ ┌─ Form (6) ────────────┐                    │   │
│         │        │ │ • input               │                    │   │
│         │        │ │ • select              │                    │   │
│         │        │ │ • checkbox            │                    │   │
│         │        │ │ • radio               │                    │   │
│         │        │ │ • textarea            │                    │   │
│         │        │ │ • button              │                    │   │
│         │        │ └───────────────────────┘                    │   │
│         │        │                                               │   │
│         │        │ ┌─ Layout (4) ──────────┐                    │   │
│         │        │ │ • container           │                    │   │
│         │        │ │ • grid                │                    │   │
│         │        │ │ • card                │                    │   │
│         │        │ │ • tabs                │                    │   │
│         │        │ └───────────────────────┘                    │   │
│         │        │                                               │   │
│         │        │ ┌─ Data Display (3) ────┐                    │   │
│         │        │ │ • table               │                    │   │
│         │        │ │ • list                │                    │   │
│         │        │ │ • basic-chart         │                    │   │
│         │        │ └───────────────────────┘                    │   │
│         │        │                                               │   │
│         │        │ ┌─ Navigation (1) ──────┐                    │   │
│         │        │ │ • wizard-stepper      │                    │   │
│         │        │ └───────────────────────┘                    │   │
│         │        │                                               │   │
│         │        │ ┌─ Error (1) ───────────┐                    │   │
│         │        │ │ • error               │                    │   │
│         │        │ └───────────────────────┘                    │   │
│         │        │                                               │   │
│         │        └──────────────────────────────────────────────┘   │
│         │                     │                                       │
│         │                     ▼                                       │
│         │              ┌─────────────────┐                           │
│         │              │ Rendered UI     │                           │
│         │              │ (Dynamic        │                           │
│         │              │  Components)    │                           │
│         │              └─────────────────┘                           │
│         │                     △                                       │
│         └─────────────────────┘                                       │
│                                                                       │
│              Component Events → WebSocket Service                     │
│                     (User Actions)                                    │
└──────────────────────────────┬──────────────────────────────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
                  ▼                       ▼
        ┌─────────────────────┐  ┌──────────────────┐
        │  WebSocket Event    │  │ Redux/Signal     │
        │  (interaction:*)    │  │ Store Update     │
        └─────────────────────┘  └──────────────────┘
                  │                       │
                  └───────────┬───────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                                  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ WebSocket Gateway (Socket.IO)                               │   │
│  │                                                                │   │
│  │  • Receives: prompt, interaction events                      │   │
│  │  • Sends: ui:schema, ui:patch, messages                      │   │
│  │  • Auth: JWT validation per message                          │   │
│  │  • Rooms: Conversation-scoped                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                ┌─────────────┴──────────────┐                       │
│                │                            │                       │
│                ▼                            ▼                       │
│  ┌──────────────────────────┐   ┌──────────────────────────┐       │
│  │ AI Provider Service      │   │ State Management Service │       │
│  │ (OpenAI/Anthropic)       │   │                          │       │
│  │                          │   │ • Current state snapshot │       │
│  │ • Model: GPT-4 / Claude3 │   │ • State versioning       │       │
│  │ • Mode: JSON Schema      │   │ • Redis caching          │       │
│  │ • Streaming: Yes         │   │ • PostgreSQL persistence │       │
│  │ • Generates: UI schemas  │   │                          │       │
│  │   and JSON Patches       │   │ • Interaction logging    │       │
│  └──────────┬───────────────┘   └──────┬───────────────────┘       │
│             │                          │                            │
│             └──────────┬───────────────┘                            │
│                        │                                             │
│                        ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │ Response Builder                                         │       │
│  │                                                           │       │
│  │ Option 1: Full UI Schema                                 │       │
│  │ { "type": "...", "props": {...}, "children": [...] }    │       │
│  │                                                           │       │
│  │ Option 2: JSON Patches (Incremental)                     │       │
│  │ [{ "op": "replace", "path": "/...", "value": ... }]     │       │
│  │                                                           │       │
│  │ Option 3: Error Response                                 │       │
│  │ { "error": "...", "code": "..." }                        │       │
│  └──────────────────────────────────────────────────────────┘       │
│                        │                                             │
│                        ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │ Persistence Layer                                        │       │
│  │                                                           │       │
│  │ • PostgreSQL: Conversations, messages, interactions      │       │
│  │ • Redis: Session state, generated schemas               │       │
│  │ • TypeORM: Migrations, relationships                    │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: User Requests Form Generation

```
User Input:
  "Generate a user registration form"
                    │
                    ▼
         WebSocket: "sendPrompt"
                    │
                    ▼
    Backend AI Provider (GPT-4/Claude)
                    │
                    ▼
         Generates UI Schema:
{
  "type": "container",
  "props": { "maxWidth": 600 },
  "children": [{
    "type": "card",
    "props": { "title": "Register" },
    "children": [{
      "type": "input",
      "props": { "label": "Email", "required": true }
    }]
  }]
}
                    │
                    ▼
    WebSocket: "ui:schema" event
                    │
                    ▼
    Frontend DynamicUIService.loadSchema()
                    │
                    ▼
    SchemaRenderer validates & renders
                    │
                    ▼
    ComponentRegistry resolves types
                    │
                    ▼
    Angular creates component instances
                    │
                    ▼
    User sees rendered form
```

### Example 2: AI Streams Incremental Update

```
User Interaction: "Add password field"
                    │
                    ▼
         Backend AI Provider streams:
[
  { "op": "add", "path": "/children/0/children/-", 
    "value": { "type": "input", 
               "props": { "label": "Password", "type": "password" } } }
]
                    │
                    ▼
    WebSocket: "ui:patch" events (one per patch)
                    │
                    ▼
    Frontend DynamicUIService.applyPatchUpdates()
                    │
                    ▼
    SchemaRenderer applies JSON Patch
                    │
                    ▼
    New component added to schema
                    │
                    ▼
    UI updates incrementally (efficient!)
                    │
                    ▼
    User sees new password field
```

### Example 3: User Submits Form

```
User clicks Submit button
                    │
                    ▼
    Button component emits "click" event
                    │
                    ▼
  Form values collected from child components
                    │
                    ▼
    WebSocket: "sendInteraction"
    {
      "conversationId": "...",
      "type": "form_submission",
      "data": { "email": "...", "password": "..." }
    }
                    │
                    ▼
    Backend receives interaction
                    │
                    ▼
    Processes with interaction service
                    │
                    ▼
    Updates conversation state
                    │
                    ▼
    AI provides next response (new schema, message, etc.)
                    │
                    ▼
    Frontend receives ui:schema or message event
                    │
                    ▼
    Renders response
```

## State Management Flow

```
┌────────────────────────────────────────────────┐
│ DynamicUIService Signal State                  │
│                                                │
│ uiState = signal({                             │
│   currentSchema: UISchema | null               │
│   loading: boolean                             │
│   error: string | null                         │
│   schemaHistory: UISchema[]                    │
│ })                                             │
└────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌────────────────────┐
│ Components read  │    │ Services update    │
│ uiState() for:   │    │ via:               │
│ • Current schema │    │ • loadSchema()     │
│ • Loading state  │    │ • applyPatches()   │
│ • Error messages │    │ • clearSchema()    │
└──────────────────┘    └────────────────────┘
```

## Error Handling Strategy

```
┌─ Validation Error
│  ├─ Component not registered
│  ├─ Invalid prop type
│  ├─ Missing required prop
│  └─ Invalid enum value
│
├─ Rendering Error
│  ├─ Component factory not found
│  ├─ Instantiation failed
│  └─ Property binding failed
│
├─ Patch Error
│  ├─ Invalid JSON Pointer path
│  ├─ Target not found
│  └─ Invalid operation for target
│
└─ Network Error
   ├─ WebSocket disconnect
   ├─ Backend timeout
   └─ Schema too large
```

## Component Capability System

```
COMPONENT_LIBRARY
    │
    ├─ input: { 
    │   propsSchema: {
    │     label: { type: 'string' },
    │     type: { enum: ['text', 'email', ...] },
    │     required: { type: 'boolean' },
    │     ...
    │   }
    │ }
    │
    ├─ select: { propsSchema: {...} }
    ├─ checkbox: { propsSchema: {...} }
    ├─ button: { propsSchema: {...} }
    └─ [12 more components]
        │
        ▼
    Used by:
    1. Backend AI Model
       - Context for what components exist
       - Props schema for valid generation
    
    2. Frontend Validation
       - Validate generated schemas
       - Provide error messages
    
    3. Developer Tools
       - Component discovery
       - Schema documentation
```

## Performance Considerations

```
Component Lifecycle:
  1. Schema received (RxJS or signal)
  2. Validation (fast, JSON schema check)
  3. ComponentRegistry lookup (O(1) Map)
  4. ComponentFactory.create() (cached)
  5. Instance injection (Injector)
  6. Props binding (fast, direct assignment)
  7. DOM rendering (Angular CD)

Optimization strategies:
- Patch updates (only changed parts)
- Component factory caching
- Lazy component instantiation
- OnPush change detection strategy (recommended)
- Signal for reactive state (no RxJS overhead)
```

## Testing Strategy

```
Unit Tests:
- ComponentRegistry.register/get/has
- SchemaRenderer.validateSchema()
- SchemaRenderer.applyJsonPatch()
- DynamicUIService.loadSchema()
- DynamicUIService.applyPatchUpdates()

Integration Tests:
- WebSocket → DynamicUIService → Renderer
- Schema validation + rendering
- Patch application flow

E2E Tests:
- User inputs → AI response → UI rendered
- Error handling and recovery
- Form submission → backend interaction
```

## Extension Points

```
1. Custom Components
   registry.register('custom', MyComponent, capability)

2. Custom Validators
   Create validator service implementing ValidationStrategy

3. Custom Formatters
   Extend SchemaRenderer with custom JSON Patch handlers

4. Custom State Management
   Replace Signal with RxJS, Akita, NgRx, etc.

5. AI Model Integration
   Backend configurable with OpenAI, Anthropic, local models

6. Persistence
   Add schema snapshots, A/B testing variants, etc.
```

---

**System Status:** ✅ Ready for AI Integration and Component Rendering
