# Gen UI - Conversational AI with Angular Components

A monorepo project that enables AI to respond with interactive Angular UI components instead of text, with full conversation and UI state persistence.

## 🏗️ Architecture

This project is built using:

- **Frontend**: Angular v21 (Standalone Components with Signals)
- **Backend**: NestJS with TypeORM
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Monorepo**: Nx workspace
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm/yarn/pnpm

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd gen-ui
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and update the following:

- `POSTGRES_PASSWORD`: Set a secure password for PostgreSQL
- `REDIS_PASSWORD`: Set a secure password for Redis
- `JWT_SECRET`: Set a secure secret key (minimum 32 characters)

### 3. Start with Docker

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- Backend Health: http://localhost:3000/health

### 4. Development Mode (without Docker)

If you prefer to run services locally:

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up postgres redis -d

# Start backend
npm run start:backend

# In another terminal, start frontend
npm run start:frontend
```

## 📁 Project Structure

```
gen-ui/
├── apps/
│   ├── backend/               # NestJS backend application
│   │   ├── src/
│   │   │   ├── entities/      # TypeORM entities (6 tables)
│   │   │   ├── auth/          # JWT authentication module
│   │   │   ├── users/         # User management module
│   │   │   ├── redis/         # Redis service module
│   │   │   ├── workers/       # Background workers (DB sync)
│   │   │   └── app/           # App module and controllers
│   │   ├── Dockerfile
│   │   └── project.json
│   │
│   └── frontend/              # Angular v21 frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/      # Authentication components
│       │   │   ├── home/      # Home page component
│       │   │   └── ...
│       │   └── environments/
│       ├── Dockerfile
│       ├── nginx.conf
│       └── project.json
│
├── libs/
│   └── shared/                # Shared DTOs and interfaces
│       └── src/lib/
│
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker overrides
├── .env.example               # Environment template
└── README.md
```

## 🗄️ Database Schema

The system uses PostgreSQL with 6 main tables:

1. **users** - User accounts with authentication
2. **conversations** - User conversation sessions
3. **messages** - Individual messages with UI schemas
4. **interaction_events** - User interactions with UI components
5. **state_snapshots** - UI state snapshots for replay
6. **ai_provider_configs** - AI provider configurations

### Write-Behind Pattern

The system implements a write-behind caching pattern:
- Hot state stored in Redis with 24h TTL
- Async write queue for PostgreSQL persistence
- Bull queue processes writes with retry logic

## 🔐 Authentication

JWT-based authentication with:
- User registration endpoint: `POST /auth/register`
- Login endpoint: `POST /auth/login`
- Protected routes use JWT Bearer tokens
- Token expiration configurable via `JWT_EXPIRATION`

## 🛠️ Development Commands

```bash
# Start services
npm run start:backend          # Start NestJS backend
npm run start:frontend         # Start Angular frontend

# Build
npm run build:backend          # Build backend for production
npm run build:frontend         # Build frontend for production

# Testing
npm run test:backend           # Run backend tests
npm run test:frontend          # Run frontend tests

# Linting
npm run lint:backend           # Lint backend code
npm run lint:frontend          # Lint frontend code

# Docker
npm run docker:up              # Start all services
npm run docker:down            # Stop all services
npm run docker:logs            # View logs
npm run docker:dev             # Start in development mode

# Database migrations
npm run db:migrate             # Run migrations
npm run db:migrate:generate    # Generate new migration
npm run db:migrate:revert      # Revert last migration
npm run db:migration:create    # Create empty migration file
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Redis Status

```bash
docker exec -it genui-redis redis-cli -a <password>
PING
```

### Database Connection

```bash
docker exec -it genui-postgres psql -U genui genui_dev
\dt  # List tables
```

## 🔧 Configuration

### Database Migrations

This project uses TypeORM migrations for database schema management:

- **Development**: `synchronize: true` automatically updates schema
- **Production**: Migrations must be run manually

To run migrations in production:

```bash
npm run db:migrate
```

To generate a new migration after entity changes:

```bash
npm run db:migrate:generate apps/backend/src/migrations/MigrationName
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | PostgreSQL host | localhost |
| `POSTGRES_PORT` | PostgreSQL port | 5432 |
| `POSTGRES_USER` | PostgreSQL user | genui |
| `POSTGRES_PASSWORD` | PostgreSQL password | - |
| `POSTGRES_DB` | PostgreSQL database | genui_dev |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT token expiration | 24h |
| `BACKEND_PORT` | Backend server port | 3000 |
| `FRONTEND_PORT` | Frontend server port | 4200 |
| `NODE_ENV` | Environment mode | development |

## 🧪 Testing the Stack

### 1. Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Response includes validation errors if email is invalid or fields are missing.

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 3. Access Protected Route

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your-token>"
```

## 🐛 Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs genui-postgres
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it genui-redis redis-cli -a <password> PING
```

### Backend Issues

```bash
# View backend logs
docker logs genui-backend

# Restart backend
docker restart genui-backend
```

### Port Conflicts

If you get port conflict errors, change the ports in `.env`:

```env
POSTGRES_PORT=5433
REDIS_PORT=6380
BACKEND_PORT=3001
FRONTEND_PORT=4201
```

## 📝 Next Steps

After completing the foundation setup:

1. **Implement Conversation API** - Create endpoints for conversation management
2. **Build UI Schema Renderer** - Create Angular dynamic component renderer
3. **Add AI Integration** - Connect to AI providers (OpenAI, Anthropic, etc.)
4. **Implement State Management** - Build UI state tracking and replay
5. **Add Analytics** - Track interaction events and metrics

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

---

**Built with ❤️ using Nx, Angular 21, NestJS, PostgreSQL, and Redis**
