# Gen UI — Generative User Interfaces with Multi-Agent AI

> **AI doesn't just answer — it builds the UI.**

Gen UI is an experimental system where LLMs generate fully interactive Angular component trees in real-time, instead of returning plain text or markdown. Describe any interface — a dashboard, portfolio, survey, pricing page — and watch it materialise in seconds.

Inspired by Google Research's [Generative UI](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) paper (Nov 2025), which demonstrated that LLMs can create immersive visual experiences and interactive tools on the fly for any prompt.

<!-- Screenshots / GIF placeholder -->
<!-- ![Gen UI Demo](docs/demo.gif) -->

---

## How It Works

```
User prompt
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│ Ethics Gate   │ ──▶ │ Router Agent │ ──▶ │ Web Search  │ (conditional)
│  (safety)     │     │ (planning)   │     │ (enrichment)│
└──────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                     ┌──────────────┐     ┌─────────────┐
                     │  Summarizer  │ ──▶ │ UX Designer │ (conditional)
                     │(compression) │     │ (structure)  │
                     └──────────────┘     └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ AI Provider  │  ← streams UI schema chunks
                     │ (generation) │
                     └──────┬───────┘
                            │
                     ┌──────▼──────────────────┐
                     │  Validate + Repair Loop  │
                     │  Validator ──valid──▶ ✅  │
                     │     │ invalid             │
                     │  Repair (up to 2 rounds)  │
                     └─────────────────────────┘
                            │
                            ▼
                   Angular component tree
                   rendered in the browser
```

The backend orchestrates **7 specialised agents** in a pipeline. The output is a JSON UI schema that the frontend's dynamic renderer turns into real Angular components — cards, tables, charts, forms, wizards — with zero client-side code generation.

---

## Agent Architecture

| # | Agent | Role |
|---|-------|------|
| 0 | **Ethics Gate** | Safety pre-filter — blocks illegal, unsafe, and prompt-injection requests using pattern matching + optional LLM review |
| 1 | **Router Agent** | Decides generation mode (patch vs replace), model tier (fast / balanced / quality), and whether to activate UX planning or web search |
| 2 | **Web Search** | Enriches prompts with real-time information via OpenAI web search (conditional, keyword-triggered) |
| 3 | **Summarizer** | Compresses conversation history — keeps last 8 messages verbatim, truncates/summarises older context, builds a UI state digest |
| 4 | **UX Designer** | Structural planner — recommends layout, sections, interaction model, density, icon suggestions. Does **not** produce the final schema |
| 5 | **AI Provider** | Streams the UI schema using the resolved provider + model (see supported providers below) |
| 6 | **Validator** | Multi-layer validation: manifest compliance, prop type checks, density heuristics, interaction policy enforcement, icon/emoji rules |
| 7 | **Repair Agent** | Two-pass repair: (1) deterministic sanitiser via manifest (free), (2) LLM-based repair with tier escalation. Up to 2 rounds |
| – | **Copy Agent** | Optional microcopy polisher — compact labels (≤ 3 words) and helper text (≤ 10 words) |

Every agent follows a **deterministic-first** design: fast pattern matching runs before any LLM call, minimising latency and cost.

---

## AI Providers

| Provider | Notes |
|----------|-------|
| **Google Gemini** | Default provider; OpenAI-compatible endpoint |
| **OpenRouter** | Meta-provider — access to Gemini, Claude, GPT, Llama, etc. |
| **OpenAI** | GPT-4o, GPT-4.1 |
| **Anthropic** | Claude 3.5 / 4 via native SDK |
| **Groq** | Llama models; OpenAI-compatible |

**Fallback chain:** `gemini → openrouter → openai → anthropic → groq`

The **LayerLLM** system maps each agent layer (router, summariser, schema, repair, etc.) to a separate provider + model + tier, all configurable via environment variables.

---

## Design System — 34 Components

The frontend ships a manifest-driven design system. The AI generates a JSON schema tree and the renderer instantiates real Angular components:

