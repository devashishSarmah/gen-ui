

# Product Requirements Document

**Product Name:** UI-Native Conversational AI (Angular)
**Doc Type:** PRD v1
**Audience:** Engineering, Product, Platform
**Goal:** Enable AI to respond to user input by generating interactive Angular UI components, persist conversation and UI state, and support follow-up interactions.

---

## 1. Problem Statement

Traditional chatbots reply in text. Many user intents are better served through structured interaction like forms, filters, dashboards, and action buttons.

We need a system where:

* AI replies are **UI components**, not text
* Users interact with the UI
* Interactions become part of the conversation
* The system remains auditable, replayable, and scalable

---

## 2. Product Goals

### Primary Goals

* AI can return dynamic Angular UI components as responses
* Users can interact with AI-generated UI
* Interactions trigger AI follow-ups or UI mutations
* Full conversation and UI state are persisted

### Non-Goals (v1)

* Free-form HTML generation
* Arbitrary DOM execution
* Visual UI builder for end users
* Cross-framework rendering (Angular only)

---

## 3. User Experience Overview

### User Flow

1. User enters a prompt
2. AI responds with a rendered UI
3. User interacts with UI elements
4. System captures interaction events
5. AI updates UI or generates a new UI response
6. Conversation continues

### UX Principles

* UI over text whenever structured input is required
* Minimal re-renders
* Predictable interactions
* Clear affordances and feedback

---

## 4. Functional Requirements

### 4.1 Conversation Model

* Conversations are turn-based
* A turn can be:

  * User text input
  * Assistant UI response
  * Tool or system event

### 4.2 AI UI Response

* AI returns a **UI schema**, not HTML
* Schema describes:

  * Component tree
  * Props
  * Bindings
  * Events
  * Validation
  * Accessibility metadata

### 4.3 UI Rendering (Angular)

* DynamicRendererComponent renders schema
* Component registry maps schema types to Angular components
* No dynamic code execution
* Strict prop validation

### 4.4 User Interaction Handling

* All interactions emit structured events
* Events update UI state
* Events may trigger AI follow-ups

### 4.5 Follow-Up Logic

* AI receives:

  * Last UI schema or snapshot
  * Current UI state
  * Triggering event
  * Conversation context summary
* AI returns:

  * New UI schema, or
  * Patch to existing schema

---

## 5. Data Model Requirements

### 5.1 Message Storage

* Store every conversation turn
* Assistant turns store UI schema as JSON
* User turns store raw input

### 5.2 UI State Storage

* UI state stored separately from schema
* State is versioned
* Never mutate state in place

### 5.3 Interaction Events

* Every UI interaction is logged
* Events are append-only
* Used for replay, audit, analytics

### 5.4 Replayability

* Ability to reconstruct UI at any point
* Deterministic playback from events and snapshots

---

## 6. API Requirements

### Core APIs

* Create conversation
* Post user message
* Receive AI UI response
* Submit UI interaction event
* Fetch conversation state
* Fetch UI snapshot

### Performance

* Interaction to UI update under 300 ms excluding model latency
* UI render under 100 ms for standard schemas

---

## 7. Security & Safety

* Whitelisted component types only
* No executable code in schema
* Strict schema validation
* Server-side authorization for actions
* Event payload size limits

---

## 8. Observability & Analytics

Track:

* Interaction events by component type
* Drop-off points
* Schema render failures
* AI response latency
* UI mutation frequency

---

## 9. Success Metrics

### Product Metrics

* Task completion rate
* Reduction in text back-and-forth
* Average interactions per UI response

### Technical Metrics

* Schema validation error rate
* UI render time
* Event ingestion reliability

---

## 10. Open Questions (Intentionally Deferred)

* Visual layout autonomy for the AI
* Multi-UI responses in a single turn
* Cross-session UI persistence
* Human override or correction of AI UI

---

## 11. Future Extensions

* UI diff streaming
* Multi-agent UI collaboration
* Voice-driven UI interaction
* Adaptive UI personalization
* Offline replay and debugging tools

---

## One-sentence summary

This product treats **UI as the language of conversation**, with AI generating, mutating, and reasoning over Angular components as first-class conversational responses.

Next natural step would be a **technical design doc**, or jumping straight to **Postgres DDL + Angular renderer contract**, depending on whether you want product or code momentum next.
