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
# on CI runners. The --mount=type=cache keeps the npm download cache off the
# layer and speeds up rebuilds.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps && \
    npm run generate:schema && \
    npx nx build backend --configuration=production && \
    # ── Shrink: remove everything the Node.js backend doesn't need ──
    npm prune --omit=dev --legacy-peer-deps && \
    rm -rf .nx /tmp/nx-* && \
    # Remove frontend-only packages that remain in "dependencies"
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
    2>/dev/null; \
    # Remove browser bundles, sourcemaps, docs, and tests
    rm -rf node_modules/typeorm/browser \
      node_modules/rxjs/dist/esm5 node_modules/rxjs/dist/esm \
      node_modules/rxjs/_esm5 node_modules/rxjs/_esm2015 node_modules/rxjs/bundles \
    2>/dev/null; \
    find node_modules -type f \( \
      -name '*.map' -o -name '*.ts' -o -name '*.md' \
      -o -name '*.markdown' -o -name 'LICENSE*' -o -name 'CHANGELOG*' \
      -o -name '.package-lock.json' \
    \) -delete 2>/dev/null; \
    find node_modules -type d \( \
      -name '__tests__' -o -name 'test' -o -name 'tests' \
      -o -name 'docs' -o -name 'doc' -o -name 'example' -o -name 'examples' \
      -o -name '.github' -o -name '.vscode' \
    \) -exec rm -rf {} + 2>/dev/null; \
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
