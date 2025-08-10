-- Migration 003: Usage ingestion table

CREATE TABLE IF NOT EXISTS usage_data (
  id TEXT PRIMARY KEY,
  coder_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage_data(created_at);

