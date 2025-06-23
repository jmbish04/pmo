// Core task types
export interface NewTaskRequest {
  tasks: {
    title: string;
    description?: string;
    tags?: string[];
  }[];
}

export interface TaskStaging {
  uuid: string;
  title: string;
  description?: string;
  tags?: string[];
  status: 'pending' | 'processing' | 'enriched' | 'error';
  created_at: string;
  updated_at: string;
}

// ClickUp integration types
export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: number;
  assignees?: string[];
  tags?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ClickUpProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Webhook types
export interface ClickUpWebhookPayload {
  event: string;
  task_id?: string;
  project_id?: string;
  timestamp: string;
  data?: {
    task?: {
      id: string;
      name: string;
      status: string;
    };
    project?: {
      id: string;
      name: string;
    };
    task_id?: string;
    project_id?: string;
  };
}

// AI enrichment types
export interface EnrichmentRequest {
  uuid: string;
  task: TaskStaging;
  priority: 'low' | 'medium' | 'high';
  requirements?: string[];
}

export interface EnrichmentResult {
  uuid: string;
  enriched_task: {
    title: string;
    description: string;
    priority: number;
    estimated_hours?: number;
    dependencies?: string[];
    assignee_suggestions?: string[];
    tags: string[];
    unit_tests?: string[];
  };
  confidence_score: number;
  processing_time: number;
}

// API response types
export interface NewTaskResponse {
  status: 'success' | 'error';
  imported: number;
  uuids: string[];
  message?: string;
  errors?: string[];
}

export interface EnrichmentResponse {
  status: 'queued' | 'processing' | 'completed' | 'error';
  uuid: string;
  message: string;
  timestamp: string;
}

// Environment types
export interface Env {
  DOCS_BUCKET: R2Bucket;
  DB: D1Database;
  CLICKUP_TOKEN?: string;
  CLICKUP_TEAM_ID?: string;
}

// Orchestration types
export interface AgentConfig {
  name: string;
  type: 'ai' | 'sync' | 'audit' | 'guardrails' | 'template' | 'enrichment';
  enabled: boolean;
  priority: number;
  config?: Record<string, any>;
}

export interface FlowConfig {
  name: string;
  agents: string[];
  triggers: string[];
  enabled: boolean;
  steps?: Array<{
    agent: string;
    step: string;
  }>;
  config?: {
    timeout?: number;
    retryAttempts?: number;
  };
}

// Agent context for orchestration
export interface AgentContext {
  flowId: string;
  request: OrchestrationRequest;
  results: any[];
  currentResult?: any;
  stepIndex?: number;
  metadata: {
    startTime: string;
    flowName: string;
  };
  step?: { config?: any; [key: string]: any };
}

// Orchestration request types
export interface OrchestrationRequest {
  flowName: string;
  taskId?: string;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface OrchestrationResponse {
  status: 'success' | 'error';
  flowId: string;
  result?: any;
  message?: string;
  errors?: string[];
  processingTime?: number;
}

export interface OrchestrationResult {
  success: boolean;
  flowId: string;
  results?: any[];
  error?: string;
  metadata?: {
    startTime: string;
    endTime?: string;
    duration?: number;
    flowName?: string;
    error?: string;
  };
}

// Flow execution types
export interface FlowExecution {
  flowId: string;
  flowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  result?: any;
  errors?: string[];
}

// Agent execution result
export interface AgentExecutionResult {
  agentName: string;
  status: 'success' | 'error';
  result?: any;
  error?: string;
  processingTime: number;
}

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  event_type: string;
  payload: string;
  task_id?: string;
  project_id?: string;
  created_at: string;
}

// Sync Result Types
export interface SyncResult {
  projectsSynced: number;
  tasksSynced: number;
  errors: string[];
  processingTime: number;
}

// Staging Task Types
export interface StagingTask {
  id: string;
  clickup_task_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  assignees?: string[];
  tags?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'enriched' | 'promoted' | 'error';
  unit_tests?: string[];
  effort_estimate?: number;
  success_criteria?: string[];
  dependencies?: string[];
}

// Project Task Types
export interface ProjectTask {
  id: string;
  clickup_task_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  assignees?: string[];
  tags?: string[];
  due_date?: string;
  enriched_data?: string; // JSON string of enriched data
  created_at: string;
  updated_at: string;
}

// Agent Status Types
export interface AgentStatus {
  flow_id: string;
  step_name: string;
  state: 'pending' | 'running' | 'completed' | 'failed';
  metadata?: string;
  updated_at: string;
}

// Sync Log Types
export interface SyncLog {
  id: number;
  timestamp: string;
  summary: string;
  success: boolean;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    agentName: string;
    processingTime: number;
    timestamp: string;
  };
}

// Cloudflare Workers types
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1Result>;
  first(): Promise<any>;
}

interface D1Result {
  results?: any[];
  meta?: any;
  success?: boolean;
  error?: string;
}

interface KVNamespace {
  get(key: string, type?: 'text'): Promise<string | null>;
  get(key: string, type?: 'json'): Promise<any | null>;
  get(key: string, type?: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string, type?: 'stream'): Promise<ReadableStream | null>;
  getWithMetadata<T>(key: string, type?: 'text'): Promise<KVNamespaceGetWithMetadataResult<string, unknown> | null>;
  getWithMetadata<T>(key: string, type?: 'json'): Promise<KVNamespaceGetWithMetadataResult<any, unknown> | null>;
  getWithMetadata<T>(key: string, type?: 'arrayBuffer'): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, unknown> | null>;
  getWithMetadata<T>(key: string, type?: 'stream'): Promise<KVNamespaceGetWithMetadataResult<ReadableStream, unknown> | null>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>>;
}

interface KVNamespaceGetWithMetadataResult<T, M> {
  value: T;
  metadata: M;
}

interface KVNamespacePutOptions {
  expirationTtl?: number;
  expiration?: number;
  metadata?: unknown;
}

interface KVNamespaceListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
}

interface KVNamespaceListResult<M> {
  keys: KVNamespaceListKey<M>[];
  list_complete: boolean;
  cursor?: string;
}

interface KVNamespaceListKey<M> {
  name: string;
  expiration?: number;
  metadata?: M;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2ListResult>;
}

interface R2ObjectBody {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpEtag: string;
  checksums: R2Checksums;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  json(): Promise<any>;
  text(): Promise<string>;
}

interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  include?: string[];
}

interface R2ListResult {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  checksums: R2Checksums;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2Checksums {
  md5?: string;
  sha1?: string;
  sha256?: string;
}

interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
} 