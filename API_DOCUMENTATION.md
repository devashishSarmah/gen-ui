# API Documentation

## Overview

This document describes the REST API and WebSocket events for the Conversational UI system.

## REST Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-02-04T00:00:00Z"
}
```

#### POST /auth/login
Login user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": { ... }
}
```

### Conversations

#### GET /conversations
List all conversations for current user.

**Query Parameters:**
- `limit` (optional): Max results, default 20
- `offset` (optional): Pagination offset, default 0

**Response (200):**
```json
{
  "conversations": [ ... ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

#### POST /conversations
Create a new conversation.

**Request:**
```json
{
  "title": "Onboarding Flow",
  "description": "Customer onboarding wizard"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Onboarding Flow",
  "userId": "uuid",
  "createdAt": "2026-02-04T00:00:00Z"
}
```

#### GET /conversations/:id
Get conversation details.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Onboarding Flow",
  "messages": [ ... ],
  "createdAt": "2026-02-04T00:00:00Z"
}
```

### Messages

#### POST /conversations/:conversationId/messages
Send message in conversation.

**Request:**
```json
{
  "content": "User input text",
  "type": "user"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "content": "User input text",
  "type": "user",
  "createdAt": "2026-02-04T00:00:00Z"
}
```

#### GET /conversations/:conversationId/messages
Get conversation messages.

**Query Parameters:**
- `limit`: Max results
- `offset`: Pagination offset

**Response (200):**
```json
{
  "messages": [ ... ],
  "total": 50
}
```

### Admin Replay

#### POST /admin/replay/conversations/:conversationId/start
Start replay session.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "totalFrames": 50,
    "currentFrame": { ... }
  }
}
```

#### GET /admin/replay/conversations/:conversationId/session
Get replay session info.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "currentFrameIndex": 5,
    "totalFrames": 50
  }
}
```

#### POST /admin/replay/conversations/:conversationId/next
Navigate to next frame.

**Response (200):**
```json
{
  "success": true,
  "data": { ... frame ... }
}
```

#### POST /admin/replay/conversations/:conversationId/jump-to
Jump to specific frame.

**Query Parameters:**
- `frameIndex`: Target frame index

**Response (200):**
```json
{
  "success": true,
  "data": { ... frame ... }
}
```

### Health Check

#### GET /health
Get system health status.

**Response (200):**
```json
{
  "status": "UP",
  "timestamp": "2026-02-04T00:00:00Z",
  "services": [
    {
      "name": "Redis",
      "status": "UP",
      "responseTime": 5
    }
  ],
  "uptime": 3600000
}
```

## WebSocket Events

### Connection

**Event:** `connect`
Fired when client connects to WebSocket server.

### Disconnection

**Event:** `disconnect`
Fired when client disconnects.

**Payload:**
```json
{
  "reason": "client_namespace_disconnect",
  "description": "User disconnected"
}
```

### Message Events

**Event:** `conversation:message:received`
New message received in conversation.

**Payload:**
```json
{
  "conversationId": "uuid",
  "message": {
    "id": "uuid",
    "content": "Message content",
    "type": "assistant",
    "createdAt": "2026-02-04T00:00:00Z"
  }
}
```

### State Events

**Event:** `state:changed`
Conversation state changed.

**Payload:**
```json
{
  "conversationId": "uuid",
  "state": {
    "currentUiSchema": { ... },
    "uiState": { ... }
  }
}
```

### Error Events

**Event:** `error`
Error occurred.

**Payload:**
```json
{
  "error": "ErrorType",
  "message": "User-friendly error message",
  "retryable": true
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "ErrorType",
  "timestamp": "2026-02-04T00:00:00Z",
  "path": "/api/endpoint",
  "details": { ... additional context ... }
}
```

### Common Error Codes

- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `408 Request Timeout`: Operation timeout
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: External service failure
- `503 Service Unavailable`: Service down for maintenance
- `504 Gateway Timeout`: External service timeout

### Error Types

- `WebSocketConnectionError`: WebSocket connection failed
- `AiProviderError`: AI provider failure (retryable)
- `DatabaseError`: Database operation failed
- `SchemaValidationError`: Invalid schema
- `TimeoutError`: Operation timeout
- `RedisError`: Redis operation failed

## Rate Limiting

Rate limits are enforced per user:

- **Standard**: 100 requests per minute
- **Authenticated**: 1000 requests per minute
- **Admin**: Unlimited

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

Token expires in 24 hours. Use refresh token to obtain new access token.

## Pagination

List endpoints support pagination:

```
GET /endpoint?limit=20&offset=0
```

Default limit: 20, max limit: 100

## Versioning

API version: v1

API endpoints are prefixed with `/api/v1/`

## Support

For API issues, contact support@example.com
