/**
 * Cloudflare Workers Entry Point
 * 
 * This is the main entry point for the ClickUp Planner Worker.
 * Handles incoming requests and routes them to appropriate handlers.
 * 
 * Features:
 * - Webhook handling for ClickUp events
 * - API endpoints for orchestration
 * - Health checks and monitoring
 * - CORS handling for cross-origin requests
 * - Documentation delivery system
 */


import { validateEnv } from "./utils/validateEnv";
import { Orchestrate } from './orchestrate/Orchestrate';
import { handleWebhook } from './clickup/webhook';
import { logger, toError } from './utils/logger';
import { handleNewTask } from './handlers/newTask';
import { Orchestrator } from './orchestrate/Orchestrator';
import { handleAssignAgentTask, handleAssignAgentTaskOptions } from './handlers/assignAgentTask';
import { handleDocsRequest, handleAssignAgent } from './docs/handler';
// import { exchangeClickUpCodeForToken, storeToken, logTransaction, analyzeTaskChange, addNote, upsertTask, searchReusableFeatures, checkUnitTestingInNotes, reopenOrCreateSubtask, checkPriorTasksCompletion } from './utils';

// Cloudflare Worker types
interface D1Database {
  prepare: (query: string) => any;
  batch: (statements: any[]) => Promise<any>;
  exec: (query: string) => Promise<any>;
}

interface KVNamespace {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: (options?: any) => Promise<any>;
}

interface R2Bucket {
  get: (key: string) => Promise<any>;
  put: (key: string, value: any, options?: any) => Promise<any>;
  delete: (key: string) => Promise<any>;
  list: (options?: any) => Promise<any>;
  createMultipartUpload: (key: string) => Promise<any>;
}

// Request body interfaces
interface EnrichRequestBody {
  taskId?: string;
  taskData?: any;
}

interface ReviewStagedTasksBody {
  batchSize?: number;
  priority?: string;
}

interface SyncRequestBody {
  source?: string;
  fullSync?: boolean;
}

interface OrchestrationRequest {
  flowName: string;
  action: string;
  data: Record<string, any>;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ExecutionContext is defined in worker-configuration.d.ts

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
  type: string;
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI: any; // Cloudflare AI binding
  CLICKUP_API_KEY: string;
  DALL_E_ENDPOINT: string;
  CLICKUP_CLIENT_ID?: string;
  CLICKUP_CLIENT_SECRET?: string;
  CLICKUP_REDIRECT_URI?: string;
  DOCS_BUCKET: R2Bucket; // R2 bucket for documentation content
  CLICKUP_TOKEN?: string;
  CLICKUP_TEAM_ID?: string;
}

