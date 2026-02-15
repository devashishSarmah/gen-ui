# ─────────────────────────────────────────
# Stage 1: BUILD — full install, generate schema, compile
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY nx.json tsconfig.base.json ./

COPY apps/backend ./apps/backend
COPY libs/shared ./libs/shared
COPY libs/design-system ./libs/design-system

RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps && \
    npm run generate:schema && \
    npx nx build backend --configuration=production

# ─────────────────────────────────────────
# Stage 2: DEPS — clean production-only install
# Avoids the huge "prune from full install" approach that was exhausting disk.
# ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --legacy-peer-deps --ignore-scripts && \
    # Strip heavy files the Node.js runtime doesn't need
    find node_modules -type f \( \
      -name '*.map' -o -name '*.ts' -o -name '*.md' \
      -o -name '*.markdown' -o -name 'LICENSE*' -o -name 'CHANGELOG*' \
      -o -name '.package-lock.json' \
    \) -delete 2>/dev/null; \
    find node_modules -type d \( \
      -name '__tests__' -o -name 'test' -o -name 'tests' \
      -o -name 'docs' -o -name 'doc' -o -name 'example' -o -name 'examples' \
      -o -name '.github' -o -name '.vscode' -o -name 'browser' \
    \) -exec rm -rf {} + 2>/dev/null; \
    rm -rf \
      node_modules/typeorm/browser \
      node_modules/rxjs/dist/esm5 node_modules/rxjs/dist/esm \
      node_modules/rxjs/_esm5 node_modules/rxjs/_esm2015 node_modules/rxjs/bundles \
    2>/dev/null; \
    true

# ─────────────────────────────────────────
# Stage 3: PRODUCTION — minimal runtime image
# ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Built application
COPY --from=builder /app/dist/apps/backend ./
# Generated manifest & prompt files
COPY --from=builder /app/libs/design-system/src/lib/manifest/dist ./libs/design-system/src/lib/manifest/dist
COPY --from=builder /app/apps/backend/src/ai/prompts ./apps/backend/src/ai/prompts
# Production-only node_modules (from the clean deps stage)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Ensure express is resolvable at the top level
RUN if [ ! -e /app/node_modules/express ] && [ -d /app/node_modules/@nestjs/platform-express/node_modules/express ]; then \
      ln -s /app/node_modules/@nestjs/platform-express/node_modules/express /app/node_modules/express; \
    fi

EXPOSE 3000

CMD ["node", "main.js"]
