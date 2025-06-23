import { NewTaskRequest, NewTaskResponse, TaskStaging } from '../types';
import { generateUUID } from '../utils/uuid';
import { triggerAIEnrichment } from '../services/enrichmentTrigger';
import { logger, toError } from '../utils/logger';

export async function handleNewTask(request: Request, env: any): Promise<Response> {
  try {
    // Parse request body
    const body: NewTaskRequest = await request.json();
    
    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      return new Response(JSON.stringify({
        status: 'error',
        imported: 0,
        uuids: [],
        message: 'Invalid request: tasks array is required and must not be empty'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uuids: string[] = [];
    const errors: string[] = [];
    let imported = 0;

    // Process each task
    for (const task of body.tasks) {
      try {
        if (!task.title || task.title.trim() === '') {
          errors.push('Task title is required');
          continue;
        }

        const uuid = generateUUID();
        const now = new Date().toISOString();

        // Create task staging record
        const taskStaging: TaskStaging = {
          uuid,
          title: task.title.trim(),
          description: task.description?.trim() || '',
          tags: task.tags || [],
          status: 'pending',
          created_at: now,
          updated_at: now
        };

        // Insert into D1 database
        await env.DB.prepare(`
          INSERT INTO task_staging (
            uuid, title, description, tags, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          taskStaging.uuid,
          taskStaging.title,
          taskStaging.description,
          JSON.stringify(taskStaging.tags),
          taskStaging.status,
          taskStaging.created_at,
          taskStaging.updated_at
        ).run();

        uuids.push(uuid);
        imported++;

        // Trigger AI enrichment
        logger.info(`Triggering AI enrichment for task ${uuid}`);
        triggerAIEnrichment(uuid);

      } catch (error) {
        logger.error(`Error processing task:`, toError(error));
        errors.push(`Failed to process task: ${toError(error).message}`);
      }
    }

    // Prepare response
    const response: NewTaskResponse = {
      status: imported > 0 ? 'success' : 'error',
      imported,
      uuids,
      message: imported > 0 
        ? `Successfully imported ${imported} task(s)`
        : 'No tasks were imported',
      errors: errors.length > 0 ? errors : undefined
    };

    return new Response(JSON.stringify(response), {
      status: imported > 0 ? 200 : 400,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    logger.error('Error handling new task request:', toError(error));
    
    return new Response(JSON.stringify({
      status: 'error',
      imported: 0,
      uuids: [],
      message: 'Internal server error',
      errors: [toError(error).message]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 