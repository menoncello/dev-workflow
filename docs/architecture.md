# Decision Architecture

## Executive Summary

Distributed AI development platform using Bun + Elysia + PostgreSQL with real-time agent coordination, MCP adapter pattern for universal tool integration, and Astro + React dashboard interfaces for human oversight of AI-driven development workflows.

## Project Initialization

First implementation story should execute:
```bash
bun create iamgdevvv/elysia-starter dev-plugin
```

This establishes the base architecture with these decisions:
- Bun + Elysia web framework with TypeScript
- PostgreSQL database with Prisma ORM
- JWT authentication system
- Production-ready build scripts and linting

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Runtime | Bun | 1.1+ | All | Native TypeScript performance with Elysia integration |
| Web Framework | Elysia | Latest | All | Optimized for Bun, built-in WebSocket support |
| Database | PostgreSQL + pgvector | 16+ + 0.5+ | 1,3,4 | ACID compliance with vector similarity search |
| Message Queue | Redis with Streams | 7.2+ | 1,2 | Sub-millisecond performance with persistence |
| Authentication | Elysia OAuth + JWT | Latest | 1,2,5 | Enterprise compliance with distributed system support |
| Real-time Comms | WebSocket | Native | 1,2,3 | Bidirectional agent coordination |
| Agent Isolation | Docker Containers | 25.x+ | 1,5 | Strong security boundaries with resource limits |
| Frontend | Astro + React + shadcn/ui | Latest | 1,4,5 | Performance with complex data visualization |
| Orchestration | Docker Compose | v2+ | 1,2,5 | Automated deployment without Kubernetes complexity |
| State Management | Centralized PostgreSQL | 16+ | All | ACID compliance with audit trails |

## Project Structure

```
dev-plugin/
├── docker-compose.yml              # Local development orchestration
├── docker-compose.prod.yml         # Production deployment
├── Dockerfile                      # Multi-stage container build
├── .env.example                    # Environment variables template
├── package.json                    # Dependencies and scripts
├── bun.lockb                       # Bun lock file
├── tsconfig.json                   # TypeScript configuration
├── biome.json                      # Linting and formatting
├── prisma/
│   ├── schema.prisma               # Database schema with pgvector
│   └── migrations/                 # Database migrations
├── src/
│   ├── index.ts                    # Elysia application entry
│   ├── plugins/
│   │   ├── auth.ts                 # OAuth + JWT authentication
│   │   ├── websocket.ts            # WebSocket server setup
│   │   └── database.ts             # Prisma client integration
│   ├── routes/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── agents.ts       # Agent management endpoints
│   │   │       ├── workflows.ts    # Workflow orchestration
│   │   │       ├── tools.ts        # MCP adapter management
│   │   │       └── system.ts       # Monitoring and health
│   │   └── websocket/              # WebSocket event handlers
│   ├── services/
│   │   ├── agent-orchestrator.ts   # Agent lifecycle management
│   │   ├── message-queue.ts        # Redis integration
│   │   ├── state-manager.ts        # Centralized state management
│   │   └── mcp-adapter.ts          # Tool integration framework
│   ├── types/
│   │   ├── agent.ts                # Agent type definitions
│   │   ├── workflow.ts             # Workflow type definitions
│   │   └── mcp.ts                  # MCP protocol types
│   └── utils/
│       ├── logger.ts               # Structured logging
│       ├── errors.ts               # Error handling utilities
│       └── crypto.ts               # Encryption utilities
├── frontend/
│   ├── astro.config.mjs            # Astro configuration
│   ├── src/
│   │   ├── layouts/
│   │   │   └── Main.astro          # Main application layout
│   │   ├── pages/
│   │   │   ├── dashboard.astro     # Main dashboard
│   │   │   ├── agents/
│   │   │   │   └── index.astro     # Agent management
│   │   │   ├── workflows/
│   │   │   │   └── index.astro     # Workflow orchestration
│   │   │   └── admin/
│   │   │       └── index.astro     # System administration
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── agents/
│   │   │   │   ├── AgentCard.tsx   # Agent status display
│   │   │   │   ├── AgentGrid.tsx   # Agent overview grid
│   │   │   │   └── AgentConfig.tsx # Agent configuration
│   │   │   ├── workflows/
│   │   │   │   ├── WorkflowCanvas.tsx # Visual workflow builder
│   │   │   │   └── WorkflowTimeline.tsx # Progress tracking
│   │   │   └── charts/
│   │   │       ├── SystemHealth.tsx # System monitoring
│   │   │       └── AgentMetrics.tsx # Performance visualization
│   │   ├── lib/
│   │   │   ├── websocket.ts        # WebSocket client
│   │   │   ├── api.ts              # API client utilities
│   │   │   └── stores.ts           # State management
│   │   └── styles/
│   │       └── globals.css         # Global styles with Tailwind
├── tests/
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
├── docs/
│   ├── api.md                      # API documentation
│   ├── deployment.md               # Deployment guide
│   └── architecture.md             # This document
└── scripts/
    ├── build.sh                    # Production build
    ├── deploy.sh                   # Deployment script
    └── migrate.sh                  # Database migration
```

