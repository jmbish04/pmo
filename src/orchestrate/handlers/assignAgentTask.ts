/**
 * Assign Agent Task Handler
 * 
 * Handles POST /orchestrate/assign-agent-task requests to create
 * AI agent task files in R2 storage.
 */

import { writeAgentFile, AgentTask, AgentFileMetadata } from '../../ai/aiWriter';
import { logger } from '../../utils/logger';

export interface AssignAgentTaskRequest {
  title: string;
  description: string;
  tags?: string[];
  relatedFile?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
}

export interface AssignAgentTaskResponse {
  success: boolean;
  message: string;
  data?: {
    fileKey: string;
    presignedUrl?: string;
    metadata: AgentFileMetadata & { id?: string; fileKey?: string; createdAt?: string };
  };
  error?: string;
}

/**
 * Handle agent task assignment
 */
export async function handleAssignAgentTask(
  request: Request,
  env: any
): Promise<Response> {
  try {
    // Parse request body
    const body: AssignAgentTaskRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.description) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: title and description are required',
          error: 'VALIDATION_ERROR'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    logger.info('🎯 Assigning agent task', {
      title: body.title,
      priority: body.priority || 'medium',
      tags: body.tags
    });

    // Create agent task
    const result = await writeAgentFile({
      title: body.title,
      file: body.relatedFile || 'task.md',
      goal: body.description,
      details: body.tags || [],
      env
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create agent task file',
          error: result.error || 'UNKNOWN_ERROR'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    logger.info('✅ Agent task assigned successfully', {
      fileKey: result.fileKey,
      title: body.title
    });

    // Return success response
    const response: AssignAgentTaskResponse = {
      success: true,
      message: 'Agent task assigned successfully',
      data: {
        fileKey: result.fileKey,
        presignedUrl: result.presignedUrl,
        metadata: result.metadata
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    logger.error('❌ Error in assign agent task handler:', error instanceof Error ? error : new Error(String(error)));

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleAssignAgentTaskOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 