| Category | Components |
|----------|-----------|
| **Form** | `input` · `select` · `checkbox` · `radio` · `textarea` · `button` |
| **Layout** | `container` · `grid` · `card` · `tabs` · `accordion` · `flexbox` · `split-layout` |
| **Data Display** | `table` · `list` · `listbox` · `basic-chart` · `timeline` · `carousel` · `stats-card` · `progress-ring` · `flow-diagram` · `chart-bar` |
| **Typography** | `heading` · `paragraph` · `divider` |
| **Navigation** | `wizard-stepper` · `menu` · `toolbar` · `stepper` |
| **Feedback** | `badge` · `alert` · `progress-bar` |

All components are responsive (single-column on mobile), theme-aware (dark / light), and support the client-side data engine.

---

## Client-Side Data Engine

Filtering, sorting, and pagination happen **entirely in the browser** — zero backend round-trips after the initial schema arrives.

1. Data components (`table`, `list`) register as sources with an `id`
2. Form controls (`input`, `select`, `checkbox`) target a source via `filterTarget` + `filterField` + `filterOperator`
3. As the user types or selects, the engine filters data instantly using Angular signals
4. Supports operators: `contains`, `equals`, `gt`, `lt`, `gte`, `lte`, `in`

---

## Current Challenges & Open Problems

### Generated UI Event Handling

The biggest open question in generative UI is: **what happens when a user clicks a button?**

In a traditional app, buttons trigger API calls, navigation, or state mutations that the developer has explicitly coded. In a generated UI, buttons exist because the LLM put them there — but the runtime has no way to know what backend action they should trigger.

**Where we are today:**

- **Wired interactions work** — filter clearing, pagination (`nextPage_`, `prevPage_`), tab switching, accordion toggling, wizard step navigation, column sorting, copy-to-clipboard. These are all client-side and the engine handles them automatically.
- **Dead-end buttons are explicitly forbidden** — the AI prompt instructs the model to never create a button that has no real client-side action (e.g. "View Details", "Learn More", "Get Started"). If a CTA can't be wired to a real interaction, it should be omitted or replaced with a badge/paragraph.
- **Cross-component communication** — form controls can target data components for filtering, but there's no general-purpose event bus for arbitrary component-to-component messaging yet.

**What's hard:**

- **Stateful multi-view navigation** — a portfolio site might have a "Projects" tab that navigates to a projects detail view. The AI can generate both views, but wiring per-item navigation (click project card → show project detail) requires a state machine the LLM would need to define.
- **Write operations** — a contact form's "Submit" button implies a backend API call that doesn't exist. The system must either (a) prevent such buttons, (b) generate mock/preview behaviour, or (c) dynamically spin up API endpoints (which opens a massive security surface).
- **Event semantics** — when the LLM generates `{"type": "button", "props": {"label": "Delete"}}`, what should delete? The LLM knows the intent, but that intent isn't captured in the schema in a machine-executable way.

**Possible directions:**

- **Declarative action schemas** — extend the UI schema with an `actions` array that describes intents (`{"action": "navigate", "target": "#section-projects"}`, `{"action": "copy", "value": "..."}`)
- **LLM-in-the-loop interactions** — on button click, send the event back to the LLM and let it respond with a schema patch (already partially supported via the `patch` mode)
- **Sandboxed function generation** — let the LLM emit small JS functions that run in a sandboxed iframe (high complexity, high flexibility)

This is an active area of exploration. Contributions and ideas are very welcome.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 21 (Standalone Components, Signals, CDK Virtual Scroll) |
| **Backend** | NestJS, TypeORM, Bull queues |
| **Database** | PostgreSQL 14+ |
| **Cache** | Redis 6+ |
| **Monorepo** | Nx |
| **Auth** | JWT + OAuth (GitHub, Google) |
| **WebSocket** | Socket.IO (real-time streaming) |
| **Containerisation** | Docker & Docker Compose |

### Resilience Patterns

