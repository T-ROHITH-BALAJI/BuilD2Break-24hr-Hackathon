# 🐳 Docker Deployment Guide

This guide covers deploying the Job Portal application using Docker.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- (Optional) Supabase account for cloud database

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Frontend   │───▶│   Backend    │───▶│ Database  │  │
│  │   (Nginx)    │    │  (Node.js)   │    │(PostgreSQL│  │
│  │   Port: 80   │    │  Port: 5000  │    │  or       │  │
│  └──────────────┘    └──────────────┘    │ Supabase) │  │
│                                          └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Local Development (with PostgreSQL container)

```bash
# 1. Clone and navigate
git clone https://github.com/T-ROHITH-BALAJI/BuilD2Break-24hr-Hackathon.git
cd BuilD2Break-24hr-Hackathon

# 2. Setup environment
cp .env.example .env
# Edit .env with your settings

# 3. Start all services
docker-compose up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

### Option 2: Production (with Supabase)

```bash
# 1. Setup environment for Supabase
cp .env.example .env

# 2. Edit .env with Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_DB_HOST=db.your-project.supabase.co
# SUPABASE_DB_PASSWORD=your-password
# DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# 3. Start with Supabase config
docker-compose -f docker-compose.supabase.yml up -d --build
```

## Services

### Frontend (React + Nginx)

- **Port**: 80
- **Build**: Multi-stage (Node for build, Nginx for serve)
- **Features**:
  - Gzip compression
  - Static asset caching
  - API proxy to backend
  - React Router support (SPA)

### Backend (Node.js + Express)

- **Port**: 5000
- **Features**:
  - Health check endpoint
  - JWT authentication
  - PostgreSQL/Supabase connection
  - Rate limiting

### Database (PostgreSQL)

- **Port**: 5432
- **Volume**: Persistent data storage
- **Init**: Auto-runs schema.sql on first start

## Docker Commands Reference

```bash
# Build images
docker-compose build

# Start services (detached)
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Stop services
docker-compose down

# Stop and remove volumes (DELETES DATA)
docker-compose down -v

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec db psql -U postgres -d jobportal

# Check container status
docker-compose ps
```

## Environment Variables

### Required for Local PostgreSQL

```env
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=jobportal
JWT_SECRET=your-secret-key
```

### Required for Supabase

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_HOST=db.xxx.supabase.co
SUPABASE_DB_PASSWORD=your-db-password
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
JWT_SECRET=your-secret-key
```

## Health Checks

Both frontend and backend containers have health checks configured:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' build2break-backend-1
docker inspect --format='{{.State.Health.Status}}' build2break-frontend-1

# Or via docker-compose
docker-compose ps
```

## Scaling (Production)

For production, consider:

1. **Use Supabase** instead of local PostgreSQL
2. **Add reverse proxy** (Traefik/Nginx) for SSL
3. **Use Docker Swarm or Kubernetes** for orchestration

### Example with SSL (using Traefik)

```yaml
# Add to docker-compose.yml
traefik:
  image: traefik:v2.9
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./traefik:/etc/traefik
```

## Troubleshooting

### Database connection failed

```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify connection
docker-compose exec backend node -e "require('./db').query('SELECT 1')"
```

### Frontend not loading

```bash
# Check nginx logs
docker-compose logs frontend

# Verify build
docker-compose exec frontend ls /usr/share/nginx/html
```

### Backend API errors

```bash
# Check backend logs
docker-compose logs -f backend

# Test health endpoint
curl http://localhost:5000/api/health
```

## Cleanup

```bash
# Remove all containers and networks
docker-compose down

# Remove all including volumes (DATABASE DATA WILL BE LOST)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## CI/CD Integration

The GitHub Actions workflow automatically builds and deploys Docker images. See `.github/workflows/build-deploy.yml`.

---

**Happy Deploying! 🚀**
