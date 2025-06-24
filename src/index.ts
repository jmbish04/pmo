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
import { handleAssignAgentTask, handleAssignAgentTaskOptions } from './orchestrate/handlers/assignAgentTask';
import { handleDocsRequest, handleAssignAgent } from './docs/handler';
import { handleCoderRoutes } from './routes/coder';
import { ensureTables, seedFromCSV, seedFromJSON } from './utils/seeder';

let tablesReady: Promise<void> | null = null;
function initTables(env: Env): Promise<void> {
  if (!tablesReady) {
    tablesReady = ensureTables(env);
  }
  return tablesReady;
}

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

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
  type: string;
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI: any;
  CLICKUP_API_KEY: string;
  DALL_E_ENDPOINT: string;
  CLICKUP_CLIENT_ID?: string;
  CLICKUP_CLIENT_SECRET?: string;
  CLICKUP_REDIRECT_URI?: string;
  DOCS_BUCKET: R2Bucket;
  CLICKUP_TOKEN?: string;
  CLICKUP_TEAM_ID?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    await initTables(env);

    try {
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path.startsWith('/api/docs/')) {
        if (path === '/api/docs/assign-agent' && request.method === 'POST') {
          return await handleAssignAgent(request, env, ctx);
        }
        const section = path.replace('/api/docs/', '');
        if (section) {
          return await handleDocsRequest(section, env, ctx);
        }
      }

      if (path === '/tasks/new' && request.method === 'POST') {
        return handleNewTask(request, env);
      }

      const coderResponse = await handleCoderRoutes(request, env);
      if (coderResponse) {
        return coderResponse;
      }

      if (path === '/api/seed-tasks' && request.method === 'POST') {
        const contentType = request.headers.get('Content-Type') || '';
        const text = await request.text();
        try {
          if (contentType.includes('application/json')) {
            await seedFromJSON(text, env);
          } else if (contentType.includes('text/csv')) {
            await seedFromCSV(text, env);
          } else {
            return new Response('Unsupported Content-Type for seeding.', { status: 415 });
          }
          return Response.json({ seeded: true });
        } catch (err) {
          logger.error('Seeding failed', err instanceof Error ? err : new Error(String(err)));
          return Response.json({ seeded: false, error: 'Failed to process seed data.' }, { status: 400 });
        }
      }

      if (path === '/webhook/clickup' && request.method === 'POST') {
        return handleClickUpWebhook(request, env);
      }

      if (path === '/sync' && request.method === 'POST') {
        return handleSync(request, env, ctx);
      }

      if (path.startsWith('/orchestrate')) {
        if (path === '/orchestrate/assign-agent-task') {
          if (request.method === 'OPTIONS') return handleAssignAgentTaskOptions();
          if (request.method === 'POST') return await handleAssignAgentTask(request, env);
        }
        const orchestrator = new Orchestrator(env);
        return await orchestrator.handleRequest(request);
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      logger.error('Unhandled error:', error instanceof Error ? error : new Error(String(error)));
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      logger.info('🕐 Cron job triggered', {
        cron: event.cron,
        timestamp: new Date().toISOString()
      });

      if (event.cron === '0 * * * *') {
        await handleHourlySync(env, ctx);
      } else if (event.cron === '0 */6 * * *') {
        await handlePeriodicSync(env, ctx);
      }

    } catch (error) {
      logger.error('Cron job error:', error instanceof Error ? error : new Error(String(error)));
    }
  }
};