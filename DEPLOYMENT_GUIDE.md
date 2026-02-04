# Deployment Guide

## Production Environment

This guide covers deploying the Conversational UI system to production.

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved
- [ ] Secrets configured securely
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] SSL/TLS certificates obtained
- [ ] Load balancer configured
- [ ] CDN configured for frontend assets

## Environment Setup

### 1. Server Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD storage
- Ubuntu 20.04 LTS

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Ubuntu 22.04 LTS or RHEL 9

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install -y nginx
```

### 3. Create Application User

```bash
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG docker appuser
```

### 4. Clone and Setup Application

```bash
sudo -u appuser git clone https://github.com/devashishsarmah/gen-ui.git /home/appuser/gen-ui
cd /home/appuser/gen-ui
```

### 5. Configure Environment Variables

Create `/home/appuser/gen-ui/apps/backend/.env`:

```bash
# Server
NODE_ENV=production
PORT=3000
INSTANCE_ID=$(hostname)

# JWT
JWT_SECRET=<use secure random string - at least 32 chars>
JWT_EXPIRATION=86400

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=<secure password>
POSTGRES_DB=gen_ui_prod
DB_POOL_SIZE=20
DB_POOL_MAX=30

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<secure password>

# AI Providers
OPENAI_API_KEY=<your openai key>
OPENAI_MODEL=gpt-4
ANTHROPIC_API_KEY=<your anthropic key>

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid api key>
SMTP_FROM=noreply@example.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=<your sentry dsn>
NEW_RELIC_LICENSE_KEY=<your new relic key>

# Security
CORS_ORIGIN=https://example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_ADMIN_PANEL=true
ENABLE_REPLAY=true
ENABLE_ANALYTICS=true
```

Create `/home/appuser/gen-ui/apps/frontend/.env`:

```bash
API_URL=https://api.example.com
WS_URL=wss://api.example.com
ENVIRONMENT=production
GA_ID=<google analytics id>
SENTRY_DSN=<your sentry dsn>
```

## Docker Deployment

### 1. Build Docker Images

```bash
# Build backend image
docker build -f apps/backend/Dockerfile -t gen-ui-backend:latest .

# Build frontend image
docker build -f apps/frontend/Dockerfile -t gen-ui-frontend:latest .

# Tag for registry
docker tag gen-ui-backend:latest registry.example.com/gen-ui-backend:latest
docker tag gen-ui-frontend:latest registry.example.com/gen-ui-frontend:latest

# Push to registry
docker push registry.example.com/gen-ui-backend:latest
docker push registry.example.com/gen-ui-frontend:latest
```

### 2. Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: gen_ui_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db-backup:/backup
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: registry.example.com/gen-ui-backend:latest
    environment:
      NODE_ENV: production
      POSTGRES_HOST: postgres
      REDIS_HOST: redis
      DB_POOL_SIZE: 20
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  frontend:
    image: registry.example.com/gen-ui-frontend:latest
    environment:
      API_URL: https://api.example.com
      WS_URL: wss://api.example.com
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

Start services:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Migrations

```bash
# Run migrations
docker exec gen-ui-backend npm run migration:run

# Verify migrations
docker exec gen-ui-backend npm run migration:show

# Rollback if needed
docker exec gen-ui-backend npm run migration:revert
```

## Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/gen-ui`:

```nginx
upstream backend {
    server localhost:3000;
    keepalive 32;
}

upstream frontend {
    server localhost:80;
}

server {
    listen 80;
    server_name example.com www.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # SSL Certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logging
    access_log /var/log/nginx/gen-ui-access.log;
    error_log /var/log/nginx/gen-ui-error.log;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/gen-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL/TLS Setup

Using Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```

Automatic renewal is enabled by default.

## Monitoring & Logging

### Application Logging

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Export logs
docker-compose -f docker-compose.prod.yml logs backend > logs.txt
```

### Health Checks

```bash
# Check backend health
curl https://api.example.com/health

# Check Redis
redis-cli -h redis ping

# Check PostgreSQL
psql -h postgres -U admin -d gen_ui_prod -c "SELECT 1"
```

### Monitoring Setup

Install monitoring tools:

```bash
# Prometheus for metrics
docker pull prom/prometheus

# Grafana for dashboards
docker pull grafana/grafana

# ELK Stack for logging (optional)
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.0.0
```

## Backup Strategy

### Database Backups

```bash
# Daily automated backup
0 2 * * * /home/appuser/backup-db.sh

# Backup script
#!/bin/bash
BACKUP_DIR="/home/appuser/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +\%Y\%m\%d_\%H\%M\%S)

docker exec gen-ui-postgres pg_dump -U admin gen_ui_prod | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete
```

### Redis Backups

```bash
# Enable RDB persistence in docker-compose
command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

# Backup RDB file
cp docker_redis_data/dump.rdb backups/redis_$(date +\%Y\%m\%d).rdb
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend to 3 replicas
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Use load balancer to distribute traffic
```

### Database Connection Pooling

Already configured in `.env`:
- `DB_POOL_SIZE=20`
- `DB_POOL_MAX=30`

### Redis Clustering

For high availability, use Redis Sentinel or Cluster mode.

## Performance Optimization

### Frontend Asset Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
gzip_min_length 1000;
```

### Database Indexing

Verify important indexes exist:

```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_events_conversation_seq ON interaction_events(conversation_id, event_sequence_number);
```

## Security Hardening

### Firewall Rules

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### Secrets Management

Use environment variables for all secrets. Never commit to git:

```bash
# Use .gitignore
*.env
.env.*
```

Consider using:
- AWS Secrets Manager
- HashiCorp Vault
- 1Password Business

### Database Security

```bash
# Strong passwords
# Change from default credentials
# Enable SSL connections
# Regular security updates
```

## Troubleshooting

### Service Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common issues:
# - Port already in use
# - Database not ready
# - Missing environment variables
```

### Database Connection Issues

```bash
# Test connection
docker exec gen-ui-backend npm run typeorm -- schema:sync

# Check credentials in .env
# Verify PostgreSQL is running
```

### High Memory Usage

```bash
# Check Node process
docker stats gen-ui-backend

# Increase memory limit in docker-compose
# Investigate memory leaks
```

## Deployment Pipeline

### CI/CD with GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -f apps/backend/Dockerfile -t gen-ui-backend:${{ github.sha }} .
          docker build -f apps/frontend/Dockerfile -t gen-ui-frontend:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker push registry.example.com/gen-ui-backend:${{ github.sha }}
          docker push registry.example.com/gen-ui-frontend:${{ github.sha }}
      
      - name: Deploy
        run: |
          ssh -i ${{ secrets.DEPLOY_KEY }} appuser@production.example.com <<'EOF'
            cd /home/appuser/gen-ui
            docker pull registry.example.com/gen-ui-backend:latest
            docker pull registry.example.com/gen-ui-frontend:latest
            docker-compose -f docker-compose.prod.yml up -d
            npm run migration:run
          EOF
```

## Support

For deployment issues:
- Check application logs
- Verify all environment variables
- Check system resources
- Contact deployment team
