# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/backend ./apps/backend
COPY libs/shared ./libs/shared
COPY libs/design-system ./libs/design-system

# Regenerate manifest-derived backend prompts from design-system metadata
RUN npm run generate:schema

# Build backend
RUN npx nx build backend --configuration=production

# Drop dev dependencies before producing runtime layers.
# This significantly reduces layer size in CI and avoids disk exhaustion on runners.
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built files and dependencies
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/libs/design-system/src/lib/manifest/dist ./libs/design-system/src/lib/manifest/dist
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
