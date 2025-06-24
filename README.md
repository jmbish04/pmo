# ClickUp Planner Worker

A Cloudflare Workers-based system for intelligent task management and orchestration with ClickUp integration, featuring an AI-enriched, multi-agent planner system.

## 🚀 Features

### Core Functionality
- **ClickUp Integration**: Webhook handling, API synchronization, and bidirectional data flow
- **AI-Powered Task Enrichment**: Automatic task description generation, unit test creation, and metadata enhancement
- **Intelligent Orchestration**: Multi-agent system for task processing and project management
- **Documentation System**: Dynamic documentation delivery with R2 storage
- **Scheduled Sync**: Automated hourly and periodic synchronization with ClickUp
- **AI Writer System**: Background agent collaboration through .agent.md files in R2

### AI-Enriched Multi-Agent System
- **Orchestrator**: Central routing and flow management
- **AgentManager**: Multi-agent coordination and flow execution
- **SyncAgent**: ClickUp synchronization and data staging
- **ReviewAgent**: Task review, enrichment, and promotion
- **EnrichmentAgent**: AI-powered task enhancement
- **ProjectAgent**: Project creation and template management
- **AuditAgent**: Quality assurance and validation
- **GuardrailsAgent**: Safety checks and compliance
- **AI Writer**: Background task assignment and collaboration system

### New Features (Sprint Implementation)
- **Webhook Handler**: Real-time ClickUp event processing and storage
- **Sync Agent**: Comprehensive ClickUp-to-D1 synchronization
- **Hourly Cron Jobs**: Automated task synchronization every hour
- **Review Staged Tasks**: AI-powered task review and promotion workflow
- **Extended Database Schema**: Complete D1 schema for webhooks, sync logs, and agent status

## 🏗️ Architecture

### Multi-Agent Orchestration System
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Orchestrator  │    │  AgentManager    │    │   Individual    │
│   (Routing)     │◄──►│  (Coordination)  │◄──►│   Agents        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   D1 Database   │    │   ClickUp API    │    │   AI Services   │
│   (Storage)     │    │   (Integration)  │    │   (Enrichment)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Agent Flow System
- **Flow Definition**: Predefined sequences of agent operations
- **Context Passing**: Rich context with metadata and previous results
- **Error Handling**: Graceful failure recovery and logging
- **Health Monitoring**: Real-time agent and flow status tracking

## 📋 API Endpoints

### Orchestration Routes
- `POST /orchestrate/sync` - Trigger synchronization
- `POST /orchestrate/new-project` - Create new project
- `POST /orchestrate/review-staged-tasks` - Review and promote staged tasks
- `POST /orchestrate/enrich-task` - Enrich specific task with AI
- `POST /orchestrate/webhook` - Process webhook events
- `POST /orchestrate/assign-agent-task` - Create AI agent task files in R2

### Task Management
- `POST /tasks/new` - Create new tasks and stage them for processing

### ClickUp Integration
- `POST /webhook/clickup` - Handle ClickUp webhook events
- `POST /sync` - Manual synchronization trigger

### Documentation
- `GET /api/docs/:section` - Retrieve documentation by section
- `POST /api/docs/assign-agent` - Queue AI bot assignment for documentation

### Coder API
- `POST /api/coder/start-task` - Mark a task as started by a coder
- `POST /api/coder/complete-task` - Mark a task as completed
- `POST /api/coder/report-error` - Report an error during task execution
- `GET /api/next-task?coderType=codex&projectId=optional` - Fetch the next available task
- `POST /api/v1/ingest` - Record usage data from coders


### Seeding
- `POST /api/seed-tasks` - Seed tasks from CSV or JSON payload

## 🤖 Agent System

### Available Agents

#### Orchestrator
- **Purpose**: Central routing and request handling
- **Responsibilities**: Route requests, manage flow IDs, log operations
- **Methods**: `handleRequest()`, `enrichTask()`, `generateFlowId()`

#### AgentManager
- **Purpose**: Multi-agent coordination and flow execution
- **Responsibilities**: Execute flows, manage agent lifecycle, health checks
- **Methods**: `executeFlow()`, `healthCheck()`, `handleNewProject()`

