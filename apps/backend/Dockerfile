# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy source code
COPY apps/backend ./apps/backend
COPY libs/shared ./libs/shared
COPY libs/design-system ./libs/design-system

# Install, build, prune, and clean in a single layer to avoid disk exhaustion
# on CI runners. Intermediate files (full node_modules, nx cache) are never
# persisted to a layer.
RUN npm ci --legacy-peer-deps && \
    npm run generate:schema && \
    npx nx build backend --configuration=production && \
    npm prune --omit=dev --legacy-peer-deps && \
    rm -rf .nx /tmp/nx-* /root/.npm/_cacache && \
    find node_modules -type f \( \
      -name '*.map' -o -name '*.ts' -o -name '*.md' \
      -o -name '*.markdown' -o -name 'LICENSE*' -o -name 'CHANGELOG*' \
      -o -name '*.d.ts.map' -o -name '.package-lock.json' \
      -o -name '*.min.js' -o -name '*.mjs.map' \
    \) -delete 2>/dev/null; \
    find node_modules -type d \( \
      -name '__tests__' -o -name 'test' -o -name 'tests' \
      -o -name 'docs' -o -name 'doc' -o -name 'example' -o -name 'examples' \
      -o -name '.github' -o -name '.vscode' \
    \) -exec rm -rf {} + 2>/dev/null; \
    rm -rf node_modules/typeorm/browser 2>/dev/null; \
    rm -rf node_modules/rxjs/dist/esm5 2>/dev/null; \
    rm -rf node_modules/rxjs/dist/esm 2>/dev/null; \
    rm -rf node_modules/rxjs/_esm5 2>/dev/null; \
    rm -rf node_modules/rxjs/_esm2015 2>/dev/null; \
    rm -rf node_modules/rxjs/bundles 2>/dev/null; \
    true

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built files and dependencies
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/libs/design-system/src/lib/manifest/dist ./libs/design-system/src/lib/manifest/dist
COPY --from=builder /app/apps/backend/src/ai/prompts ./apps/backend/src/ai/prompts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Nx backend bundle issues a top-level require("express").
# After pruning dev deps, express may exist only under @nestjs/platform-express.
# Link it at the top-level so runtime resolution is stable.
RUN if [ ! -e /app/node_modules/express ] && [ -d /app/node_modules/@nestjs/platform-express/node_modules/express ]; then \
      ln -s /app/node_modules/@nestjs/platform-express/node_modules/express /app/node_modules/express; \
    fi

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "main.js"]
