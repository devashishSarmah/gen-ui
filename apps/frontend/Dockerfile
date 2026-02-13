# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY .postcssrc.json ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/frontend ./apps/frontend
COPY libs/shared ./libs/shared
COPY libs/design-system ./libs/design-system

# Build frontend
RUN npx nx build frontend --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install envsubst for runtime env.js generation
RUN apk add --no-cache gettext

# Copy built files
COPY --from=builder /app/dist/apps/frontend/browser /usr/share/nginx/html

# Copy runtime env template and entrypoint script
COPY apps/frontend/env.template.js /usr/share/nginx/html/env.template.js
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
