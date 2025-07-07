# Setup Guide - Enterprise Playwright AI Platform

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

## Quick Setup

### 1. Install Dependencies
```bash
# Install all dependencies for the monorepo
npm run setup
```

### 2. Start Development Environment
```bash
# Start all services (ChromaDB + API + Web Dashboard)
npm run dev
```

This single command will:
- Start ChromaDB container (port 8000)
- Wait for ChromaDB to be ready
- Start API Gateway (port 3001)
- Start Web Dashboard (port 3000)

## Manual Setup (Alternative)

If you prefer to start services individually:

### 1. Start ChromaDB
```bash
# Start ChromaDB container
npm run chromadb:start

# Verify ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat
```

### 2. Start API Gateway
```bash
# Start the backend API
npm run api:dev
```

### 3. Start Web Dashboard
```bash
# Start the frontend
npm run web:dev
```

## Environment Configuration

### API Gateway (.env)
Create `api-gateway/.env`:
```env
PORT=3001
WEB_DASHBOARD_URL=http://localhost:3000
CHROMA_URL=http://localhost:8000
DATABASE_URL="postgresql://username:password@localhost:5432/playwright_ai"
```

### Web Dashboard (.env.local)
Create `web-dashboard/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| **ChromaDB** | 8000 | Vector database for chat memory |
| **API Gateway** | 3001 | Backend services & AI processing |
| **Web Dashboard** | 3000 | Frontend interface |

## ChromaDB Integration

ChromaDB provides:
- **Chat Memory**: Persistent conversation history
- **Semantic Search**: Context-aware chat responses
- **Vector Storage**: Efficient similarity search

### ChromaDB Management
```bash
# Start ChromaDB
npm run chromadb:start

# Stop ChromaDB
npm run chromadb:stop

# Check status
curl http://localhost:8000/api/v1/heartbeat
```

## Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Access Services
- **Web Dashboard**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **ChromaDB**: http://localhost:8000

### 3. Link Repository
1. Open http://localhost:3000
2. Go to "Git Integration" page
3. Link your local or remote Playwright repository

### 4. Start Chatting
1. Navigate to "AI Chat" page
2. Ask questions about your tests
3. Use commands like "count tests" or "analyze framework"

## Troubleshooting

### ChromaDB Connection Issues
```bash
# Check if ChromaDB is running
docker ps | grep chromadb

# Restart ChromaDB
npm run chromadb:stop
npm run chromadb:start

# Check logs
docker logs chromadb
```

### Port Conflicts
If ports are already in use:
```bash
# Find processes using ports
lsof -i :8000  # ChromaDB
lsof -i :3001  # API Gateway
lsof -i :3000  # Web Dashboard

# Kill processes if needed
kill -9 <PID>
```

### Docker Issues
```bash
# Ensure Docker is running
docker --version

# Check Docker daemon
docker info

# Restart Docker Desktop if needed
```

## Production Setup

For production deployment:

1. **Database**: Use managed PostgreSQL service
2. **ChromaDB**: Use managed vector database or self-hosted
3. **Environment**: Set production environment variables
4. **Security**: Configure proper authentication and authorization

## Support

- **Documentation**: Check README.md for detailed feature information
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions 