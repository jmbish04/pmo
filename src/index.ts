/**
 * Cloudflare Workers Entry Point
 * 
 * Handles:
 * - ClickUp Webhooks
 * - Task orchestration
 * - Coder task lifecycle
 * - Documentation agent interaction
 * - Seeding and ingestion
 * - Cron-based task sync
 */

import { validateEnv } from "./utils/validateEnv";
import { logger, toError } from './utils/logger';
import { ensureTables, seedFromCSV, seedFromJSON } from './utils/seeder';
import { handleWebhook as handleClickUpWebhook } from './clickup/webhook';
import { handleNewTask } from './handlers/newTask';
import { Orchestrator } from './orchestrate/Orchestrator';
import { handleAssignAgentTask, handleAssignAgentTaskOptions } from './orchestrate/handlers/assignAgentTask';
import { handleDocsRequest, handleAssignAgent } from './docs/handler';
import { handleCoderRoutes } from './routes/coder';
import { ingest } from './routes/ingest';
import { handlePeriodicSync, handleHourlySync, handleSync } from './sync';

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

let tablesReady: Promise<void> | null = null;
function initTables(env: Env): Promise<void> {
  if (!tablesReady) {
    tablesReady = ensureTables(env);
  }
  return tablesReady;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    await initTables(env);

    try {
      if (path === '/health') {
        return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // Docs endpoints
      if (path.startsWith('/api/docs/')) {
        if (path === '/api/docs/assign-agent' && request.method === 'POST') {
          return await handleAssignAgent(request, env, ctx);
        }
        const section = path.replace('/api/docs/', '');
        return await handleDocsRequest(section, env, ctx);
      }

      // New task creation
      if (path === '/tasks/new' && request.method === 'POST') {
        return handleNewTask(request, env);
      }

      // Coder routes (start, complete, error, next)
      const coderResponse = await handleCoderRoutes(request, env);
      if (coderResponse) return coderResponse;

      // Ingest route
      if (path === '/api/v1/ingest' && request.method === 'POST') {
        return ingest(request, env);
      }

      // Seed tasks
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
          logger.error('Seeding failed', toError(err));
          return Response.json({ seeded: false, error: 'Failed to process seed data.' }, { status: 400 });
        }
      }

      // ClickUp webhook
      if (path === '/webhook/clickup' && request.method === 'POST') {
        return handleClickUpWebhook(request, env, ctx);
      }

      // Manual sync trigger
      if (path === '/sync' && request.method === 'POST') {
        return handleSync(request, env, ctx);
      }

      // Orchestration endpoint
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
      logger.error('Unhandled error', toError(error));
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
        // Create a mock request for hourly sync
        const mockRequest = new Request('internal://sync/hourly', { method: 'POST' });
        await handleHourlySync(mockRequest, env, ctx);
      } else if (event.cron === '0 */6 * * *') {
        // Create a mock request for periodic sync
        const mockRequest = new Request('internal://sync/periodic', { method: 'POST' });
        await handlePeriodicSync(mockRequest, env, ctx);
      }

    } catch (error) {
      logger.error('Cron job error', toError(error));
    }
  }
};