| Pattern | Purpose |
|---------|---------|
| Circuit Breaker | Prevents cascading failures on AI provider outages |
| Connection Pool | Manages concurrent provider connections |
| Message Batcher | Batches database writes for interaction events |
| Provider Fallback | Streams primary provider; retries with fallback chain on 429/5xx |
| Tier Escalation | Repair starts at `fast` tier, escalates to `quality` if first attempt fails |
| Write-Behind Cache | Hot state in Redis, async write queue to PostgreSQL |
| Manifest-Driven Validation | Single source of truth for schema validation, sanitisation, and prompt generation |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### 1. Clone and Install

```bash
git clone https://github.com/devashishSarmah/gen-ui.git
cd gen-ui
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Secure password for PostgreSQL |
| `REDIS_PASSWORD` | Secure password for Redis |
| `JWT_SECRET` | Signing secret (min 32 chars) |
| `FRONTEND_URL` | Frontend origin (default with proxy: `http://localhost`) |
| `NGINX_HTTP_PORT` / `NGINX_HTTPS_PORT` | Host ports exposed by reverse proxy (defaults: `80` / `443`) |
| At least one AI provider key | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENROUTER_API_KEY` |

Optional OAuth:

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (redirect URI: `<FRONTEND_URL>/auth/google/callback`) |

### 3. Start with Docker

```bash
npm run docker:up        # Start all services
npm run docker:logs      # View logs
npm run docker:down      # Stop
```

| Service | URL |
|---------|-----|
| Frontend (via Nginx) | http://localhost (or https://localhost) |
| Backend API (via Nginx) | http://localhost/api |
| Health check (via Nginx) | http://localhost/api/health |

Note: Docker setup uses an internal reverse proxy (`nginx`) as the only host-exposed service. `backend` and `frontend` are not directly exposed.

### 4. Development Mode

```bash
# Infrastructure only
docker-compose up postgres redis -d

# In separate terminals
npm run start:backend
npm run start:frontend
```

---

## Project Structure

```
gen-ui/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── ai/
│   │       │   ├── agents/          # 7 specialised agents
│   │       │   ├── providers/       # AI provider adapters
│   │       │   ├── tools/           # Web search, etc.
│   │       │   ├── prompts/         # System prompt + renderer schema
│   │       │   ├── agent-orchestrator.service.ts
│   │       │   ├── layer-llm.service.ts
│   │       │   └── model-resolver.service.ts
│   │       ├── auth/                # JWT + OAuth (GitHub, Google)
│   │       ├── gateway/             # WebSocket gateway (Socket.IO)
│   │       ├── state/               # State manager + replay
│   │       ├── common/              # Circuit breaker, pooling, batching
│   │       └── entities/            # TypeORM entities (6 tables)
│   │
│   └── frontend/
│       └── src/app/
│           ├── conversations/       # Chat view, sidebar, welcome screen
│           ├── shared/components/
│           │   └── ui-schema-renderer/  # Dynamic component renderer
│           ├── core/
│           │   ├── services/        # WebSocket, client data engine, interaction
│           │   └── stores/          # Signal-based state (conversations, UI)
│           └── auth/                # Login, register, OAuth callback
│
├── libs/
│   ├── design-system/               # 34 UI components + showcase
│   └── shared/                      # DTOs and interfaces
│
└── docker-compose.yml
```

---

## Development Commands

```bash
# Dev servers
npm run start:backend           # NestJS (port 3000)
npm run start:frontend          # Angular (port 4200)

# Build
npm run build:backend
npm run build:frontend

# Docker
npm run docker:up               # All services
npm run docker:dev              # Dev mode with hot reload
npm run docker:down

# Database
npm run db:migrate              # Run migrations
npm run db:migrate:generate     # Generate migration from entity changes
npm run db:migrate:revert       # Revert last migration
```

---

## Inspiration & References

- [Generative UI: LLMs are Effective UI Generators](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) — Google Research (2025)
- [Generative UI Paper (PDF)](https://generativeui.github.io/static/pdfs/paper.pdf)
- [Generative UI Project Page](https://generativeui.github.io/)

---

## License

MIT

---

**An experimental project by [@devashishSarmah](https://github.com/devashishSarmah)**
