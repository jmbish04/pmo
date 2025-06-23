-- D1 Schema for logging ClickUp API requests and responses
DROP TABLE IF EXISTS api_logs;

CREATE TABLE api_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    request_method TEXT NOT NULL,
    request_url TEXT NOT NULL,
    request_headers TEXT,
    request_body TEXT,
    response_status INTEGER,
    response_body TEXT,
    user_ip TEXT,
    worker_execution_time_ms REAL
);

CREATE INDEX idx_timestamp ON api_logs (timestamp);
CREATE INDEX idx_response_status ON api_logs (response_status);

-- D1 Schema for backing up all ClickUp tasks and metadata
DROP TABLE IF EXISTS cu_workspaces;
CREATE TABLE cu_workspaces (
    id TEXT PRIMARY KEY,
    name TEXT,
    color TEXT,
    avatar TEXT,
    members TEXT, -- JSON array of member objects
    fetched_at TEXT NOT NULL
);

DROP TABLE IF EXISTS cu_spaces;
CREATE TABLE cu_spaces (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT,
    is_private BOOLEAN,
    features TEXT, -- JSON object of features
    statuses TEXT, -- JSON array of status objects
    fetched_at TEXT NOT NULL,
    FOREIGN KEY(workspace_id) REFERENCES cu_workspaces(id)
);

DROP TABLE IF EXISTS cu_folders;
CREATE TABLE cu_folders (
    id TEXT PRIMARY KEY,
    space_id TEXT NOT NULL,
    name TEXT,
    is_hidden BOOLEAN,
    override_statuses BOOLEAN,
    lists TEXT, -- JSON array of list objects
    fetched_at TEXT NOT NULL,
    FOREIGN KEY(space_id) REFERENCES cu_spaces(id)
);

DROP TABLE IF EXISTS cu_lists;
CREATE TABLE cu_lists (
    id TEXT PRIMARY KEY,
    name TEXT,
    folder_id TEXT, -- Can be NULL for folderless lists
    space_id TEXT NOT NULL,
    archived BOOLEAN,
    override_statuses BOOLEAN,
    permission_level TEXT,
    statuses TEXT, -- JSON array of status objects
    fetched_at TEXT NOT NULL,
    FOREIGN KEY(space_id) REFERENCES cu_spaces(id)
);

DROP TABLE IF EXISTS cu_tasks;
CREATE TABLE cu_tasks (
    id TEXT PRIMARY KEY,
    custom_id TEXT,
    name TEXT,
    text_content TEXT,
    description TEXT,
    status TEXT, -- JSON object for status
    orderindex TEXT,
    date_created TEXT,
    date_updated TEXT,
    date_closed TEXT,
    archived BOOLEAN,
    creator TEXT, -- JSON object for creator
    assignees TEXT, -- JSON array of assignee objects
    watchers TEXT, -- JSON array of watcher objects
    checklists TEXT, -- JSON array of checklist objects
    tags TEXT, -- JSON array of tag objects
    parent TEXT,
    priority TEXT, -- JSON object for priority
    due_date TEXT,
    start_date TEXT,
    points REAL,
    time_estimate INTEGER,
    custom_fields TEXT, -- JSON array of custom field objects
    dependencies TEXT, -- JSON array of dependency objects
    linked_tasks TEXT, -- JSON array of linked task objects
    list_id TEXT NOT NULL,
    folder_id TEXT,
    space_id TEXT NOT NULL,
    url TEXT,
    permission_level TEXT,
    fetched_at TEXT NOT NULL,
    full_object_json TEXT, -- Store the entire raw task object as a safety net
    FOREIGN KEY(list_id) REFERENCES cu_lists(id)
);

CREATE INDEX idx_tasks_list_id ON cu_tasks (list_id);
CREATE INDEX idx_tasks_date_updated ON cu_tasks (date_updated);



-- Log every API transaction
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  type TEXT NOT NULL,
  details TEXT
);

-- Store all ClickUp task info
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store AI-generated notes/alerts/guidance
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(task_id) REFERENCES tasks(id)
); 

-- ClickUp Planner Worker Initialization

-- Track tasks before AI enriches them
CREATE TABLE IF NOT EXISTS task_staging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_uuid TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT, -- Comma-separated, can normalize later if needed
  status TEXT DEFAULT 'pending', -- pending | enriched | failed | posted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Track active projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_uuid TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  clickup_id TEXT, -- Returned ClickUp ID, if pushed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Associate tasks to projects (after enrichment)
CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_uuid TEXT NOT NULL,
  task_uuid TEXT NOT NULL,
  clickup_task_id TEXT,
  enriched_json TEXT, -- optional field for later payload logs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Log enrichment events or failures
CREATE TABLE IF NOT EXISTS enrichment_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_uuid TEXT NOT NULL,
  event TEXT NOT NULL,
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);