#### SyncAgent
- **Purpose**: ClickUp synchronization and data staging
- **Responsibilities**: Fetch projects/tasks, stage data, handle deduplication
- **Methods**: `syncAllProjects()`, `syncProjectById()`, `stageTask()`

#### ReviewAgent
- **Purpose**: Task review, enrichment, and promotion
- **Responsibilities**: Review staged tasks, enrich with AI, promote to final tables
- **Methods**: `reviewStagedTasks()`, `enrichTask()`, `promoteTask()`

#### EnrichmentAgent
- **Purpose**: AI-powered task enhancement
- **Responsibilities**: Generate descriptions, unit tests, effort estimates
- **Methods**: `enrichTask()`, `generateUnitTests()`, `estimateEffort()`

#### ProjectAgent
- **Purpose**: Project creation and template management
- **Responsibilities**: Create projects, generate templates, manage project lifecycle
- **Methods**: `createProject()`, `generateTemplate()`, `updateProject()`

#### AuditAgent
- **Purpose**: Quality assurance and validation
- **Responsibilities**: Validate tasks, audit operations, ensure compliance
- **Methods**: `validateTask()`, `auditOperation()`, `checkCompliance()`

#### GuardrailsAgent
- **Purpose**: Safety checks and compliance
- **Responsibilities**: Enforce policies, check permissions, prevent errors
- **Methods**: `checkPermissions()`, `validatePolicy()`, `enforceGuardrails()`

#### AI Writer
- **Purpose**: Background agent collaboration and task assignment
- **Responsibilities**: Create .agent.md files, manage task assignments, enable agent collaboration
- **Methods**: `writeAgentFile()`, `readAgentFile()`, `updateAgentFile()`, `listAgentFiles()`

### Orchestration Flows

#### `sync` Flow
```typescript
[
  { agent: 'sync', step: 'syncAllProjects' }
]
```

#### `reviewStagedTasks` Flow
```typescript
[
  { agent: 'review', step: 'reviewStagedTasks' }
]
```

#### `enrichTask` Flow
```typescript
[
  { agent: 'enrichment', step: 'enrichTask' }
]
```

#### `newProject` Flow
```typescript
[
  { agent: 'template', step: 'createProjectTemplate' },
  { agent: 'ai', step: 'generateProjectStructure' },
  { agent: 'guardrails', step: 'validateProject' },
  { agent: 'audit', step: 'auditProjectCreation' }
]
```

#### Webhook Flows
```typescript
// Task Created
[
  { agent: 'sync', step: 'syncProjectById' },
  { agent: 'enrichment', step: 'enrichTask' }
]

// Task Updated
[
  { agent: 'sync', step: 'syncProjectById' },
  { agent: 'enrichment', step: 'reEnrichTask' }
]

// Project Created
[
  { agent: 'sync', step: 'syncProjectById' }
]
```

## 🗄️ Database Schema

### Core Tables
- `task_staging` - Temporary task storage before processing
- `webhook_events` - ClickUp webhook event storage
- `sync_log` - Synchronization operation tracking
- `agent_status` - Orchestration flow state management
- `projects` - ClickUp project information
- `staging_tasks` - Tasks being processed before promotion
- `project_tasks` - Final destination for processed tasks

### Key Features
- **Event Tracking**: Complete webhook event history
- **Sync Monitoring**: Detailed sync operation logs
- **Flow State Management**: Real-time orchestration status
- **Task Lifecycle**: From staging to final promotion

## 🔧 Setup

### Prerequisites
- Node.js 18+
- Wrangler CLI
- ClickUp API access
- Cloudflare account with D1 and R2

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository>
cd wehbook-your-free-hooker
pnpm install
```

2. **Configure environment variables**:
```bash
# Update wrangler.toml with your values
CLICKUP_TOKEN = "your_clickup_token"
CLICKUP_TEAM_ID = "your_team_id"
```

3. **Set up D1 database**:
```bash
# Create D1 database
wrangler d1 create planner

# Create staging and production databases
wrangler d1 create pmo-hq-staging
wrangler d1 create pmo-hq

