# Enterprise Playwright AI Automation Platform

A comprehensive, enterprise-grade Playwright automation framework with AI integration, multi-tenancy, and dynamic Git repository management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for ChromaDB)
- Git

### Setup
```bash
# Install dependencies for all packages
npm run setup

# Start development servers (includes ChromaDB)
npm run dev
```

This will start:
- **ChromaDB** (port 8000) - Vector database for chat memory
- **API Gateway** (port 3001) - Backend services
- **Web Dashboard** (port 3000) - Frontend interface

### Manual Setup (if needed)
```bash
# Start ChromaDB separately
npm run chromadb:start

# Start API Gateway
npm run api:dev

# Start Web Dashboard  
npm run web:dev
```

## 🏗️ Architecture

### Monorepo Structure
```
Play/
├── shared/                    # Shared code between layers
│   ├── GitAutomationService.ts
│   └── AITypes.ts
├── ai-layer/                  # AI/LLM integration
├── api-gateway/              # Backend API services
├── web-dashboard/            # Next.js frontend
└── prisma/                   # Database schema
```

### Key Features
- **Multi-tenant AI Chat** with ChromaDB memory
- **Dynamic Git Integration** (local/remote repos)
- **Playwright Test Management** with AI assistance
- **Enterprise Security** & compliance features
- **Real-time WebSocket** communication
- **Analytics & Reporting** dashboard

## 🔧 Development

### Available Scripts
- `npm run dev` - Start all services (ChromaDB + API + Web)
- `npm run chromadb:start` - Start ChromaDB container
- `npm run chromadb:stop` - Stop ChromaDB container
- `npm run api:dev` - Start API Gateway only
- `npm run web:dev` - Start Web Dashboard only

### Environment Variables
Create `.env` files in each package directory:

**api-gateway/.env:**
```env
PORT=3001
WEB_DASHBOARD_URL=http://localhost:3000
CHROMA_URL=http://localhost:8000
DATABASE_URL="postgresql://..."
```

**web-dashboard/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 Services

### ChromaDB Integration
- **Purpose**: Vector database for chat memory and context
- **Port**: 8000
- **Features**: 
  - User/repo-specific chat history
  - Semantic search for context
  - Persistent conversation memory

### API Gateway
- **Port**: 3001
- **Features**:
  - AI chat processing
  - Git repository management
  - Test execution
  - Analytics & reporting

### Web Dashboard
- **Port**: 3000
- **Features**:
  - Modern React/Next.js UI
  - Real-time chat interface
  - Test management dashboard
  - Analytics visualization

## 🤖 AI Features

### Chat Commands
- `count tests` - Count test files and scenarios
- `analyze framework` - Analyze test framework structure
- `run login feature` - Execute specific test features
- `ai workflow` - Start AI-powered automation workflow

### Git Automation
- Create feature branches
- Generate and commit code
- Push to remote repositories
- Automated PR creation

## 🔒 Security & Compliance

- Multi-tenant isolation
- Audit logging
- Data encryption
- Access control
- GDPR compliance features

## 📈 Analytics

- Test execution metrics
- Performance monitoring
- Coverage analysis
- Trend reporting

---

**Built with ❤️ for enterprise automation** 