async function fetchAllClickUpTasks(token: string) {
  // Fetch all tasks for the authenticated user (simplified, may need pagination for large workspaces)
  const response = await fetch('https://api.clickup.com/api/v2/task', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.status}`);
  const data = await response.json() as any;
  return data.tasks || [];
}

async function getPersonalToken(env: Env) {
  // Get the first personal token from KV
  const list = await env.KV.list({ prefix: 'personal_token_' });
  if (!list.keys.length) return null;
  return await env.KV.get(list.keys[0].name);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Documentation API routes
      if (path.startsWith('/api/docs/')) {
        // Handle assign agent request
        if (path === '/api/docs/assign-agent' && request.method === 'POST') {
          return await handleAssignAgent(request, env, ctx);
        }
        
        // Handle documentation section requests
        const section = path.replace('/api/docs/', '');
        if (section) {
          return await handleDocsRequest(section, env, ctx);
        }
      }

      // Task management routes
      if (path === '/tasks/new' && request.method === 'POST') {
        return handleNewTask(request, env);
      }

      // ClickUp webhook routes
      if (path === '/webhook/clickup' && request.method === 'POST') {
        return handleClickUpWebhook(request, env);
      }

      // Sync routes
      if (path === '/sync' && request.method === 'POST') {
        return handleSync(request, env, ctx);
      }

      // Orchestration routes - use new Orchestrator
      if (path.startsWith('/orchestrate')) {
        // Handle assign-agent-task endpoint
        if (path === '/orchestrate/assign-agent-task') {
          if (request.method === 'OPTIONS') {
            return handleAssignAgentTaskOptions();
          }
          if (request.method === 'POST') {
            return await handleAssignAgentTask(request, env);
          }
        }
        
        // Use Orchestrator for other orchestration routes
        const orchestrator = new Orchestrator(env);
        return await orchestrator.handleRequest(request);
      }

      // Default 404 response
      return new Response('Not Found', { status: 404 });

    } catch (error) {
      logger.error('Unhandled error in main handler:', error instanceof Error ? error : new Error(String(error)));
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  // Scheduled function for periodic tasks
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      logger.info('🕐 Cron job triggered', {
        cron: event.cron,
        timestamp: new Date().toISOString()
      });

      if (event.cron === '0 * * * *') {
        // Hourly sync
        await handleHourlySync(env, ctx);
      } else if (event.cron === '0 */6 * * *') {
        // Every 6 hours - existing sync
        await handlePeriodicSync(env, ctx);
      }

    } catch (error) {
      logger.error('Cron job error:', error instanceof Error ? error : new Error(String(error)));
    }
  }
};

// ClickUp webhook handler
async function handleClickUpWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const payload = await request.json() as any;
    logger.info('ClickUp webhook received:', payload);

    // TODO: Process ClickUp webhook events
    // - Task created/updated
    // - Project changes
    // - Status updates

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    logger.error('ClickUp webhook error:', toError(error));
    return new Response('Webhook processing failed', { status: 500 });
  }
}

// Sync handler
async function handleSync(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const orchestrator = new Orchestrator(env);
    
    // Create sync request with proper flowName
    const syncRequest: OrchestrationRequest = {
      flowName: 'sync',
      action: 'sync',
      data: { source: 'manual_request' },
      config: { fullSync: true },
      metadata: { timestamp: new Date().toISOString() }
    };

    return await orchestrator.handleRequest(syncRequest as any);
  } catch (error) {
    logger.error('Sync error:', toError(error));
    return new Response('Sync failed', { status: 500 });
  }
}

// Orchestration handler
async function handleOrchestration(request: Request, env: Env): Promise<Response> {
  try {
    const { AgentManager } = await import('./orchestrate/AgentManager');
    const agentManager = new AgentManager(env);
    
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle enrich-task endpoint
    if (path === '/orchestrate/enrich-task' && request.method === 'POST') {
      return handleEnrichTask(request, agentManager);
    }

    // Handle review staged tasks endpoint
    if (path === '/orchestrate/review-staged-tasks' && request.method === 'POST') {
      return handleReviewStagedTasks(request, agentManager);
    }

    // Handle other orchestration actions
    const action = url.searchParams.get('action');

    switch (action) {
      case 'new-project':
        // TODO: Implement new project handling
        return new Response('New project handling not implemented', { status: 501 });
      case 'sync':
        // TODO: Implement sync handling
        return new Response('Sync handling not implemented', { status: 501 });
      case 'review-staged':
        // TODO: Implement review staged handling
        return new Response('Review staged handling not implemented', { status: 501 });
      default:
        return new Response('Invalid orchestration action', { status: 400 });
    }
  } catch (error) {
    logger.error('Orchestration error:', toError(error));
    return new Response('Orchestration failed', { status: 500 });
  }
}

// Enrich task handler
async function handleEnrichTask(request: Request, agentManager: any): Promise<Response> {
  try {
    const body = await request.json() as EnrichRequestBody;
    const { taskId, taskData } = body;

    if (!taskId && !taskData) {
      return new Response(
        JSON.stringify({ error: 'taskId or taskData is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create orchestration request with proper flowName
    const orchestrationRequest: OrchestrationRequest = {
      flowName: 'enrichTask',
      action: 'enrich',
      data: { taskId, taskData },
      config: { enrichAll: true },
      metadata: { timestamp: new Date().toISOString() }
    };

    const result = await agentManager.executeFlow('enrichTask', orchestrationRequest);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Enrich task error:', toError(error));
    return new Response(
      JSON.stringify({ error: 'Enrichment failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Review staged tasks handler
async function handleReviewStagedTasks(request: Request, agentManager: any): Promise<Response> {
  try {
    const body = await request.json() as ReviewStagedTasksBody;
    const { batchSize = 10, priority = 'medium' } = body;

    // Create orchestration request with proper flowName
    const orchestrationRequest: OrchestrationRequest = {
      flowName: 'reviewStagedTasks',
      action: 'review',
      data: { batchSize, priority },
      config: { autoPromote: true },
      metadata: { timestamp: new Date().toISOString() }
    };

    const result = await agentManager.executeFlow('reviewStagedTasks', orchestrationRequest);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Review staged tasks error:', toError(error));
    return new Response(
      JSON.stringify({ error: 'Review failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to get task from database
async function getTaskFromDatabase(taskId: string): Promise<any> {
  // TODO: Implement actual database query
  // This is a stub implementation
  return {
    uuid: taskId,
    title: 'Sample Task',
    description: 'This is a sample task for testing',
    tags: ['test', 'sample'],
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Helper function to get staged tasks
async function getStagedTasks(): Promise<any[]> {
  // TODO: Implement actual database query
  // This is a stub implementation
  return [
    {
      id: 'staged-task-1',
      clickup_task_id: 'clickup-task-1',
      project_id: 'project-1',
      title: 'Implement user authentication',
      description: '',
      status: 'pending',
      priority: 3,
      tags: ['backend', 'security'],
      sync_status: 'pending'
    }
  ];
}

// Helper function to update staged task
async function updateStagedTask(taskId: string, enrichedData: any): Promise<void> {
  // TODO: Implement actual database update
  logger.info(`📝 Updated staged task ${taskId} with enriched data`);
}

// Helper function to promote task
async function promoteTask(task: any): Promise<void> {
  // TODO: Implement actual task promotion
  logger.info(`🚀 Promoted task ${task.id} to project_tasks`);
}

// Helper function to mark staged task as inactive
async function markStagedTaskInactive(taskId: string): Promise<void> {
  // TODO: Implement actual database update
  logger.info(`🏁 Marked staged task ${taskId} as inactive`);
}

// Helper function to generate UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Hourly sync handler
async function handleHourlySync(env: Env, ctx: ExecutionContext): Promise<void> {
  try {
    logger.info('🔄 Starting hourly sync');

    const orchestrator = new Orchestrator(env);
    
    // Create sync request
    const syncRequest = new Request('http://localhost/orchestrate/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        data: { source: 'hourly_cron' },
        config: { fullSync: true },
        metadata: { timestamp: new Date().toISOString() }
      })
    });

    const result = await orchestrator.handleRequest(syncRequest);
    
    if (!result.ok) {
      throw new Error(`Hourly sync failed: ${result.status}`);
    }

    logger.info('✅ Hourly sync completed');

  } catch (error) {
    logger.error('❌ Hourly sync failed:', toError(error));
  }
}

// Periodic sync handler (existing)
async function handlePeriodicSync(env: Env, ctx: ExecutionContext): Promise<void> {
  try {
    logger.info('🔄 Starting periodic sync (6-hour)');

    const orchestrator = new Orchestrator(env);
    
    // Create sync request
    const syncRequest = new Request('http://localhost/orchestrate/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        data: { source: 'periodic_cron' },
        config: { fullSync: true },
        metadata: { timestamp: new Date().toISOString() }
      })
    });

    const result = await orchestrator.handleRequest(syncRequest);
    
    if (!result.ok) {
      throw new Error(`Periodic sync failed: ${result.status}`);
    }

    logger.info('✅ Periodic sync completed');

  } catch (error) {
    logger.error('❌ Periodic sync failed:', toError(error));
  }
} 
