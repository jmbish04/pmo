/**
 * ClickUp Webhook Handler
 * 
 * Handles incoming webhook events from ClickUp and stores them in D1.
 * Supports task creation, updates, project changes, and other ClickUp events.
 */

import { ClickUpWebhookPayload } from '../types';
import { logger, toError } from '../utils/logger';
import { generateUUID } from '../utils/uuid';

export interface WebhookEvent {
  id: string;
  event_type: string;
  payload: string;
  task_id?: string;
  project_id?: string;
  created_at: string;
}

export async function handleClickUpWebhook(request: Request, env: any): Promise<Response> {
  try {
    const payload: ClickUpWebhookPayload = await request.json();
    logger.info('📥 ClickUp webhook received:', {
      event: payload.event,
      taskId: payload.task_id,
      projectId: payload.project_id,
      timestamp: payload.timestamp
    });

    // Extract relevant IDs from the payload
    const taskId = payload.task_id || extractTaskIdFromPayload(payload);
    const projectId = payload.project_id || extractProjectIdFromPayload(payload);

    // Create webhook event record
    const webhookEvent: WebhookEvent = {
      id: generateUUID(),
      event_type: payload.event,
      payload: JSON.stringify(payload),
      task_id: taskId,
      project_id: projectId,
      created_at: new Date().toISOString()
    };

    // Store in D1 database
    await env.DB.prepare(`
      INSERT INTO webhook_events (
        id, event_type, payload, task_id, project_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      webhookEvent.id,
      webhookEvent.event_type,
      webhookEvent.payload,
      webhookEvent.task_id,
      webhookEvent.project_id,
      webhookEvent.created_at
    ).run();

    logger.info('✅ Webhook event stored successfully', {
      eventId: webhookEvent.id,
      eventType: webhookEvent.event_type
    });

    // Process the webhook based on event type
    await processWebhookEvent(webhookEvent, env);

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Webhook processed successfully',
      eventId: webhookEvent.id,
      timestamp: webhookEvent.created_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('❌ ClickUp webhook processing failed:', toError(error));
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to process webhook',
      error: toError(error).message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Extract task ID from webhook payload
 */
function extractTaskIdFromPayload(payload: ClickUpWebhookPayload): string | undefined {
  if (payload.data?.task?.id) {
    return payload.data.task.id;
  }
  
  if (payload.data?.task_id) {
    return payload.data.task_id;
  }
  
  // Try to extract from various payload structures
  const payloadStr = JSON.stringify(payload);
  const taskIdMatch = payloadStr.match(/"task_id"\s*:\s*"([^"]+)"/);
  if (taskIdMatch) {
    return taskIdMatch[1];
  }
  
  return undefined;
}

/**
 * Extract project ID from webhook payload
 */
function extractProjectIdFromPayload(payload: ClickUpWebhookPayload): string | undefined {
  if (payload.data?.project?.id) {
    return payload.data.project.id;
  }
  
  if (payload.data?.project_id) {
    return payload.data.project_id;
  }
  
  // Try to extract from various payload structures
  const payloadStr = JSON.stringify(payload);
  const projectIdMatch = payloadStr.match(/"project_id"\s*:\s*"([^"]+)"/);
  if (projectIdMatch) {
    return projectIdMatch[1];
  }
  
  return undefined;
}

/**
 * Process webhook event based on event type
 */
async function processWebhookEvent(event: WebhookEvent, env: any): Promise<void> {
  try {
    switch (event.event_type) {
      case 'taskCreated':
        await handleTaskCreated(event, env);
        break;
      case 'taskUpdated':
        await handleTaskUpdated(event, env);
        break;
      case 'taskDeleted':
        await handleTaskDeleted(event, env);
        break;
      case 'projectCreated':
        await handleProjectCreated(event, env);
        break;
      case 'projectUpdated':
        await handleProjectUpdated(event, env);
        break;
      default:
        logger.info(`📋 Unhandled webhook event type: ${event.event_type}`, {
          eventId: event.id
        });
    }
  } catch (error) {
    logger.error(`❌ Error processing webhook event ${event.event_type}:`, toError(error));
  }
}

/**
 * Handle task created event
 */
async function handleTaskCreated(event: WebhookEvent, env: any): Promise<void> {
  logger.info('🆕 Processing task created event', {
    taskId: event.task_id,
    eventId: event.id
  });
  
  // TODO: Implement task creation logic
  // - Fetch task details from ClickUp API
  // - Create task in staging_tasks table
  // - Trigger enrichment if needed
}

/**
 * Handle task updated event
 */
async function handleTaskUpdated(event: WebhookEvent, env: any): Promise<void> {
  logger.info('🔄 Processing task updated event', {
    taskId: event.task_id,
    eventId: event.id
  });
  
  // TODO: Implement task update logic
  // - Fetch updated task details from ClickUp API
  // - Update task in project_tasks table
  // - Trigger re-enrichment if needed
}

/**
 * Handle task deleted event
 */
async function handleTaskDeleted(event: WebhookEvent, env: any): Promise<void> {
  logger.info('🗑️ Processing task deleted event', {
    taskId: event.task_id,
    eventId: event.id
  });
  
  // TODO: Implement task deletion logic
  // - Mark task as deleted in project_tasks table
  // - Clean up related data
}

/**
 * Handle project created event
 */
async function handleProjectCreated(event: WebhookEvent, env: any): Promise<void> {
  logger.info('🆕 Processing project created event', {
    projectId: event.project_id,
    eventId: event.id
  });
  
  // TODO: Implement project creation logic
  // - Fetch project details from ClickUp API
  // - Create project record in D1
  // - Trigger initial sync for the project
}

/**
 * Handle project updated event
 */
async function handleProjectUpdated(event: WebhookEvent, env: any): Promise<void> {
  logger.info('🔄 Processing project updated event', {
    projectId: event.project_id,
    eventId: event.id
  });
  
  // TODO: Implement project update logic
  // - Fetch updated project details from ClickUp API
  // - Update project record in D1
  // - Trigger sync for the project
} 