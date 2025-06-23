-- Migration 002: Extend D1 Schema
-- Adds webhook_events, sync_log, and agent_status tables

-- Webhook events table to store ClickUp webhook payloads
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  task_id TEXT,
  project_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient querying by event type and date
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_date ON webhook_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_task_id ON webhook_events(task_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_project_id ON webhook_events(project_id);

-- Sync log table to track synchronization operations
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  summary TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT 1
);

-- Index for efficient querying by timestamp and success status
CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_log_success ON sync_log(success);

-- Agent status table to track orchestration flow states
CREATE TABLE IF NOT EXISTS agent_status (
  flow_id TEXT PRIMARY KEY,
  step_name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending',
  metadata TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient querying by state and update time
CREATE INDEX IF NOT EXISTS idx_agent_status_state ON agent_status(state);
CREATE INDEX IF NOT EXISTS idx_agent_status_updated_at ON agent_status(updated_at);

-- Projects table to store ClickUp project information
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient querying by status and update time
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);

-- Staging tasks table (extended from existing task_staging)
-- This table stores tasks that are being processed before promotion
CREATE TABLE IF NOT EXISTS staging_tasks (
  id TEXT PRIMARY KEY,
  clickup_task_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 3,
  assignees TEXT, -- JSON array of assignee IDs
  tags TEXT, -- JSON array of tags
  due_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sync_status TEXT NOT NULL DEFAULT 'pending' -- pending, enriched, promoted, error
);

-- Indexes for staging tasks
CREATE INDEX IF NOT EXISTS idx_staging_tasks_project_id ON staging_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_staging_tasks_sync_status ON staging_tasks(sync_status);
CREATE INDEX IF NOT EXISTS idx_staging_tasks_clickup_id ON staging_tasks(clickup_task_id);
CREATE INDEX IF NOT EXISTS idx_staging_tasks_updated_at ON staging_tasks(updated_at);

-- Project tasks table (final destination for processed tasks)
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  clickup_task_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 3,
  assignees TEXT, -- JSON array of assignee IDs
  tags TEXT, -- JSON array of tags
  due_date TEXT,
  enriched_data TEXT, -- JSON string of enriched data from AI
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project tasks
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_clickup_id ON project_tasks(clickup_task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_updated_at ON project_tasks(updated_at);

-- Add comments for documentation
COMMENT ON TABLE webhook_events IS 'Stores ClickUp webhook events for processing';
COMMENT ON TABLE sync_log IS 'Tracks synchronization operations and their results';
COMMENT ON TABLE agent_status IS 'Tracks the state of orchestration flows and agent steps';
COMMENT ON TABLE projects IS 'Stores ClickUp project information';
COMMENT ON TABLE staging_tasks IS 'Temporary storage for tasks being processed before promotion';
COMMENT ON TABLE project_tasks IS 'Final destination for processed and enriched tasks'; 