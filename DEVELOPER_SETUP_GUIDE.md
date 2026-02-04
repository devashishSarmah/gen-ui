# Developer Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 13+ (or use Docker)
- Redis 6+ (or use Docker)
- Git

## Quick Start (< 30 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/devashishsarmah/gen-ui.git
cd gen-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env` files for each service:

**Backend `.env` (apps/backend/.env):**
```bash
# Server
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key-change-in-production

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=gen_ui

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# AI Providers
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
ANTHROPIC_API_KEY=sk-ant-...

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
```

**Frontend `.env` (apps/frontend/.env):**
```bash
API_URL=http://localhost:3000/api
WS_URL=ws://localhost:3000
ENVIRONMENT=development
```

### 4. Start Services with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait for services to be ready
sleep 10
```

### 5. Run Database Migrations

```bash
cd apps/backend
npm run migration:run
cd ../..
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run start:dev
# Server running at http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run start:dev
# App running at http://localhost:4200
```

### 7. Verify Setup

1. Open http://localhost:4200 in browser
2. Check backend health: http://localhost:3000/health
3. Login with test credentials or register new account

## Development Workflow

### Code Organization

```
apps/
├── backend/
│   └── src/
│       ├── app/           # Application setup
│       ├── common/        # Shared utilities
│       │   ├── exceptions/
│       │   ├── filters/
│       │   ├── decorators/
│       │   ├── circuit-breaker/
│       │   ├── ai/
│       │   └── health/
│       ├── entities/      # Database models
│       ├── auth/          # Authentication
│       ├── users/         # User management
│       ├── conversations/ # Conversation logic
│       ├── messages/      # Message handling
│       ├── state/         # State management
│       ├── redis/         # Redis service
│       ├── gateway/       # WebSocket gateway
│       ├── admin/         # Admin features
│       └── scheduler/     # Scheduled tasks
└── frontend/
    └── src/
        └── app/
            ├── auth/      # Authentication pages
            ├── conversation/ # Conversation views
            ├── components/   # Reusable components
            ├── shared/       # Utilities & services
            └── admin/       # Admin interface
```

### Running Tests

```bash
# Backend unit tests
cd apps/backend
npm run test

# Backend test coverage
npm run test:cov

# Frontend unit tests
cd ../frontend
npm run test

# E2E tests
npm run e2e
```

### Debugging

**Backend Debugging:**
```bash
node --inspect-brk=0.0.0.0:9229 dist/main.js
```
Connect Chrome DevTools to chrome://inspect

**Frontend Debugging:**
Browser DevTools (F12) → Sources tab

### Running Specific Services

```bash
# Only start backend
npm run start:backend

# Only start frontend
npm run start:frontend

# Run all services
npm run start

# Run specific test file
cd apps/backend
npm test -- --testPathPattern=circuit-breaker
```

## Common Development Tasks

### Adding a New Feature

1. Create feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Create necessary files (see project structure)

3. Write tests first (TDD):
   ```bash
   npm test -- --watch
   ```

4. Implement feature

5. Run full test suite:
   ```bash
   npm test
   npm run test:cov
   ```

6. Commit with descriptive message:
   ```bash
   git commit -m "feat: add new feature"
   ```

### Adding a Database Migration

```bash
cd apps/backend
npm run migration:create -- -n CreateTableName
```

Edit generated migration file in `src/migrations/`

Run migration:
```bash
npm run migration:run
```

### Creating New Entity

1. Create entity file in `apps/backend/src/entities/`
2. Export from `apps/backend/src/entities/index.ts`
3. Add to TypeOrmModule in relevant module
4. Create migration

### Adding API Endpoint

1. Create controller method
2. Add service method
3. Write tests
4. Document in API_DOCUMENTATION.md
5. Test with Postman or curl

### Styling Components

Use CSS modules or Angular styles with the following conventions:

```typescript
@Component({
  selector: 'app-my-component',
  template: `<div class="container">...</div>`,
  styles: [`
    .container {
      display: flex;
      flex-direction: column;
    }
  `],
})
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 4200
lsof -ti:4200 | xargs kill -9
```

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check credentials in `.env`

3. Reset database:
   ```bash
   docker-compose down -v
   docker-compose up -d
   npm run migration:run
   ```

### Redis Connection Failed

```bash
# Check Redis is running
docker ps | grep redis

# Reset Redis
docker-compose restart redis
```

### Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing

1. Clear test cache:
   ```bash
   npm test -- --clearCache
   ```

2. Check environment variables are set

3. Verify database is clean for tests

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat: description"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
# Get code review
# Merge after approval

# Switch back to main
git checkout main
git pull origin main
```

## Performance Monitoring

### Check Memory Usage

```bash
# Node memory info
node --expose-gc << EOF
require('./dist/main.js');
setTimeout(() => {
  gc();
  console.log(process.memoryUsage());
}, 1000);
EOF
```

### Monitor API Performance

Check browser Network tab in DevTools
- Look for large response sizes
- Check for slow endpoints (>1s)
- Monitor WebSocket messages

## Getting Help

- **Docs**: See `/docs` folder
- **Issues**: Check GitHub issues
- **Slack**: Join development Slack channel
- **Email**: dev-team@example.com

## Next Steps

1. Read API_DOCUMENTATION.md
2. Review COMPONENT_REGISTRY_GUIDE.md for custom components
3. Check AI_PROVIDER_INTEGRATION_GUIDE.md for AI setup
4. See DEPLOYMENT_GUIDE.md for production setup
