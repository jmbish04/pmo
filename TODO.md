# Cursor Sprint Plan: ClickUp Planner Worker

This file defines the next set of tasks to be delegated to Cursor for implementation.

---

## ✅ Task 1: Webhook Handler for ClickUp

**Route**: `POST /webhook/clickup`

**Instructions**:
- Create a route handler that receives ClickUp webhook events.
- Store all received events in a new D1 table called `webhook_events`.
- Fields to include: `id`, `event_type`, `payload`, `task_id`, `project_id`, `created_at`.
- Log and return a success status.

---

## ✅ Task 2: Sync Agent for D1

**Class**: `SyncAgent` (in `/agents/SyncAgent.ts`)

**Instructions**:
- Create a new agent that syncs ClickUp tasks to D1.
- Sync by:
  - Pulling all projects from D1.
  - Fetching tasks via ClickUp API for each project.
  - Staging new tasks into a `staging_tasks` table.
  - Detecting updates and writing them into `project_tasks`.
- Include methods:
  - `syncAllProjects()`
  - `syncProjectById(project_id: string)`

---

## ✅ Task 3: Hourly Cron Job Support

**Instructions**:
- Add a new scheduled worker script.
- Configure the Cron trigger to run hourly.
- When triggered, call `SyncAgent.syncAllProjects()`.
- Log summary into new `sync_log` table.

---

## ✅ Task 4: Review and Promote Staged Tasks

**Flow**: `reviewStagedTasks`

**Instructions**:
- Add a new orchestration step in `AgentManager`.
- Reads all entries in `staging_tasks`.
- Enrich with AI if missing `unit_tests` or `description`.
- Move completed records to `project_tasks`.
- Mark processed `staging_tasks` rows as `inactive`.

---

## ✅ Task 5: Extend D1 Schema

**Instructions**:
- Update SQL schema to include:

```sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT,
  payload TEXT,
  task_id TEXT,
  project_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  summary TEXT,
  success BOOLEAN
);

CREATE TABLE IF NOT EXISTS agent_status (
  flow_id TEXT PRIMARY KEY,
  step_name TEXT,
  state TEXT,
  metadata TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```