# Apply migrations
wrangler d1 execute planner --file=./migrations/001_init.sql
wrangler d1 execute planner --file=./migrations/002_extend_schema.sql
wrangler d1 execute planner --file=./migrations/003_ingest.sql
```

4. **Deploy to Cloudflare**:
```bash
wrangler deploy
```

### Secrets
Set sensitive values with Wrangler:
```bash
wrangler secret put CLICKUP_TOKEN
wrangler secret put CLICKUP_TEAM_ID
```

## 🧪 Testing

### Orchestration System Testing
```bash
# Comprehensive orchestration tests
node test-orchestration.js

# Specific flow tests
node test-orchestration.js sync
node test-orchestration.js newProject
node test-orchestration.js reviewStagedTasks
node test-orchestration.js enrichTask
node test-orchestration.js webhook
node test-orchestration.js errors
node test-orchestration.js performance
```

### Webhook Testing
```bash
# Test all webhook types
node test-webhook.js

# Test specific webhook
node test-webhook.js "Task Created"
```

### Review Staged Tasks Testing
```bash
# Comprehensive testing
node test-review-staged-tasks.js

# Specific test types
node test-review-staged-tasks.js basic
node test-review-staged-tasks.js configs
node test-review-staged-tasks.js performance
```

### Task Enrichment Testing
```bash
# Test task enrichment
node test-enrich-task.js
```

## 🔄 Cron Jobs

The system includes automated cron jobs:

- **Hourly Sync** (`0 * * * *`): Syncs all ClickUp projects and tasks
- **Periodic Sync** (`0 */6 * * *`): Comprehensive sync every 6 hours

### Manual Triggers
```bash
# Trigger hourly sync
curl -X POST https://your-worker.your-subdomain.workers.dev/sync

# Trigger review of staged tasks
curl -X POST https://your-worker.your-subdomain.workers.dev/orchestrate/review-staged-tasks \
  -H "Content-Type: application/json" \
  -d '{"config": {"enrichMissingData": true, "validateBeforePromotion": true}}'

# Trigger task enrichment
curl -X POST https://your-worker.your-subdomain.workers.dev/orchestrate/enrich-task \
  -H "Content-Type: application/json" \
  -d '{"data": {"taskId": "task_123"}, "config": {"generateUnitTests": true}}'
