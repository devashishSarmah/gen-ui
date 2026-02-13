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

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "main.js"]
