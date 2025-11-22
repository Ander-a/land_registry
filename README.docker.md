# Docker Setup Guide - Land Registry Application

This guide explains how to run the Land Registry application using Docker on Ubuntu, Windows (WSL2), or macOS.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git (for cloning the repository)

## Quick Start

### 1. Clone and Setup Environment

```bash
# Navigate to project directory
cd land_registry

# Create environment file from template
cp .env.example .env

# Edit .env and update JWT_SECRET
# Generate a secure secret: openssl rand -hex 32
nano .env
```

### 2. Build and Start Services

```bash
# Build and start all services (backend, frontend, MongoDB)
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **MongoDB:** localhost:27017

### 4. Stop Services

```bash
# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove containers + volumes (deletes data)
docker-compose down -v
```

## Service Details

### Backend (FastAPI)
- **Port:** 8000
- **Hot Reload:** Enabled (changes reflect immediately)
- **Uploads:** Persisted in `backend_uploads` volume

### Frontend (React/Vite)
- **Port:** 5173
- **Hot Reload:** Enabled (changes reflect immediately)
- **Node Modules:** Cached in container

### MongoDB
- **Port:** 27017
- **Data:** Persisted in `mongo_data` volume
- **Database:** land_registry_db

## Development Workflow

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart a Service
```bash
docker-compose restart backend
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh
```

### Install New Dependencies

**Backend:**
```bash
# Add package to requirements.txt
echo "new-package==1.0.0" >> backend/requirements.txt

# Rebuild backend
docker-compose up -d --build backend
```

**Frontend:**
```bash
# Execute npm install in container
docker-compose exec frontend npm install new-package

# Or rebuild frontend
docker-compose up -d --build frontend
```

## Troubleshooting

### Issue: OpenCV Import Error
**Solution:** The Dockerfile installs required system dependencies (libgl1-mesa-glx, libglib2.0-0). If you still see errors, rebuild:
```bash
docker-compose build --no-cache backend
```

### Issue: Frontend Not Accessible
**Solution:** Vite must bind to 0.0.0.0. The Dockerfile uses `--host 0.0.0.0` flag.

### Issue: Backend Can't Connect to MongoDB
**Solution:** Use `mongodb://mongodb:27017` (service name), not `localhost`.

### Issue: Port Already in Use
**Solution:** Stop conflicting services or change ports in docker-compose.yml:
```yaml
ports:
  - "8001:8000"  # Change host port
```

### Issue: Permission Denied on WSL2
**Solution:** Ensure Docker Desktop WSL2 integration is enabled and files have correct permissions:
```bash
chmod -R 755 backend/
chmod -R 755 frontend/
```

### Issue: Line Ending Errors (Windows)
**Solution:** The .gitattributes file forces LF endings. If you still have issues:
```bash
# Convert files to LF
dos2unix backend/**/*.py
dos2unix frontend/**/*.js
```

## Data Persistence

### Volumes
- `mongo_data`: MongoDB database files
- `backend_uploads`: User-uploaded claim images

### Backup MongoDB Data
```bash
# Export database
docker-compose exec mongodb mongodump --out=/backup

# Copy from container to host
docker cp land_registry_mongodb:/backup ./mongodb_backup
```

### Restore MongoDB Data
```bash
# Copy backup to container
docker cp ./mongodb_backup land_registry_mongodb:/backup

# Restore database
docker-compose exec mongodb mongorestore /backup
```

## Production Deployment

For production, create a separate `docker-compose.prod.yml`:

1. Remove `--reload` from backend command
2. Use `npm run build` for frontend
3. Add nginx for frontend serving
4. Enable MongoDB authentication
5. Use secrets for environment variables
6. Remove volume mounts (no hot-reload needed)

## Network Architecture

```
┌─────────────────────────────────────────┐
│         land_registry_network           │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Frontend │  │ Backend  │  │ Mongo │ │
│  │  :5173   │←→│  :8000   │←→│ :27017│ │
│  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────┘
        ↓               ↓
   localhost:5173  localhost:8000
```

## Useful Commands

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Clean up everything (nuclear option)
docker-compose down -v --rmi all

# Rebuild specific service
docker-compose build backend

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

## Support

For issues specific to Docker setup, check:
1. Docker logs: `docker-compose logs`
2. Container status: `docker-compose ps`
3. Network connectivity: `docker network inspect land_registry_land_registry_network`
