# ─────────────────────────────────────────
# Stage 1: BUILD + PROD DEPS
# Everything happens in a single RUN so that the huge dev node_modules
# is never committed as a Docker layer — only the final state (dist +
# production deps) is written, which halves the disk needed on CI.
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

# Build tools needed for native addons (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY nx.json tsconfig.base.json ./

COPY apps/backend ./apps/backend
COPY libs/shared ./libs/shared
COPY libs/design-system ./libs/design-system

RUN --mount=type=cache,target=/root/.npm \
    # ── 1. Full install (dev + prod) ────────────────────────────
    npm ci --legacy-peer-deps && \
    # ── 2. Generate manifest/schema ─────────────────────────────
    npm run generate:schema && \
    # ── 3. Build backend ────────────────────────────────────────
    npx nx build backend --configuration=production && \
    # ── 4. Nuke everything the runtime doesn't need ─────────────
    rm -rf node_modules .nx /tmp/nx-* && \
    # ── 5. Fresh production-only install ────────────────────────
    npm ci --omit=dev --legacy-peer-deps --ignore-scripts && \
    # ── 5a. Rebuild native addons (bcrypt needs compiled .node binary) ──
    npm rebuild bcrypt --build-from-source && \
    # ── 5b. Remove frontend/tooling packages accidentally kept in deps ──
    rm -rf \
      node_modules/@angular \
      node_modules/@angular-devkit \
      node_modules/@angular-eslint \
      node_modules/zone.js \
      node_modules/lucide-angular \
      node_modules/@nx \
      node_modules/nx \
      node_modules/typescript \
      node_modules/postcss \
      node_modules/tailwindcss \
      node_modules/@tailwindcss \
      node_modules/esbuild \
      node_modules/@esbuild \
      node_modules/webpack \
      node_modules/webpack-dev-server \
      node_modules/@swc \
    2>/dev/null; \
    # ── 6. Strip unnecessary files from prod deps ───────────────
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
# Stage 2: PRODUCTION — minimal runtime image
# ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/libs/design-system/src/lib/manifest/dist ./libs/design-system/src/lib/manifest/dist
COPY --from=builder /app/apps/backend/src/ai/prompts ./apps/backend/src/ai/prompts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

RUN if [ ! -e /app/node_modules/express ] && [ -d /app/node_modules/@nestjs/platform-express/node_modules/express ]; then \
      ln -s /app/node_modules/@nestjs/platform-express/node_modules/express /app/node_modules/express; \
    fi

EXPOSE 3000

CMD ["node", "--max-old-space-size=512", "main.js"]
