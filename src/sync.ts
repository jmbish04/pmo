/**
 * Main Sync Module
 * 
 * Provides the main sync functions that are imported by index.ts
 * This module orchestrates the sync operations using the ClickUp sync handler
 * and agent-based synchronization.
 */

import { logger, toError } from './utils/logger';
import { handleSync as clickUpSync } from './clickup/sync';

/**
 * Handle periodic sync (triggered by cron)
 */
export async function handlePeriodicSync(
  env: Env,
  env: any,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    logger.info('Periodic sync triggered');
    
    // Use the ClickUp sync handler with bidirectional sync
    const syncRequest = new Request('internal://sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'bidirectional',
        entities: ['projects', 'tasks'],
        workspaceId: env.CLICKUP_TEAM_ID
      })
    });

    return await clickUpSync(syncRequest, env, ctx);
  } catch (error) {
    logger.error('Periodic sync error:', toError(error));
    return new Response('Periodic sync failed', { status: 500 });
  }
}

/**
 * Handle hourly sync (triggered by cron)
 */
export async function handleHourlySync(
  request: Request,
  env: any,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    logger.info('Hourly sync triggered');
    
    // Use the ClickUp sync handler with pull-only sync for hourly
    const syncRequest = new Request('internal://sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'pull',
        entities: ['tasks'],
        workspaceId: env.CLICKUP_TEAM_ID
      })
    });

    return await clickUpSync(syncRequest, env, ctx);
  } catch (error) {
    logger.error('Hourly sync error:', toError(error));
    return new Response('Hourly sync failed', { status: 500 });
  }
}

/**
 * Handle manual sync (triggered via API)
 */
export async function handleSync(
  request: Request,
  env: any,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    logger.info('Manual sync triggered');
    return await clickUpSync(request, env, ctx);
  } catch (error) {
    logger.error('Manual sync error:', toError(error));
    return new Response('Manual sync failed', { status: 500 });
  }
}