```

## 📊 Monitoring

### Agent Status
Monitor orchestration flows:
```sql
SELECT * FROM agent_status WHERE state = 'running';
```

### Sync Logs
Monitor synchronization operations:
```sql
SELECT * FROM sync_log ORDER BY timestamp DESC LIMIT 10;
```

### Webhook Events
Track ClickUp webhook activity:
```sql
SELECT event_type, COUNT(*) FROM webhook_events 
GROUP BY event_type ORDER BY COUNT(*) DESC;
```

### Flow Performance
Monitor flow execution times:
```sql
SELECT flowName, AVG(processingTime) as avgTime, COUNT(*) as executions
FROM agent_status 
WHERE state = 'completed' 
GROUP BY flowName;
```

## 🔐 Security

- **Webhook Validation**: Secure ClickUp webhook processing
- **Environment Variables**: Secure configuration management
- **Error Handling**: Comprehensive error logging and recovery
- **Rate Limiting**: Built-in request throttling
- **Agent Isolation**: Secure agent execution with context boundaries

## 🚀 Deployment

### Development
```bash
wrangler dev
```

### Staging
```bash
wrangler deploy --env staging
```

### Production
```bash
wrangler deploy --env production
```

### Continuous Deployment
This project includes a GitHub Actions workflow that automatically deploys to Cloudflare Workers when changes land on the `main` branch. The workflow runs migrations and `pnpm build` before calling `wrangler deploy`.

## 📈 Performance

- **Batch Processing**: Efficient task processing in batches
- **Caching**: Intelligent caching for API responses
- **Async Operations**: Non-blocking webhook processing
- **Error Recovery**: Graceful error handling and retry logic
- **Flow Optimization**: Parallel agent execution where possible

## 🔧 Configuration

### Environment Variables
- `CLICKUP_TOKEN`: ClickUp API access token (**set as a secret**)
- `CLICKUP_TEAM_ID`: ClickUp team identifier (**set as a secret**)
- `ENVIRONMENT`: Deployment environment (development/staging/production)

### Worker Bindings
- `DB`: D1 database for data storage
- `DOCS_BUCKET`: R2 bucket for documentation
- `AI`: Workers AI binding
- `AI_GATEWAY_URL`: URL for the AI Gateway

## 📝 Development

### Project Structure
```
src/
├── orchestrate/          # Multi-agent orchestration system
│   ├── Orchestrator.ts   # Main orchestration class
│   ├── AgentManager.ts   # Agent coordination
│   └── agents/          # Individual agents
│       ├── SyncAgent.ts
│       ├── ReviewAgent.ts
│       ├── EnrichmentAgent.ts
│       ├── ProjectAgent.ts
│       ├── AuditAgent.ts
│       └── GuardrailsAgent.ts
├── handlers/            # Request handlers
├── clickup/            # ClickUp integration
├── storage/            # Database utilities
├── utils/              # Utility functions
└── types.ts            # TypeScript definitions
```

### Adding New Agents
1. Create agent class in `src/orchestrate/agents/`
2. Implement `execute()` method with proper error handling
3. Add `healthCheck()` method for monitoring
4. Register in `AgentManager.initializeAgents()`
5. Add to orchestration flows as needed

### Adding New Flows
1. Define flow steps in `AgentManager.initializeFlows()`
2. Implement flow execution logic
3. Add endpoint handlers in `Orchestrator.handleRequest()`
4. Update routing logic as needed

### AI Integration
The system includes stub AI enrichment that can be replaced with:
- OpenAI API integration
- Gemini API integration
- Custom AI models
- Local AI processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the documentation
- Review the test files for usage examples
- Open an issue on GitHub

---

**Note**: This system is designed for production use with proper ClickUp API credentials and Cloudflare infrastructure setup. The AI enrichment features are currently stubbed and ready for integration with actual AI services. 

### AI Writer System

The AI Writer system enables background agent collaboration through structured .agent.md files stored in R2. Each file contains:

#### File Structure
```markdown
---
title: "Task Title"
tags: ["tag1", "tag2"]
priority: "medium"
created_at: "2024-01-01T00:00:00.000Z"
status: "assigned"
related_file: "src/path/to/file.ts"
assignee: "ai-agent"
due_date: "2024-12-31"
metadata:
  category: "documentation"
  complexity: "medium"
  estimatedHours: 4
---

# Task Title

## Description

Task description goes here...

## Requirements

<!-- AI Agent: Please fill in the requirements section -->

## Implementation

<!-- AI Agent: Please provide implementation details -->

## Examples

<!-- AI Agent: Please provide code examples and usage -->

## Testing

<!-- AI Agent: Please provide testing strategies and examples -->

## Documentation

<!-- AI Agent: Please provide comprehensive documentation -->

## Related Files

- src/path/to/file.ts

## Notes

<!-- AI Agent: Please add any additional notes or considerations -->
```

#### API Usage

**Assign Agent Task**
```bash
curl -X POST https://pmo-hq.workers.dev/orchestrate/assign-agent-task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write documentation for SyncAgent",
    "description": "Document the responsibilities and logic of the SyncAgent",
    "tags": ["docs", "agent", "clickup"],
    "relatedFile": "src/orchestrate/agents/SyncAgent.ts",
    "priority": "medium"
  }'
```

**Response**
```json
{
  "success": true,
  "message": "Agent task assigned successfully",
  "data": {
    "fileKey": "agent-tasks/task-uuid.agent.md",
    "presignedUrl": "https://...",
    "metadata": {
      "title": "Write documentation for SyncAgent",
      "id": "uuid",
      "fileKey": "agent-tasks/task-uuid.agent.md",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### File Management

The AI Writer system provides comprehensive file management:

- **Create**: Generate new .agent.md files with structured content
- **Read**: Parse and extract frontmatter and body content
- **Update**: Modify existing files with new content
- **List**: Retrieve all agent task files
- **Delete**: Remove completed or obsolete files
- **Statistics**: Get task counts by priority and status

#### Collaboration Workflow

1. **Task Assignment**: Create .agent.md file via API
2. **Agent Processing**: AI agents read and process files
3. **Content Generation**: Agents fill in placeholder sections
4. **Review**: Human or automated review of generated content
5. **Integration**: Apply generated content to codebase
6. **Archive**: Move completed files to archive or delete

### Orchestration Flows
