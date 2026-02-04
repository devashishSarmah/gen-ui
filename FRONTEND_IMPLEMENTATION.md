# Frontend Core Implementation

## Overview

This implementation provides the Angular v21 frontend with WebSocket connectivity, reactive state management using Signals, and a complete conversation UI.

## Features Implemented

### 1. **WebSocket Client Service** (`websocket.service.ts`)
- Socket.IO client with JWT authentication via handshake
- Auto-reconnection with exponential backoff (max 10 attempts)
- Connection status tracking via Signals
- Event streaming for UI schema chunks
- Methods for:
  - `connect()` - Connect to WebSocket with JWT
  - `sendPrompt()` - Send user prompt for UI generation
  - `sendInteraction()` - Send interaction events with optional prompt
  - `joinConversation()` - Join a conversation room
  - `getConversationState()` - Retrieve current conversation state

### 2. **Signal-Based State Stores**

#### ConversationStore (`conversation.store.ts`)
- Reactive state for conversations and messages
- Signals:
  - `conversations` - List of user conversations
  - `currentConversationId` - Currently active conversation
  - `messages` - Messages in current conversation
  - `isLoadingConversations` - Loading state for list
  - `isLoadingMessages` - Loading state for messages
  - `error` - Error messages
- Computed signals:
  - `currentConversation` - Derives current conversation from ID

#### UIStateStore (`ui.store.ts`)
- Manages UI schema streaming and rendering state
- Signals:
  - `currentSchema` - Completed UI schema
  - `streamingChunks` - Partial chunks during streaming
  - `isStreaming` - Streaming in progress
  - `completionPercentage` - Progress indicator
  - `error` - Error during streaming
- Methods:
  - `startStreaming()` - Initialize streaming
  - `addStreamingChunk()` - Add partial chunk
  - `completeStreaming()` - Mark completion
  - `setStreamingError()` - Handle errors

### 3. **Authentication**
- Auth Guard (`auth.guard.ts`) - Protects conversation routes
- Token-based authentication with JWT
- Automatic token injection via HTTP interceptor
- Login/Register flow with persistent auth state

### 4. **Components**

#### SkeletonLoaderComponent
- Reusable skeleton with blur effect animation
- Types: text, paragraph, card, button, form, list, custom
- Smooth shimmer animation during data loading
- Responsive blur pulse effect

#### ConversationLayoutComponent
- Two-pane layout: sidebar for list, main for chat
- Responsive design (stacks on mobile)
- Named outlet routing for flexible layout

#### ConversationListComponent
- Display user's conversations
- Create new conversation
- Load conversations with skeleton loading state
- Click to navigate to conversation detail

#### ConversationViewComponent
- Main chat interface with:
  - Message display (user and assistant)
  - Real-time WebSocket streaming UI updates
  - Skeleton loader during AI generation
  - Message input with send button
  - Connection status indicator
  - Auto-scroll to latest message
- Handles:
  - Joining conversation room
  - Sending prompts
  - Receiving UI schema chunks
  - Progressive rendering as chunks arrive

### 5. **Routing** (`app.routes.ts`)
```
/conversations              - Layout with sidebar
  /                        - Conversation list (named outlet 'list')
  /:id                     - Conversation view
/login                     - Login page
/register                  - Register page
```

Routes are protected with `authGuard` to ensure authentication.

### 6. **API Service** (`conversation-api.service.ts`)
- Centralized API calls to backend
- Methods for:
  - `getConversations()` - Fetch user's conversations
  - `getConversation(id)` - Get single conversation
  - `createConversation()` - Create new conversation
  - `getMessages()` - Fetch conversation messages
  - `sendMessage()` - Send user message

## Architecture

### Data Flow
1. **User Authentication**
   - Login → Store JWT token → Auth Guard validates routes
   
2. **Conversation List**
   - Load → ConversationApiService → ConversationStore → Display

3. **WebSocket Connection**
   - Join Conversation → WebSocketService.connect() → Join room

4. **Prompt Submission**
   - User Input → WebSocketService.sendPrompt() → Backend processes
   - Backend streams UI chunks → WebSocketService emits → UIStateStore updates
   - UI renders progressively as chunks arrive

5. **UI Schema Rendering**
   - Skeleton shown during streaming
   - Chunks added to store with progress %
   - Final schema persisted when complete

### State Management
- **Signals** for reactive state (Angular 21 native)
- **Computed signals** for derived state
- **Services** for API calls and WebSocket management
- **Stores** (Injectable) for centralized state

## WebSocket Events

### Client → Server
- `join-conversation` - Join conversation room
- `prompt` - Send new prompt for UI generation
- `interaction` - Send interaction event with optional follow-up
- `get-state` - Retrieve conversation state

### Server → Client
- `connected` - Connection acknowledged
- `ui-stream` - Streaming chunk (type: partial|complete|error)
- Automatic reconnection handling

## Styling

- **Material Design** inspired colors and spacing
- **Responsive** layout (desktop and mobile)
- **Loading States** with skeleton components
- **Animations**:
  - Message fade-in
  - Status indicator pulse
  - Skeleton shimmer and blur

## Dependencies

- Angular 21 with standalone components
- RxJS for async operations
- Socket.IO Client 4.6.0 for WebSocket
- TypeORM types for entity definitions
- Shared DTOs from `@gen-ui/shared` library

## Usage

### Basic Flow
```typescript
// 1. User logs in (AuthService)
// 2. Navigate to /conversations
// 3. ConversationListComponent loads conversations
// 4. Click conversation → ConversationViewComponent
// 5. WebSocketService connects automatically
// 6. Type message and send
// 7. UIStateStore manages streaming UI updates
// 8. SkeletonLoader shows during generation
// 9. Final schema displayed when complete
```

### Environment Setup
```typescript
// apps/frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',  // Backend API
};
```

## Next Steps

- Dynamic UI component rendering (separate ticket)
- Conversation list/timeline UI enhancements
- Static component library implementation
- Error recovery and retry logic
- Offline support with service workers
- Performance optimizations (virtual scrolling, lazy loading)