## Epic to Architecture Mapping

**Epic 1: Foundation & Agent Architecture** → `src/services/agent-orchestrator.ts`, `src/routes/api/v1/agents.ts`
**Epic 2: Basic Tool Integration & Workflow Foundation** → `src/services/mcp-adapter.ts`, `src/routes/api/v1/tools.ts`
**Epic 3: AI Agent Learning & Optimization** → PostgreSQL pgvector tables, learning algorithms in `src/services/`
**Epic 4: Advanced Analytics & Performance Optimization** → `frontend/src/components/charts/`, metrics collection
**Epic 5: Enterprise Features & Production Hardening** → Docker Compose, security middleware, compliance logging

## Technology Stack Details

### Core Technologies

**Backend Runtime: Bun 1.1+**
- Native TypeScript execution
- Built-in package manager
- Optimized for Elysia framework

**Web Framework: Elysia Latest**
- Type-safe route definitions
- Built-in WebSocket support
- Plugin architecture for extensibility
- Performance optimized for Bun

**Database: PostgreSQL 16+ with pgvector 0.5+**
- ACID compliance for state management
- Vector similarity search for agent learning
- JSON support for flexible schema evolution
- Point-in-time recovery capabilities

**Message Queue: Redis 7.2+ with Streams**
- Sub-millisecond message delivery
- Persistent message storage
- Consumer group support
- Memory-efficient operations

### Integration Points

**WebSocket Communication: Native WebSocket API**
- Bidirectional agent coordination
- Real-time dashboard updates
- Connection management with heartbeat
- Event-driven architecture

**Docker Containerization: Multi-stage builds**
- Agent isolation boundaries
- Resource limit enforcement
- Production deployment consistency
- Development environment reproducibility

**Authentication: Elysia OAuth + JWT Plugin**
- Enterprise SSO integration
- Stateless token-based auth
- Role-based access control
- Secure credential management

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

**API Routes:** `/api/v1/{resource}/{id?}/{action?}` using plural nouns (agents, workflows, tools)
**Database Tables:** `snake_case` with foreign keys `{table}_id` format
**React Components:** `PascalCase` with descriptive names (AgentStatusCard, WorkflowTimeline)
**Files:** Component files `PascalCase.tsx`, utilities `camelCase.ts`

### Code Organization

**Feature-based Structure:** Components grouped by domain (agents/, workflows/, admin/)
**Shared Utilities:** Common code in `/lib/`, `/utils/`, `/hooks/`
**Type Definitions:** Centralized in `/types/` directory
**Tests:** Co-located `*.test.tsx` for components, `__tests__/` for integration

### Error Handling

**Structured Error Format:** `{ error: { code: string, message: string, details?: any } }`
**HTTP Status Codes:** Consistent use of 400, 401, 403, 404, 500, 503
**Frontend Error States:** React patterns with loading and error state management

### Logging Strategy

**Structured JSON Logging:** `{ timestamp, level, message, correlationId, agentId, context }`
**Log Levels:** error, warn, info, debug with appropriate usage
**Correlation IDs:** Request tracking across distributed agent operations

### Communication Patterns

**WebSocket Events:** `camelCase` naming with consistent payload structure
**API Responses:** Standardized success `{ data, meta }` and error `{ error }` formats
**Message Queuing:** Redis Streams with consumer groups for reliability

### Data Architecture

**Database Schema Design:**
```sql
-- Core agent management
agents (id, name, type, status, config, created_at, updated_at)
agent_states (agent_id, state_data, timestamp, version)

-- Workflow orchestration
workflows (id, name, definition, status, created_at, updated_at)
workflow_executions (id, workflow_id, agent_assignments, status, started_at, completed_at)

-- Message communication
messages (id, from_agent_id, to_agent_id, message_type, payload, created_at, delivered_at)

-- Tool integration (MCP adapters)
mcp_adapters (id, name, config, status, last_health_check)
tool_executions (id, adapter_id, tool_name, parameters, result, executed_at)

-- Performance and learning
agent_metrics (id, agent_id, metric_type, value, timestamp)
vector_embeddings (id, content, embedding, metadata, created_at)
```

**Data Flow Architecture:**
1. **Agent State Changes** → PostgreSQL (transactional) → Redis Streams (events) → WebSocket (real-time)
2. **Tool Executions** → MCP Adapter → PostgreSQL (audit) → Redis (notification)
3. **Learning Data** → PostgreSQL (persistent) → pgvector (similarity search)

### API Contracts

**RESTful API Design:**
```
GET    /api/v1/agents              # List agents with filters
POST   /api/v1/agents              # Create new agent
GET    /api/v1/agents/:id          # Get agent details
PUT    /api/v1/agents/:id          # Update agent configuration
DELETE /api/v1/agents/:id          # Decommission agent
POST   /api/v1/agents/:id/start    # Start agent execution
POST   /api/v1/agents/:id/stop     # Stop agent execution

GET    /api/v1/workflows           # List workflows
POST   /api/v1/workflows           # Create workflow
GET    /api/v1/workflows/:id       # Get workflow details
POST   /api/v1/workflows/:id/execute # Execute workflow

GET    /api/v1/tools               # List MCP adapters
POST   /api/v1/tools               # Add new tool integration
GET    /api/v1/tools/:id/health    # Check adapter health
POST   /api/v1/tools/:id/execute   # Execute tool command

WebSocket Events:
- agent.status.update
- workflow.progress.update
- system.health.status
- tool.execution.result
```

### Security Architecture

**Authentication Flow:**
1. User login via OAuth 2.0 (SAML support for enterprise)
2. Backend issues JWT with user roles and permissions
3. WebSocket connections authenticated via JWT token
4. API calls include JWT in Authorization header

**Agent Isolation:**
1. Each agent runs in isolated Docker container
2. Resource limits enforced via Docker cgroups
3. Network communication via Docker networks
4. File system access limited to container scope

**Data Protection:**
1. Database encryption at rest (PostgreSQL TDE)
2. End-to-end encryption for agent communications
3. Secure credential storage with environment variables
4. Audit logging for all system activities

### Performance Considerations

**Response Time Requirements:**
- Agent coordination messages: <2 seconds
- API endpoint responses: <500ms
- WebSocket message delivery: <100ms
- Dashboard UI interactions: <200ms

**Scalability Strategy:**
- Horizontal scaling via Docker containers
- Database connection pooling
- Redis clustering for high availability
- WebSocket connection management

**Caching Strategy:**
- Redis for frequently accessed agent states
- Browser caching for static assets (Astro)
- Database query optimization with proper indexing
- API response caching where appropriate

### Deployment Architecture

**Development Environment:**
```bash
# Start all services
docker-compose up -d

# Initialize database
bun run migrate

# Start development servers
bun run dev  # Backend
cd frontend && bun run dev  # Frontend
```

**Production Deployment:**
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Zero-downtime deployment
# 1. Deploy new version to staging containers
# 2. Run health checks
# 3. Switch load balancer to new version
# 4. Retire old containers
```

**Infrastructure Requirements:**
- Minimum 4GB RAM, 2 CPU cores per agent
- PostgreSQL with 10GB storage (expandable)
- Redis with 2GB RAM (expandable)
- Docker runtime with compose support

### Development Environment

**Prerequisites**
- Bun 1.1+
- Docker & Docker Compose
- PostgreSQL 16+ with pgvector extension
- Redis 7.2+
- Node.js 18+ (for frontend tooling)

**Setup Commands**
```bash
# Clone and initialize
git clone <repository>
cd dev-plugin
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local with database and Redis URLs

# Start development
docker-compose up -d  # PostgreSQL + Redis
bun run migrate      # Database setup
bun run dev         # Backend development
cd frontend && bun run dev  # Frontend development
```

## Architecture Decision Records (ADRs)

**ADR-001: Distributed Agent Architecture Pattern**
Chose WebSocket + Redis for real-time agent coordination over message brokers like RabbitMQ due to performance requirements and simplified operational overhead.

**ADR-002: PostgreSQL with pgvector for State Management**
Selected PostgreSQL with vector extension over specialized vector databases to maintain ACID compliance while supporting semantic search capabilities for agent learning.

**ADR-003: Docker Container Isolation**
Implemented Docker containers for agent isolation rather than process isolation to meet enterprise security requirements and provide consistent deployment boundaries.

**ADR-004: Astro + React Frontend Architecture**
Chose Astro for server-rendered performance with React islands for complex interactive components, optimizing for dashboard loading times while supporting sophisticated data visualization.

**ADR-005: Elysia Authentication Integration**
Leveraged Elysia's native authentication plugin with OAuth 2.0 + JWT to provide enterprise-grade security while maintaining framework consistency.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-10-21_
_For: Eduardo Menoncello_